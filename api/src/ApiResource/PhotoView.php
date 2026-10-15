<?php

namespace App\ApiResource;

use ApiPlatform\Metadata\ApiProperty;
use ApiPlatform\Metadata\ApiResource;
use ApiPlatform\Metadata\Get;
use ApiPlatform\Metadata\Post;
use ApiPlatform\OpenApi\Model\MediaType;
use ApiPlatform\OpenApi\Model\Operation;
use ApiPlatform\OpenApi\Model\RequestBody;
use App\State\PhotoProvider;
use App\State\UploadPhotoProcessor;

#[ApiResource(
    shortName: 'Photo',
    operations: [
        new Get(
            uriTemplate: '/photos/{id}',
            security: "is_granted('ROLE_GUEST')",
            provider: PhotoProvider::class,
        ),
        new Post(
            uriTemplate: '/photos',
            inputFormats: ['multipart' => ['multipart/form-data']],
            openapi: new Operation(
                requestBody: new RequestBody(
                    content: new \ArrayObject([
                        'multipart/form-data' => new MediaType(schema: new \ArrayObject([
                            'type' => 'object',
                            'properties' => ['file' => ['type' => 'string', 'format' => 'binary']],
                        ])),
                    ]),
                ),
            ),
            security: "is_granted('ROLE_GUEST')",
            deserialize: false,
            processor: UploadPhotoProcessor::class,
        ),
    ],
)]
final class PhotoView
{
    public function __construct(
        #[ApiProperty(identifier: true)]
        public readonly string $id,
        public readonly string $authorId,
        public readonly string $authorName,
        public readonly bool $mine,
        public readonly string $status,
        public readonly ?int $width,
        public readonly ?int $height,
        public readonly ?\DateTimeImmutable $takenAt,
        public readonly \DateTimeImmutable $createdAt,
        public readonly ?string $thumbnailUrl,
        public readonly ?string $mediumUrl,
    ) {
    }
}
