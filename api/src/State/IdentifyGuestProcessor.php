<?php

namespace App\State;

use ApiPlatform\Metadata\Operation;
use ApiPlatform\State\ProcessorInterface;
use App\ApiResource\Guest;
use App\Dto\GuestIdentification;
use App\Entity\Device;
use App\Entity\User;
use App\Exception\IdentityCheckRequiredException;
use App\Guest\NameNormalizer;
use App\Repository\PhotoRepository;
use App\Repository\UserRepository;
use App\Security\DeviceToken;
use App\Security\DeviceTokenAuthenticator;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Symfony\Component\HttpFoundation\RequestStack;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;

/**
 * @implements ProcessorInterface<GuestIdentification, Guest>
 */
final class IdentifyGuestProcessor implements ProcessorInterface
{
    public const string TOKEN_ATTRIBUTE = '_device_token';

    public function __construct(
        #[Autowire(env: 'EVENT_CODE')]
        private readonly string $eventCode,
        private readonly NameNormalizer $nameNormalizer,
        private readonly UserRepository $users,
        private readonly PhotoRepository $photos,
        private readonly EntityManagerInterface $entityManager,
        private readonly Security $security,
        private readonly RequestStack $requestStack,
    ) {
    }

    public function process(mixed $data, Operation $operation, array $uriVariables = [], array $context = []): Guest
    {
        if (!hash_equals($this->eventCode, $data->eventCode)) {
            throw new AccessDeniedHttpException('Invalid event code.');
        }

        $firstName = $this->nameNormalizer->clean($data->firstName);
        $lastName = $this->nameNormalizer->clean($data->lastName);
        $normalizedName = $this->nameNormalizer->normalize($firstName, $lastName);

        // Homonyms who answered "not me" have their own account: attach to the first one
        $existing = $this->users->findOneBy(['normalizedName' => $normalizedName], ['createdAt' => 'ASC']);

        if (null !== $existing && null === $data->sameGuest) {
            throw new IdentityCheckRequiredException($firstName.' '.$lastName);
        }

        $user = null !== $existing && true === $data->sameGuest ? $existing : null;
        if (null === $user) {
            $user = new User($firstName, $lastName, $normalizedName);
            $this->entityManager->persist($user);
        }

        $token = DeviceToken::generate();
        $this->entityManager->persist(new Device($user, DeviceToken::hash($token)));
        $this->entityManager->flush();

        $this->requestStack->getCurrentRequest()?->attributes->set(self::TOKEN_ATTRIBUTE, $token);
        $this->security->login($user, DeviceTokenAuthenticator::class);

        return CurrentGuestProvider::fromUser($user, $this->photos);
    }
}
