<?php

namespace App\ApiResource;

use ApiPlatform\Metadata\ApiProperty;
use ApiPlatform\Metadata\ApiResource;
use ApiPlatform\Metadata\Get;
use ApiPlatform\Metadata\GetCollection;
use ApiPlatform\Metadata\Post;
use App\Dto\ExportRequest;
use App\State\CreateExportProcessor;
use App\State\ExportCollectionProvider;
use App\State\ExportProvider;

#[ApiResource(
    shortName: 'Export',
    operations: [
        new GetCollection(
            uriTemplate: '/exports',
            paginationEnabled: false,
            security: "is_granted('ROLE_ADMIN')",
            provider: ExportCollectionProvider::class,
        ),
        new Get(
            uriTemplate: '/exports/{id}',
            security: "is_granted('ROLE_ADMIN')",
            provider: ExportProvider::class,
        ),
        new Post(
            uriTemplate: '/exports',
            security: "is_granted('ROLE_ADMIN')",
            input: ExportRequest::class,
            processor: CreateExportProcessor::class,
        ),
    ],
)]
final class ExportView
{
    public function __construct(
        #[ApiProperty(identifier: true)]
        public readonly string $id,
        public readonly string $status,
        /** Null when the export covers every guest */
        public readonly ?string $authorId,
        public readonly ?string $authorName,
        public readonly int $photoCount,
        public readonly int $processedCount,
        public readonly ?int $fileSize,
        public readonly \DateTimeImmutable $createdAt,
        public readonly ?\DateTimeImmutable $finishedAt,
        public readonly ?string $downloadUrl,
    ) {
    }
}
