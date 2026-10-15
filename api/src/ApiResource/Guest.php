<?php

namespace App\ApiResource;

use ApiPlatform\Metadata\ApiProperty;
use ApiPlatform\Metadata\ApiResource;
use ApiPlatform\Metadata\Get;
use ApiPlatform\Metadata\GetCollection;
use ApiPlatform\Metadata\Post;
use App\Dto\GuestIdentification;
use App\State\CurrentGuestProvider;
use App\State\GuestCollectionProvider;
use App\State\GuestProvider;
use App\State\IdentifyGuestProcessor;
use Symfony\Component\Routing\Requirement\Requirement;

#[ApiResource(
    operations: [
        new Get(
            uriTemplate: '/guests/{id}',
            requirements: ['id' => Requirement::UUID],
            security: "is_granted('ROLE_ADMIN')",
            provider: GuestProvider::class,
        ),
        new Get(
            uriTemplate: '/guests/me',
            security: "is_granted('ROLE_GUEST')",
            provider: CurrentGuestProvider::class,
        ),
        new GetCollection(
            uriTemplate: '/guests',
            paginationEnabled: false,
            security: "is_granted('ROLE_ADMIN')",
            provider: GuestCollectionProvider::class,
        ),
        new Post(
            uriTemplate: '/guests',
            input: GuestIdentification::class,
            processor: IdentifyGuestProcessor::class,
        ),
    ],
)]
final class Guest
{
    public function __construct(
        #[ApiProperty(identifier: true)]
        public readonly string $id,
        public readonly string $firstName,
        public readonly string $lastName,
        public readonly int $photoCount,
        public readonly bool $isAdmin = false,
    ) {
    }
}
