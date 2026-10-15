<?php

namespace App\State;

use ApiPlatform\Metadata\Operation;
use ApiPlatform\State\ProviderInterface;
use App\ApiResource\ExportView;
use App\Export\ExportViewFactory;
use App\Repository\ExportRepository;

/**
 * @implements ProviderInterface<ExportView>
 */
final readonly class ExportCollectionProvider implements ProviderInterface
{
    public function __construct(
        private ExportRepository $exports,
        private ExportViewFactory $exportViewFactory,
    ) {
    }

    /**
     * @return list<ExportView>
     */
    public function provide(Operation $operation, array $uriVariables = [], array $context = []): array
    {
        return array_map(
            $this->exportViewFactory->create(...),
            $this->exports->findBy([], ['createdAt' => 'DESC']),
        );
    }
}
