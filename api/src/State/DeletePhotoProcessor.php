<?php

namespace App\State;

use ApiPlatform\Metadata\Operation;
use ApiPlatform\State\ProcessorInterface;
use App\ApiResource\PhotoView;
use App\Repository\PhotoRepository;
use Doctrine\ORM\EntityManagerInterface;
use League\Flysystem\FilesystemOperator;
use Symfony\Component\Uid\Uuid;

/**
 * @implements ProcessorInterface<PhotoView, null>
 */
final readonly class DeletePhotoProcessor implements ProcessorInterface
{
    public function __construct(
        private PhotoRepository $photos,
        private EntityManagerInterface $entityManager,
        private FilesystemOperator $photosStorage,
    ) {
    }

    public function process(mixed $data, Operation $operation, array $uriVariables = [], array $context = []): null
    {
        $photo = $this->photos->find(Uuid::fromString($data->id));
        if (null === $photo) {
            return null;
        }

        $paths = array_filter([$photo->getOriginalPath(), $photo->getThumbnailPath(), $photo->getMediumPath()]);

        $this->entityManager->remove($photo);
        $this->entityManager->flush();

        // Files go after the row: a leftover file is harmless, a row without its file is not
        foreach ($paths as $path) {
            $this->photosStorage->delete($path);
        }

        return null;
    }
}
