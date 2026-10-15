<?php

namespace App\Tests\Api;

final class AdminTest extends ApiTestCase
{
    public function testAdminLogsInAndOut(): void
    {
        $this->createAdmin();

        $this->request('POST', '/api/login', ['username' => 'maries', 'password' => 'wrong-password']);
        self::assertResponseStatusCodeSame(401);

        $me = $this->request('POST', '/api/login', ['username' => 'maries', 'password' => self::ADMIN_PASSWORD]);
        self::assertResponseIsSuccessful();
        self::assertTrue($me['isAdmin']);

        $this->request('POST', '/api/logout');
        self::assertResponseStatusCodeSame(204);

        $this->request('GET', '/api/guests/me');
        self::assertResponseStatusCodeSame(401);
    }

    public function testOnlyAdminsListGuests(): void
    {
        $this->identify('Alice', 'Martin');
        $this->upload(self::createJpeg());

        $this->request('GET', '/api/guests');
        self::assertResponseStatusCodeSame(403);

        $this->client->getCookieJar()->clear();
        $this->createAdmin();
        $this->loginAsAdmin();

        $guests = $this->request('GET', '/api/guests');
        self::assertResponseIsSuccessful();
        self::assertSame(['Alice'], array_column($guests, 'firstName'));
        self::assertSame([1], array_column($guests, 'photoCount'));
    }

    public function testAdminDeletesAnyPhoto(): void
    {
        $this->identify('Alice', 'Martin');
        $photo = $this->upload(self::createJpeg());

        $this->client->getCookieJar()->clear();
        $this->createAdmin();
        $this->loginAsAdmin();

        $this->request('DELETE', '/api/photos/'.$photo['id']);
        self::assertResponseStatusCodeSame(204);
    }
}
