<?php

namespace App\Command;

use App\Entity\Export;
use App\Entity\Photo;
use App\Entity\User;
use Doctrine\ORM\EntityManagerInterface;
use League\Flysystem\FilesystemOperator;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Style\SymfonyStyle;

#[AsCommand(name: 'app:reset-album', description: 'Deletes every photo, export and guest account, keeping the admin accounts')]
final readonly class ResetAlbumCommand
{
    public function __construct(
        private EntityManagerInterface $entityManager,
        private FilesystemOperator $photosStorage,
    ) {
    }

    public function __invoke(SymfonyStyle $io): int
    {
        $io->warning('Every photo, export and guest account will be permanently deleted. Admin accounts are kept.');
        if (!$io->confirm('Reset the album?', false)) {
            $io->note('Nothing was deleted.');

            return Command::FAILURE;
        }

        [$photoCount, $exportCount, $guestCount] = $this->entityManager->wrapInTransaction(fn (EntityManagerInterface $em): array => [
            $em->createQuery(\sprintf('DELETE FROM %s p', Photo::class))->execute(),
            $em->createQuery(\sprintf('DELETE FROM %s e', Export::class))->execute(),
            // Only admins have a username; guest devices go with them through the foreign key cascade
            $em->createQuery(\sprintf('DELETE FROM %s u WHERE u.username IS NULL', User::class))->execute(),
        ]);

        // Files go after the rows: a leftover file is harmless, a row without its file is not
        foreach ($this->photosStorage->listContents('') as $item) {
            if ($item->isDir()) {
                $this->photosStorage->deleteDirectory($item->path());
            } else {
                $this->photosStorage->delete($item->path());
            }
        }

        $io->success(\sprintf('Deleted %d photos, %d exports and %d guests.', $photoCount, $exportCount, $guestCount));

        return Command::SUCCESS;
    }
}
