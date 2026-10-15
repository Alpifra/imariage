<?php

namespace App\State;

use ApiPlatform\Metadata\Operation;
use ApiPlatform\State\ProviderInterface;
use App\ApiResource\Guest;
use App\Repository\PhotoRepository;
use App\Repository\UserRepository;
use Symfony\Component\Uid\Uuid;

/**
 * @implements ProviderInterface<Guest>
 */
final readonly class GuestProvider implements ProviderInterface
{
    public function __construct(
        private UserRepository $users,
        private PhotoRepository $photos,
    ) {
    }

    public function provide(Operation $operation, array $uriVariables = [], array $context = []): ?Guest
    {
        $user = $this->users->find(Uuid::fromString((string) $uriVariables['id']));

        return null !== $user ? CurrentGuestProvider::fromUser($user, $this->photos) : null;
    }
}
