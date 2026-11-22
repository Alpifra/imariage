<?php

namespace App\Tests\Api;

use App\Entity\Export;
use App\Entity\Photo;
use App\Entity\User;
use Symfony\Bundle\FrameworkBundle\Console\Application;
use Symfony\Component\Console\Tester\CommandTester;

final class ResetAlbumCommandTest extends ApiTestCase
{
    public function testResetDeletesPhotosExportsAndGuestsButKeepsAdmins(): void
    {
        $this->identify('Alice', 'Martin');
        $this->upload(self::createJpeg());

        $this->client->getCookieJar()->clear();
        $this->createAdmin();
        $this->loginAsAdmin();
        $this->upload(self::createJpeg());
        $this->request('POST', '/api/exports', []);
        self::assertResponseStatusCodeSame(201);

        $tester = $this->commandTester();
        $tester->setInputs(['yes']);
        $tester->execute([]);
        $tester->assertCommandIsSuccessful();
        self::assertStringContainsString('Deleted 2 photos, 1 exports and 1 guests.', $tester->getDisplay());

        $users = $this->entityManager()->getRepository(User::class)->findAll();
        self::assertSame(['maries'], array_map(static fn (User $user): ?string => $user->getUsername(), $users));
        self::assertCount(0, $this->entityManager()->getRepository(Photo::class)->findAll());
        self::assertCount(0, $this->entityManager()->getRepository(Export::class)->findAll());
        self::assertSame([], glob(\dirname(__DIR__, 2).'/var/storage/test/photos/*'));
    }

    public function testResetIsCancelledWithoutConfirmation(): void
    {
        $this->identify('Alice', 'Martin');
        $this->upload(self::createJpeg());

        $tester = $this->commandTester();
        $tester->setInputs(['no']);

        self::assertSame(1, $tester->execute([]));
        self::assertCount(1, $this->entityManager()->getRepository(User::class)->findAll());
    }

    private function commandTester(): CommandTester
    {
        return new CommandTester(new Application(self::$kernel)->find('app:reset-album'));
    }
}
