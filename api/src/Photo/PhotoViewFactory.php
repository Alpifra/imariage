<?php

namespace App\Photo;

use App\ApiResource\PhotoView;
use App\Entity\Photo;
use App\Enum\PhotoStatus;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\Routing\Generator\UrlGeneratorInterface;

final readonly class PhotoViewFactory
{
    public function __construct(
        private Security $security,
        private UrlGeneratorInterface $urlGenerator,
    ) {
    }

    public function create(Photo $photo): PhotoView
    {
        $author = $photo->getAuthor();
        $id = $photo->getId()->toRfc4122();
        $ready = PhotoStatus::Ready === $photo->getStatus();

        return new PhotoView(
            $id,
            $author->getId()->toRfc4122(),
            $author->getFirstName().' '.$author->getLastName(),
            $this->security->getUser()?->getUserIdentifier() === $author->getUserIdentifier(),
            $photo->getStatus()->value,
            $photo->getWidth(),
            $photo->getHeight(),
            $photo->getTakenAt(),
            $photo->getCreatedAt(),
            $ready ? $this->urlGenerator->generate('photo_file', ['id' => $id, 'variant' => 'thumbnail']) : null,
            $ready ? $this->urlGenerator->generate('photo_file', ['id' => $id, 'variant' => 'medium']) : null,
        );
    }
}
