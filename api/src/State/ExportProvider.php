<?php

namespace App\State;

use ApiPlatform\Metadata\Operation;
use ApiPlatform\State\ProviderInterface;
use App\ApiResource\ExportView;
use App\Export\ExportViewFactory;
use App\Repository\ExportRepository;
use Symfony\Component\Uid\Uuid;

/**
 * @implements ProviderInterface<ExportView>
 */
final readonly class ExportProvider implements ProviderInterface
{
    public function __construct(
        private ExportRepository $exports,
        private ExportViewFactory $exportViewFactory,
    ) {
    }

    public function provide(Operation $operation, array $uriVariables = [], array $context = []): ?ExportView
    {
        $id = (string) ($uriVariables['id'] ?? '');
        $export = Uuid::isValid($id) ? $this->exports->find(Uuid::fromString($id)) : null;

        return null !== $export ? $this->exportViewFactory->create($export) : null;
    }
}
