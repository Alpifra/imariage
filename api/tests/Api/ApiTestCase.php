<?php

namespace App\Tests\Api;

use App\Entity\User;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\KernelBrowser;
use Symfony\Bundle\FrameworkBundle\Test\WebTestCase;
use Symfony\Component\BrowserKit\Cookie;
use Symfony\Component\Filesystem\Filesystem;
use Symfony\Component\HttpFoundation\File\UploadedFile;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;

abstract class ApiTestCase extends WebTestCase
{
    protected const string EVENT_CODE = 'dev-event-code';
    protected const string ADMIN_PASSWORD = 'admin-password-for-tests';

    protected KernelBrowser $client;

    protected function setUp(): void
    {
        $this->client = static::createClient();
        // The device cookie is Secure: the browser only sends it back over HTTPS
        $this->client->setServerParameter('HTTPS', 'on');

        $this->entityManager()->getConnection()->executeStatement('DELETE FROM `user`');
        new Filesystem()->remove(self::storageDir());
    }

    protected function tearDown(): void
    {
        new Filesystem()->remove(self::storageDir());
        parent::tearDown();
    }

    /**
     * @param array<string, mixed>|null $body
     *
     * @return array<string, mixed>
     */
    protected function request(string $method, string $uri, ?array $body = null): array
    {
        $this->client->request($method, $uri, server: [
            'CONTENT_TYPE' => 'application/json',
            'HTTP_ACCEPT' => 'application/json',
        ], content: null !== $body ? json_encode($body, \JSON_THROW_ON_ERROR) : null);

        $content = (string) $this->client->getResponse()->getContent();

        /* @var array<string, mixed> */
        return '' !== $content && json_validate($content) ? json_decode($content, true) : [];
    }

    /**
     * @return array<string, mixed>
     */
    protected function identify(string $firstName, string $lastName, ?bool $sameGuest = null): array
    {
        return $this->request('POST', '/api/guests', [
            'firstName' => $firstName,
            'lastName' => $lastName,
            'eventCode' => self::EVENT_CODE,
            'sameGuest' => $sameGuest,
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    protected function upload(string $path, string $name = 'photo.jpg'): array
    {
        $this->client->request('POST', '/api/photos', files: ['file' => new UploadedFile($path, $name)], server: ['HTTP_ACCEPT' => 'application/json']);

        /* @var array<string, mixed> */
        return json_decode((string) $this->client->getResponse()->getContent(), true);
    }

    protected function createAdmin(string $username = 'maries'): User
    {
        $user = new User('Les', 'mariés', 'les maries');
        $user->setUsername($username);
        $user->setRoles([User::ROLE_ADMIN]);
        $user->setPassword(static::getContainer()->get(UserPasswordHasherInterface::class)->hashPassword($user, self::ADMIN_PASSWORD));

        $this->entityManager()->persist($user);
        $this->entityManager()->flush();

        return $user;
    }

    protected function loginAsAdmin(string $username = 'maries'): void
    {
        $this->request('POST', '/api/login', ['username' => $username, 'password' => self::ADMIN_PASSWORD]);
        self::assertResponseIsSuccessful();
    }

    /**
     * Switching between guests in one test: each one keeps their own cookies.
     *
     * @return list<Cookie>
     */
    protected function saveCookies(): array
    {
        return $this->client->getCookieJar()->all();
    }

    /**
     * @param list<Cookie> $cookies
     */
    protected function useCookies(array $cookies): void
    {
        $this->client->getCookieJar()->clear();
        foreach ($cookies as $cookie) {
            $this->client->getCookieJar()->set($cookie);
        }
    }

    protected static function createJpeg(int $width = 300, int $height = 200, string $color = 'tomato'): string
    {
        $image = new \Imagick();
        $image->newImage($width, $height, $color, 'jpeg');
        $path = tempnam(sys_get_temp_dir(), 'photo').'.jpg';
        $image->writeImage($path);
        $image->clear();

        return $path;
    }

    protected function entityManager(): EntityManagerInterface
    {
        return static::getContainer()->get(EntityManagerInterface::class);
    }

    private static function storageDir(): string
    {
        return \dirname(__DIR__, 2).'/var/storage/test';
    }
}
