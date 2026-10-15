<?php

namespace App\EventListener;

use Symfony\Component\EventDispatcher\Attribute\AsEventListener;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Security\Http\Event\LogoutEvent;

#[AsEventListener]
final class LogoutListener
{
    public function __invoke(LogoutEvent $event): void
    {
        // The default logout redirects to "/", which makes no sense for an API call
        $event->setResponse(new Response(null, Response::HTTP_NO_CONTENT));
    }
}
