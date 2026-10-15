<?php

namespace App\Tests\Api;

use App\Security\DeviceToken;
use Symfony\Component\BrowserKit\Cookie;

final class GuestIdentificationTest extends ApiTestCase
{
    public function testEventCodeIsChecked(): void
    {
        $this->request('GET', '/api/events/'.self::EVENT_CODE);
        self::assertResponseIsSuccessful();

        $this->request('GET', '/api/events/wrong-code');
        self::assertResponseStatusCodeSame(404);

        $this->request('POST', '/api/guests', ['firstName' => 'Alice', 'lastName' => 'Martin', 'eventCode' => 'wrong-code']);
        self::assertResponseStatusCodeSame(403);
    }

    public function testIdentificationSetsTheDeviceCookieAndCleansTheName(): void
    {
        $guest = $this->identify('  jean-pierre ', 'le  gall');

        self::assertResponseStatusCodeSame(201);
        self::assertSame('Jean-Pierre', $guest['firstName']);
        self::assertSame('Le Gall', $guest['lastName']);
        self::assertFalse($guest['isAdmin']);

        $cookie = $this->client->getResponse()->headers->getCookies()[0] ?? null;
        self::assertNotNull($cookie);
        self::assertSame(DeviceToken::COOKIE_NAME, $cookie->getName());
        self::assertTrue($cookie->isHttpOnly());
        self::assertTrue($cookie->isSecure());

        $this->request('GET', '/api/guests/me');
        self::assertResponseIsSuccessful();
    }

    public function testDeviceIsRecognisedWithoutSession(): void
    {
        $guest = $this->identify('Alice', 'Martin');
        $device = $this->client->getCookieJar()->get(DeviceToken::COOKIE_NAME);
        self::assertInstanceOf(Cookie::class, $device);

        $this->useCookies([$device]);
        $me = $this->request('GET', '/api/guests/me');

        self::assertResponseIsSuccessful();
        self::assertSame($guest['id'], $me['id']);
    }

    public function testUnknownDeviceIsRejected(): void
    {
        $this->client->getCookieJar()->set(new Cookie(DeviceToken::COOKIE_NAME, 'forged-token'));

        $this->request('GET', '/api/guests/me');
        self::assertResponseStatusCodeSame(401);
    }

    public function testKnownNameAsksWhetherItIsTheSameGuest(): void
    {
        $first = $this->identify('Alice', 'Martin');
        $this->client->getCookieJar()->clear();

        $conflict = $this->identify('ALICE', 'martin');
        self::assertResponseStatusCodeSame(409);
        self::assertSame('Alice Martin', $conflict['detail']);

        $same = $this->identify('alice', 'martin', true);
        self::assertResponseStatusCodeSame(201);
        self::assertSame($first['id'], $same['id']);

        $this->client->getCookieJar()->clear();
        $homonym = $this->identify('Alice', 'Martin', false);
        self::assertResponseStatusCodeSame(201);
        self::assertNotSame($first['id'], $homonym['id']);
    }

    public function testGuestCannotTakeOverTheAdminAccount(): void
    {
        $this->createAdmin();

        $guest = $this->identify('Les', 'Mariés', true);

        self::assertResponseStatusCodeSame(201);
        self::assertFalse($guest['isAdmin']);
    }
}
