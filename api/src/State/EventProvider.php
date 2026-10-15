<?php

namespace App\State;

use ApiPlatform\Metadata\Operation;
use ApiPlatform\State\ProviderInterface;
use App\ApiResource\Event;
use Symfony\Component\DependencyInjection\Attribute\Autowire;

/**
 * @implements ProviderInterface<Event>
 */
final class EventProvider implements ProviderInterface
{
    public function __construct(
        #[Autowire(env: 'EVENT_CODE')]
        private readonly string $eventCode,
    ) {
    }

    public function provide(Operation $operation, array $uriVariables = [], array $context = []): ?Event
    {
        $code = (string) ($uriVariables['code'] ?? '');

        return hash_equals($this->eventCode, $code) ? new Event($code) : null;
    }
}
