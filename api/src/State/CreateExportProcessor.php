<?php

namespace App\State;

use ApiPlatform\Metadata\Operation;
use ApiPlatform\State\ProcessorInterface;
use App\ApiResource\ExportView;
use App\Dto\ExportRequest;
use App\Entity\Export;
use App\Entity\User;
use App\Export\ExportViewFactory;
use App\Message\BuildExport;
use App\Repository\UserRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\HttpKernel\Exception\UnprocessableEntityHttpException;
use Symfony\Component\Messenger\MessageBusInterface;
use Symfony\Component\Uid\Uuid;

/**
 * @implements ProcessorInterface<ExportRequest, ExportView>
 */
final readonly class CreateExportProcessor implements ProcessorInterface
{
    public function __construct(
        private UserRepository $users,
        private EntityManagerInterface $entityManager,
        private MessageBusInterface $bus,
        private Security $security,
        private ExportViewFactory $exportViewFactory,
    ) {
    }

    public function process(mixed $data, Operation $operation, array $uriVariables = [], array $context = []): ExportView
    {
        $author = null;
        if (null !== $data->author) {
            $author = $this->users->find(Uuid::fromString($data->author))
                ?? throw new UnprocessableEntityHttpException('Unknown guest.');
        }

        $requestedBy = $this->security->getUser();
        \assert($requestedBy instanceof User);

        $export = new Export($requestedBy, $author);
        $this->entityManager->persist($export);
        $this->entityManager->flush();

        $this->bus->dispatch(new BuildExport($export->getId()->toRfc4122()));

        return $this->exportViewFactory->create($export);
    }
}
