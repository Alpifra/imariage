<?php

namespace App\State;

use ApiPlatform\Metadata\Operation;
use ApiPlatform\State\ProviderInterface;
use App\ApiResource\PhotoView;
use App\Photo\PhotoViewFactory;
use App\Repository\PhotoRepository;
use Symfony\Component\Uid\Uuid;

/**
 * @implements ProviderInterface<PhotoView>
 */
final readonly class PhotoProvider implements ProviderInterface
{
    public function __construct(
        private PhotoRepository $photos,
        private PhotoViewFactory $photoViewFactory,
    ) {
    }

    public function provide(Operation $operation, array $uriVariables = [], array $context = []): ?PhotoView
    {
        $id = (string) ($uriVariables['id'] ?? '');
        $photo = Uuid::isValid($id) ? $this->photos->find(Uuid::fromString($id)) : null;

        return null !== $photo ? $this->photoViewFactory->create($photo) : null;
    }
}
