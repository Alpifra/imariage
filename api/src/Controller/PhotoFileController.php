<?php

namespace App\Controller;

use App\Enum\PhotoStatus;
use App\Repository\PhotoRepository;
use League\Flysystem\FilesystemOperator;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Routing\Requirement\Requirement;
use Symfony\Component\Security\Http\Attribute\IsGranted;
use Symfony\Component\Uid\Uuid;

final class PhotoFileController
{
    public function __construct(
        private readonly PhotoRepository $photos,
        private readonly FilesystemOperator $photosStorage,
    ) {
    }

    #[Route(
        '/api/photos/{id}/{variant}',
        name: 'photo_file',
        requirements: ['id' => Requirement::UUID, 'variant' => 'thumbnail|medium'],
        methods: ['GET'],
    )]
    #[IsGranted('ROLE_GUEST')]
    public function __invoke(string $id, string $variant): Response
    {
        $photo = $this->photos->find(Uuid::fromString($id));
        $path = 'thumbnail' === $variant ? $photo?->getThumbnailPath() : $photo?->getMediumPath();

        if (null === $photo || PhotoStatus::Ready !== $photo->getStatus() || null === $path) {
            throw new NotFoundHttpException();
        }

        $stream = $this->photosStorage->readStream($path);
        $response = new StreamedResponse(static function () use ($stream): void {
            fpassthru($stream);
            fclose($stream);
        });
        $response->headers->set('Content-Type', 'image/jpeg');
        $response->headers->set('Content-Length', (string) $this->photosStorage->fileSize($path));
        // Derived files never change for a given photo id; private because they sit behind authentication
        $response->setPrivate();
        $response->setMaxAge(31536000);
        $response->setImmutable();

        return $response;
    }
}
