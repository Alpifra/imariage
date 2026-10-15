<?php

namespace App\Security;

use App\Repository\DeviceRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Security\Core\Authentication\Token\Storage\TokenStorageInterface;
use Symfony\Component\Security\Core\Authentication\Token\TokenInterface;
use Symfony\Component\Security\Core\Exception\AuthenticationException;
use Symfony\Component\Security\Core\Exception\CustomUserMessageAuthenticationException;
use Symfony\Component\Security\Http\Authenticator\AbstractAuthenticator;
use Symfony\Component\Security\Http\Authenticator\Passport\Badge\UserBadge;
use Symfony\Component\Security\Http\Authenticator\Passport\Passport;
use Symfony\Component\Security\Http\Authenticator\Passport\SelfValidatingPassport;

final class DeviceTokenAuthenticator extends AbstractAuthenticator
{
    public function __construct(
        private readonly DeviceRepository $devices,
        private readonly EntityManagerInterface $entityManager,
        private readonly TokenStorageInterface $tokenStorage,
    ) {
    }

    public function supports(Request $request): bool
    {
        // Once authenticated, the session takes over: re-authenticating on every request
        // would migrate the session each time and downgrade an admin who also holds a device cookie
        return $request->cookies->has(DeviceToken::COOKIE_NAME) && null === $this->tokenStorage->getToken();
    }

    public function authenticate(Request $request): Passport
    {
        $token = (string) $request->cookies->get(DeviceToken::COOKIE_NAME);
        $device = $this->devices->findOneBy(['tokenHash' => DeviceToken::hash($token)]);

        if (null === $device) {
            throw new CustomUserMessageAuthenticationException('Unknown device.');
        }

        $device->touch();
        $this->entityManager->flush();
        $user = $device->getUser();

        return new SelfValidatingPassport(new UserBadge($user->getUserIdentifier(), static fn () => $user));
    }

    public function onAuthenticationSuccess(Request $request, TokenInterface $token, string $firewallName): ?Response
    {
        return null;
    }

    public function onAuthenticationFailure(Request $request, AuthenticationException $exception): ?Response
    {
        return null;
    }
}
