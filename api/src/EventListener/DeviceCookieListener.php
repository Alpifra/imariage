<?php

namespace App\EventListener;

use App\Security\DeviceToken;
use App\State\IdentifyGuestProcessor;
use Symfony\Component\EventDispatcher\Attribute\AsEventListener;
use Symfony\Component\HttpKernel\Event\ResponseEvent;

#[AsEventListener]
final class DeviceCookieListener
{
    public function __invoke(ResponseEvent $event): void
    {
        $token = $event->getRequest()->attributes->get(IdentifyGuestProcessor::TOKEN_ATTRIBUTE);

        if (\is_string($token)) {
            $event->getResponse()->headers->setCookie(DeviceToken::cookie($token));
        }
    }
}
