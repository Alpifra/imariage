<?php

namespace App\State;

use ApiPlatform\Metadata\Operation;
use ApiPlatform\State\ProviderInterface;
use App\ApiResource\PhotoView;
use App\Entity\User;
use App\Photo\PhotoViewFactory;
use App\Repository\PhotoRepository;
use App\Repository\UserRepository;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;
use Symfony\Component\Uid\Uuid;

/**
 * @implements ProviderInterface<PhotoView>
 */
final readonly class PhotoCollectionProvider implements ProviderInterface
{
    public const int PAGE_SIZE = 60;

    public function __construct(
        private PhotoRepository $photos,
        private UserRepository $users,
        private Security $security,
        private PhotoViewFactory $photoViewFactory,
    ) {
    }

    /**
     * @return list<PhotoView>
     */
    public function provide(Operation $operation, array $uriVariables = [], array $context = []): array
    {
        /** @var array<string, mixed> $filters */
        $filters = $context['filters'] ?? [];

        $author = null;
        if (filter_var($filters['mine'] ?? false, \FILTER_VALIDATE_BOOL)) {
            $author = $this->security->getUser();
            \assert($author instanceof User);
        } elseif (null !== $authorId = self::uuid($filters, 'author')) {
            $author = $this->users->find($authorId);
            if (null === $author) {
                return [];
            }
        }

        $photos = $this->photos->findPublishedPage(
            $author,
            self::uuid($filters, 'before'),
            self::uuid($filters, 'after'),
            self::PAGE_SIZE,
        );

        return array_map($this->photoViewFactory->create(...), $photos);
    }

    /**
     * @param array<string, mixed> $filters
     */
    private static function uuid(array $filters, string $name): ?Uuid
    {
        $value = $filters[$name] ?? null;
        if (null === $value || '' === $value) {
            return null;
        }
        if (!\is_string($value) || !Uuid::isValid($value)) {
            throw new BadRequestHttpException(\sprintf('"%s" must be a UUID.', $name));
        }

        return Uuid::fromString($value);
    }
}
