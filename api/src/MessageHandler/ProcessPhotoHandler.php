<?php

namespace App\MessageHandler;

use App\Enum\PhotoStatus;
use App\Message\ProcessPhoto;
use App\Photo\ImageProcessor;
use App\Repository\PhotoRepository;
use Doctrine\ORM\EntityManagerInterface;
use League\Flysystem\FilesystemOperator;
use Psr\Log\LoggerInterface;
use Symfony\Component\Messenger\Attribute\AsMessageHandler;

#[AsMessageHandler]
final readonly class ProcessPhotoHandler
{
    public function __construct(
        private PhotoRepository $photos,
        private FilesystemOperator $photosStorage,
        private ImageProcessor $imageProcessor,
        private EntityManagerInterface $entityManager,
        private LoggerInterface $logger,
    ) {
    }

    public function __invoke(ProcessPhoto $message): void
    {
        $photo = $this->photos->find($message->photoId);
        if (null === $photo || PhotoStatus::Processing !== $photo->getStatus()) {
            return;
        }

        try {
            $image = $this->imageProcessor->process($this->photosStorage->read($photo->getOriginalPath()));
        } catch (\ImagickException $exception) {
            // Unreadable image: retrying would fail the same way
            $this->logger->error('Photo processing failed', ['photo' => $message->photoId, 'exception' => $exception]);
            $photo->markFailed();
            $this->entityManager->flush();

            return;
        }

        $baseName = pathinfo($photo->getOriginalPath(), \PATHINFO_FILENAME);
        $thumbnailPath = 'thumbnails/'.$baseName.'.jpg';
        $mediumPath = 'medium/'.$baseName.'.jpg';

        $this->photosStorage->write($thumbnailPath, $image->thumbnail);
        $this->photosStorage->write($mediumPath, $image->medium);

        $photo->markReady($thumbnailPath, $mediumPath, $image->width, $image->height, $image->takenAt);
        $this->entityManager->flush();
    }
}
