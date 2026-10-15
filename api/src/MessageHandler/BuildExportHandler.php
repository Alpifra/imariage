<?php

namespace App\MessageHandler;

use App\Enum\ExportStatus;
use App\Export\ArchiveEntryNamer;
use App\Message\BuildExport;
use App\Repository\ExportRepository;
use App\Repository\PhotoRepository;
use Doctrine\ORM\EntityManagerInterface;
use League\Flysystem\FilesystemOperator;
use Psr\Log\LoggerInterface;
use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Symfony\Component\Messenger\Attribute\AsMessageHandler;
use Symfony\Component\Uid\Uuid;
use ZipStream\CompressionMethod;
use ZipStream\ZipStream;

#[AsMessageHandler]
final readonly class BuildExportHandler
{
    private const int PROGRESS_STEP = 20;

    public function __construct(
        private ExportRepository $exports,
        private PhotoRepository $photos,
        private FilesystemOperator $photosStorage,
        private EntityManagerInterface $entityManager,
        private LoggerInterface $logger,
        #[Autowire('%kernel.project_dir%/var/tmp')]
        private string $tmpDir,
    ) {
    }

    public function __invoke(BuildExport $message): void
    {
        $export = $this->exports->find(Uuid::fromString($message->exportId));
        if (null === $export || ExportStatus::Pending !== $export->getStatus()) {
            return;
        }

        $entries = $this->photos->findForExport($export->getAuthor());
        $export->markProcessing(\count($entries));
        $this->entityManager->flush();

        if (!is_dir($this->tmpDir)) {
            mkdir($this->tmpDir, 0o770, true);
        }
        $tmpPath = $this->tmpDir.'/export-'.$message->exportId.'.zip';

        try {
            $output = fopen($tmpPath, 'w+b');
            if (false === $output) {
                throw new \RuntimeException('Unable to create '.$tmpPath);
            }

            // Photos are already compressed: storing them is as small and much faster
            $zip = new ZipStream(
                outputStream: $output,
                defaultCompressionMethod: CompressionMethod::STORE,
                sendHttpHeaders: false,
            );
            $namer = new ArchiveEntryNamer();

            foreach ($entries as $index => $entry) {
                $date = $entry['takenAt'] ?? $entry['createdAt'];
                $name = $namer->name($date, $entry['firstName'], $entry['lastName'], pathinfo($entry['originalPath'], \PATHINFO_EXTENSION));
                $zip->addFileFromStream($name, $this->photosStorage->readStream($entry['originalPath']), lastModificationDateTime: $date);

                if (0 === ($index + 1) % self::PROGRESS_STEP) {
                    $export->advance($index + 1);
                    $this->entityManager->flush();
                }
            }

            $fileSize = $zip->finish();
            rewind($output);

            $filePath = 'exports/'.$message->exportId.'.zip';
            $this->photosStorage->writeStream($filePath, $output);
            fclose($output);

            $export->advance(\count($entries));
            $export->markReady($filePath, $fileSize);
        } catch (\Throwable $exception) {
            // A failed archive is relaunched from the admin, not retried blindly
            $this->logger->error('Export failed', ['export' => $message->exportId, 'exception' => $exception]);
            $export->markFailed();
        } finally {
            if (is_file($tmpPath)) {
                unlink($tmpPath);
            }
        }

        $this->entityManager->flush();
    }
}
