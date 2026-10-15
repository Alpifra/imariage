<?php

namespace App\ApiResource;

use ApiPlatform\Metadata\ApiProperty;
use ApiPlatform\Metadata\ApiResource;
use ApiPlatform\Metadata\Get;
use App\State\AlbumProvider;

#[ApiResource(
    operations: [
        new Get(
            uriTemplate: '/album',
            security: "is_granted('ROLE_GUEST')",
            provider: AlbumProvider::class,
        ),
    ],
)]
final class Album
{
    public function __construct(
        public readonly int $photoCount,
        /** Guests who published at least one photo */
        public readonly int $contributorCount,
        /** Size of the originals, shown to admins */
        public readonly int $storageBytes,
        #[ApiProperty(identifier: true)]
        public readonly string $id = 'album',
    ) {
    }
}
