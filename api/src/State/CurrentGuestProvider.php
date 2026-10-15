<?php

namespace App\State;

use ApiPlatform\Metadata\Operation;
use ApiPlatform\State\ProviderInterface;
use App\ApiResource\Guest;
use App\Entity\User;
use App\Repository\PhotoRepository;
use Symfony\Bundle\SecurityBundle\Security;

/**
 * @implements ProviderInterface<Guest>
 */
final class CurrentGuestProvider implements ProviderInterface
{
    public function __construct(
        private readonly Security $security,
        private readonly PhotoRepository $photos,
    ) {
    }

    public function provide(Operation $operation, array $uriVariables = [], array $context = []): ?Guest
    {
        $user = $this->security->getUser();

        return $user instanceof User ? self::fromUser($user, $this->photos) : null;
    }

    public static function fromUser(User $user, PhotoRepository $photos): Guest
    {
        return new Guest(
            $user->getId()->toRfc4122(),
            $user->getFirstName(),
            $user->getLastName(),
            $photos->count(['author' => $user]),
        );
    }
}
