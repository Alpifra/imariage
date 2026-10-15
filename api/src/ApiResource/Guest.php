<?php

namespace App\ApiResource;

use ApiPlatform\Metadata\ApiProperty;
use ApiPlatform\Metadata\ApiResource;
use ApiPlatform\Metadata\Get;
use ApiPlatform\Metadata\Post;
use App\Dto\GuestIdentification;
use App\State\CurrentGuestProvider;
use App\State\IdentifyGuestProcessor;

#[ApiResource(
    operations: [
        new Get(
            uriTemplate: '/guests/me',
            security: "is_granted('ROLE_GUEST')",
            provider: CurrentGuestProvider::class,
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
    ) {
    }
}
