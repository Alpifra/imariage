<?php

namespace App\State;

use ApiPlatform\Metadata\Operation;
use ApiPlatform\State\ProcessorInterface;
use ApiPlatform\Validator\Exception\ValidationException;
use App\ApiResource\PhotoView;
use App\Entity\Photo;
use App\Entity\User;
use App\Message\ProcessPhoto;
use App\Photo\PhotoViewFactory;
use Doctrine\ORM\EntityManagerInterface;
use League\Flysystem\FilesystemOperator;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Symfony\Component\HttpFoundation\File\UploadedFile;
use Symfony\Component\HttpFoundation\RequestStack;
use Symfony\Component\HttpKernel\Exception\TooManyRequestsHttpException;
use Symfony\Component\Messenger\MessageBusInterface;
use Symfony\Component\RateLimiter\RateLimiterFactoryInterface;
use Symfony\Component\Uid\Uuid;
use Symfony\Component\Validator\Constraints as Assert;
use Symfony\Component\Validator\Validator\ValidatorInterface;

/**
 * @implements ProcessorInterface<mixed, PhotoView>
 */
final readonly class UploadPhotoProcessor implements ProcessorInterface
{
    private const array EXTENSIONS = [
        'image/jpeg' => 'jpg',
        'image/png' => 'png',
        'image/webp' => 'webp',
        'image/heic' => 'heic',
        'image/heif' => 'heif',
    ];

    public function __construct(
        private RequestStack $requestStack,
        private Security $security,
        private ValidatorInterface $validator,
        #[Autowire(service: 'limiter.photo_upload')]
        private RateLimiterFactoryInterface $photoUploadLimiter,
        private FilesystemOperator $photosStorage,
        private EntityManagerInterface $entityManager,
        private MessageBusInterface $bus,
        private PhotoViewFactory $photoViewFactory,
    ) {
    }

    public function process(mixed $data, Operation $operation, array $uriVariables = [], array $context = []): PhotoView
    {
        $user = $this->security->getUser();
        if (!$user instanceof User) {
            throw new \LogicException('The operation is restricted to guests.');
        }

        $limit = $this->photoUploadLimiter->create($user->getId()->toRfc4122())->consume();
        if (!$limit->isAccepted()) {
            throw new TooManyRequestsHttpException($limit->getRetryAfter()->getTimestamp() - time());
        }

        $file = $this->requestStack->getCurrentRequest()?->files->get('file');
        $violations = $this->validator->validate($file, [
            new Assert\NotNull(message: 'Aucun fichier reçu.'),
            new Assert\File(
                maxSize: '25M',
                mimeTypes: array_keys(self::EXTENSIONS),
                maxSizeMessage: 'La photo dépasse la taille maximale de 25 Mo.',
                mimeTypesMessage: 'Ce format de fichier n\'est pas pris en charge.',
            ),
        ]);
        if (\count($violations) > 0) {
            throw new ValidationException($violations);
        }
        \assert($file instanceof UploadedFile);

        // Real MIME type from the content, not the client-provided one
        $mimeType = (string) $file->getMimeType();
        $originalPath = \sprintf('originals/%s.%s', Uuid::v7()->toRfc4122(), self::EXTENSIONS[$mimeType]);

        $stream = fopen($file->getPathname(), 'r');
        if (false === $stream) {
            throw new \RuntimeException('Unable to read the uploaded file.');
        }
        $this->photosStorage->writeStream($originalPath, $stream);
        fclose($stream);

        $photo = new Photo($user, $originalPath, $mimeType, (int) $file->getSize());
        $this->entityManager->persist($photo);
        $this->entityManager->flush();

        $this->bus->dispatch(new ProcessPhoto($photo->getId()->toRfc4122()));

        return $this->photoViewFactory->create($photo);
    }
}
