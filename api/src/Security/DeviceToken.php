<?php

namespace App\Security;

use Symfony\Component\HttpFoundation\Cookie;

final class DeviceToken
{
    public const string COOKIE_NAME = 'imariage_device';

    public static function generate(): string
    {
        return bin2hex(random_bytes(32));
    }

    public static function hash(string $token): string
    {
        return hash('sha256', $token);
    }

    public static function cookie(string $token): Cookie
    {
        return Cookie::create(self::COOKIE_NAME, $token)
            ->withExpires(new \DateTimeImmutable('+1 year'))
            ->withSecure()
            ->withHttpOnly()
            ->withSameSite(Cookie::SAMESITE_LAX);
    }
}
