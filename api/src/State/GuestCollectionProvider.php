<?php

namespace App\State;

use ApiPlatform\Metadata\Operation;
use ApiPlatform\State\ProviderInterface;
use App\ApiResource\Guest;
use App\Repository\UserRepository;

/**
 * @implements ProviderInterface<Guest>
 */
final readonly class GuestCollectionProvider implements ProviderInterface
{
    public function __construct(private UserRepository $users)
    {
    }

    /**
     * @return list<Guest>
     */
    public function provide(Operation $operation, array $uriVariables = [], array $context = []): array
    {
        return array_map(
            static fn (array $row): Guest => new Guest(
                $row['user']->getId()->toRfc4122(),
                $row['user']->getFirstName(),
                $row['user']->getLastName(),
                $row['photoCount'],
            ),
            $this->users->findAllWithPhotoCount(),
        );
    }
}
