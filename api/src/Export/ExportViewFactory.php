<?php

namespace App\Export;

use App\ApiResource\ExportView;
use App\Entity\Export;
use App\Enum\ExportStatus;
use Symfony\Component\Routing\Generator\UrlGeneratorInterface;

final readonly class ExportViewFactory
{
    public function __construct(private UrlGeneratorInterface $urlGenerator)
    {
    }

    public function create(Export $export): ExportView
    {
        $id = $export->getId()->toRfc4122();
        $author = $export->getAuthor();

        return new ExportView(
            $id,
            $export->getStatus()->value,
            $author?->getId()->toRfc4122(),
            null !== $author ? $author->getFirstName().' '.$author->getLastName() : null,
            $export->getPhotoCount(),
            $export->getProcessedCount(),
            $export->getFileSize(),
            $export->getCreatedAt(),
            $export->getFinishedAt(),
            ExportStatus::Ready === $export->getStatus() ? $this->urlGenerator->generate('export_download', ['id' => $id]) : null,
        );
    }
}
