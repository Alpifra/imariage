<?php

namespace App\State;

use ApiPlatform\Metadata\Operation;
use ApiPlatform\State\ProviderInterface;
use App\ApiResource\Album;
use App\Repository\PhotoRepository;

/**
 * @implements ProviderInterface<Album>
 */
final readonly class AlbumProvider implements ProviderInterface
{
    public function __construct(private PhotoRepository $photos)
    {
    }

    public function provide(Operation $operation, array $uriVariables = [], array $context = []): Album
    {
        $stats = $this->photos->getPublishedStats();

        return new Album($stats['photoCount'], $stats['contributorCount'], $stats['storageBytes']);
    }
}
