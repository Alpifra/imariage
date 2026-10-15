<?php

namespace App\Tests\Api;

final class PhotoTest extends ApiTestCase
{
    public function testUploadedPhotoIsProcessedAndServed(): void
    {
        $this->identify('Alice', 'Martin');

        $photo = $this->upload(self::createJpeg(2400, 1200));
        self::assertResponseStatusCodeSame(201);
        self::assertTrue($photo['mine']);

        $photo = $this->request('GET', '/api/photos/'.$photo['id']);
        self::assertSame('ready', $photo['status']);
        self::assertSame(2400, $photo['width']);
        self::assertIsString($photo['mediumUrl']);
        self::assertIsString($photo['thumbnailUrl']);

        $this->client->request('GET', $photo['mediumUrl']);
        self::assertResponseIsSuccessful();
        self::assertResponseHeaderSame('Content-Type', 'image/jpeg');
        $size = getimagesizefromstring((string) $this->client->getInternalResponse()->getContent());
        self::assertSame([1600, 800], \array_slice((array) $size, 0, 2));

        $this->client->request('GET', $photo['thumbnailUrl']);
        $size = getimagesizefromstring((string) $this->client->getInternalResponse()->getContent());
        self::assertSame([800, 400], \array_slice((array) $size, 0, 2));
    }

    public function testUploadRejectsUnsupportedFiles(): void
    {
        $this->identify('Alice', 'Martin');

        $text = tempnam(sys_get_temp_dir(), 'text');
        file_put_contents($text, 'not an image');
        $this->upload($text, 'photo.jpg');
        self::assertResponseStatusCodeSame(422);

        $this->client->request('POST', '/api/photos', server: ['HTTP_ACCEPT' => 'application/json']);
        self::assertResponseStatusCodeSame(422);
    }

    public function testAnonymousVisitorCannotSeeOrUploadPhotos(): void
    {
        $this->request('GET', '/api/photos');
        self::assertResponseStatusCodeSame(401);

        $this->upload(self::createJpeg());
        self::assertResponseStatusCodeSame(401);
    }

    public function testListingIsPaginatedAndFiltered(): void
    {
        $this->identify('Alice', 'Martin');
        $alice = $this->saveCookies();
        $alicePhotos = [$this->upload(self::createJpeg())['id'], $this->upload(self::createJpeg())['id']];

        $this->client->getCookieJar()->clear();
        $bruno = $this->identify('Bruno', 'Petit');
        $brunoPhoto = $this->upload(self::createJpeg())['id'];

        $all = $this->request('GET', '/api/photos');
        self::assertSame([$brunoPhoto, ...array_reverse($alicePhotos)], array_column($all, 'id'));
        self::assertSame([true, false, false], array_column($all, 'mine'));

        self::assertSame([$brunoPhoto], array_column($this->request('GET', '/api/photos?mine=1'), 'id'));
        self::assertSame([$alicePhotos[0]], array_column($this->request('GET', '/api/photos?before='.$alicePhotos[1]), 'id'));
        self::assertSame([$brunoPhoto], array_column($this->request('GET', '/api/photos?after='.$alicePhotos[1]), 'id'));

        $this->useCookies($alice);
        self::assertSame([$brunoPhoto], array_column($this->request('GET', '/api/photos?author='.$bruno['id']), 'id'));

        $this->request('GET', '/api/photos?before=not-a-uuid');
        self::assertResponseStatusCodeSame(400);

        $album = $this->request('GET', '/api/album');
        self::assertSame(3, $album['photoCount']);
        self::assertSame(2, $album['contributorCount']);
    }

    public function testGuestCanOnlyDeleteTheirOwnPhotos(): void
    {
        $this->identify('Alice', 'Martin');
        $alice = $this->saveCookies();
        $photo = $this->upload(self::createJpeg());

        $this->client->getCookieJar()->clear();
        $this->identify('Bruno', 'Petit');
        $this->request('DELETE', '/api/photos/'.$photo['id']);
        self::assertResponseStatusCodeSame(403);

        $this->useCookies($alice);
        $this->request('DELETE', '/api/photos/'.$photo['id']);
        self::assertResponseStatusCodeSame(204);

        $this->request('GET', '/api/photos/'.$photo['id']);
        self::assertResponseStatusCodeSame(404);
    }
}
