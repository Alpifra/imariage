<?php

namespace App\ApiResource;

use ApiPlatform\Metadata\ApiProperty;
use ApiPlatform\Metadata\ApiResource;
use ApiPlatform\Metadata\Delete;
use ApiPlatform\Metadata\Get;
use ApiPlatform\Metadata\GetCollection;
use ApiPlatform\Metadata\Post;
use ApiPlatform\OpenApi\Model\MediaType;
use ApiPlatform\OpenApi\Model\Operation;
use ApiPlatform\OpenApi\Model\Parameter;
use ApiPlatform\OpenApi\Model\RequestBody;
use App\State\DeletePhotoProcessor;
use App\State\PhotoCollectionProvider;
use App\State\PhotoProvider;
use App\State\UploadPhotoProcessor;

#[ApiResource(
    shortName: 'Photo',
    operations: [
        new GetCollection(
            uriTemplate: '/photos',
            openapi: new Operation(
                parameters: [
                    new Parameter('before', 'query', 'Cursor: photos older than this photo id (next page)', schema: ['type' => 'string', 'format' => 'uuid']),
                    new Parameter('after', 'query', 'Cursor: photos newer than this photo id (polling)', schema: ['type' => 'string', 'format' => 'uuid']),
                    new Parameter('mine', 'query', 'Only the current guest\'s photos', schema: ['type' => 'boolean']),
                    new Parameter('author', 'query', 'Only this guest\'s photos', schema: ['type' => 'string', 'format' => 'uuid']),
                ],
            ),
            paginationEnabled: false,
            security: "is_granted('ROLE_GUEST')",
            provider: PhotoCollectionProvider::class,
        ),
        new Get(
            uriTemplate: '/photos/{id}',
            security: "is_granted('ROLE_GUEST')",
            provider: PhotoProvider::class,
        ),
        new Delete(
            uriTemplate: '/photos/{id}',
            security: "is_granted('ROLE_ADMIN') or object.mine",
            provider: PhotoProvider::class,
            processor: DeletePhotoProcessor::class,
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
