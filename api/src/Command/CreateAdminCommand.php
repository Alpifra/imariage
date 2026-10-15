<?php

namespace App\Command;

use App\Entity\User;
use App\Guest\NameNormalizer;
use App\Repository\UserRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\Console\Attribute\Argument;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Style\SymfonyStyle;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;

#[AsCommand(name: 'app:create-admin', description: 'Creates an admin account, or resets its password if it exists')]
final readonly class CreateAdminCommand
{
    public function __construct(
        private UserRepository $users,
        private UserPasswordHasherInterface $passwordHasher,
        private NameNormalizer $nameNormalizer,
        private EntityManagerInterface $entityManager,
    ) {
    }

    public function __invoke(
        SymfonyStyle $io,
        #[Argument('Login of the admin')] string $username,
        #[Argument('Display name shown on the photos the admin uploads')] string $displayName = 'Les mariés',
    ): int {
        $password = (string) $io->askHidden('Password (12 characters min.)', static function (?string $value): string {
            if (null === $value || mb_strlen($value) < 12) {
                throw new \RuntimeException('The password must be at least 12 characters long.');
            }

            return $value;
        });

        $user = $this->users->findOneBy(['username' => $username]);
        if (null === $user) {
            [$firstName, $lastName] = array_pad(explode(' ', $this->nameNormalizer->clean($displayName), 2), 2, '');
            $user = new User($firstName, $lastName, $this->nameNormalizer->normalize($firstName, $lastName));
            $user->setUsername($username);
            $this->entityManager->persist($user);
        }

        $user->setRoles([User::ROLE_ADMIN]);
        $user->setPassword($this->passwordHasher->hashPassword($user, $password));
        $this->entityManager->flush();

        $io->success(\sprintf('Admin "%s" is ready.', $username));

        return Command::SUCCESS;
    }
}
