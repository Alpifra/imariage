<?php

namespace App\Tests\Api;

final class ExportTest extends ApiTestCase
{
    public function testAdminExportsEveryPhotoOrOneGuest(): void
    {
        $this->identify('Alice', 'Martin');
        $this->upload(self::createJpeg());
        $this->upload(self::createJpeg());

        $this->client->getCookieJar()->clear();
        $bruno = $this->identify('Bruno', 'Petit');
        $this->upload(self::createJpeg());

        $this->request('POST', '/api/exports', []);
        self::assertResponseStatusCodeSame(403);

        $this->client->getCookieJar()->clear();
        $this->createAdmin();
        $this->loginAsAdmin();

        $all = $this->request('POST', '/api/exports', []);
        self::assertResponseStatusCodeSame(201);
        $all = $this->request('GET', '/api/exports/'.$all['id']);
        self::assertSame('ready', $all['status']);
        self::assertSame(3, $all['processedCount']);

        $names = $this->downloadEntries($all['downloadUrl']);
        self::assertCount(3, $names);
        self::assertMatchesRegularExpression('/^\d{8}-\d{6}_Alice-Martin\.jpg$/', $names[0]);
        self::assertMatchesRegularExpression('/^\d{8}-\d{6}_Alice-Martin(_2)?\.jpg$/', $names[1]);
        self::assertResponseHeaderSame('Content-Disposition', 'attachment; filename=photos-mariage.zip');

        $one = $this->request('POST', '/api/exports', ['author' => $bruno['id']]);
        $one = $this->request('GET', '/api/exports/'.$one['id']);
        self::assertSame('Bruno Petit', $one['authorName']);
        self::assertCount(1, $this->downloadEntries($one['downloadUrl']));

        self::assertCount(2, $this->request('GET', '/api/exports'));
    }

    public function testUnknownGuestIsRejected(): void
    {
        $this->createAdmin();
        $this->loginAsAdmin();

        $this->request('POST', '/api/exports', ['author' => 'not-a-uuid']);
        self::assertResponseStatusCodeSame(422);

        $this->request('POST', '/api/exports', ['author' => '01a14116-eb0b-7055-a35d-8b4faeba61d1']);
        self::assertResponseStatusCodeSame(422);
    }

    /**
     * @return list<string>
     */
    private function downloadEntries(string $url): array
    {
        $this->client->request('GET', $url);
        self::assertResponseIsSuccessful();

        $path = tempnam(sys_get_temp_dir(), 'export');
        file_put_contents($path, $this->client->getInternalResponse()->getContent());

        $zip = new \ZipArchive();
        self::assertTrue($zip->open($path));
        $names = [];
        for ($i = 0; $i < $zip->numFiles; ++$i) {
            $names[] = (string) $zip->getNameIndex($i);
        }
        $zip->close();

        return $names;
    }
}
