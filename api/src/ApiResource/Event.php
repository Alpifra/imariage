<?php

namespace App\ApiResource;

use ApiPlatform\Metadata\ApiProperty;
use ApiPlatform\Metadata\ApiResource;
use ApiPlatform\Metadata\Get;
use App\State\EventProvider;

#[ApiResource(
    operations: [
        new Get(uriTemplate: '/events/{code}', provider: EventProvider::class),
    ],
)]
final class Event
{
    public function __construct(
        #[ApiProperty(identifier: true)]
        public readonly string $code,
    ) {
    }
}
