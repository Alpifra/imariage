<?php

namespace App\Controller;

use App\Enum\ExportStatus;
use App\Repository\ExportRepository;
use League\Flysystem\FilesystemOperator;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\HeaderUtils;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Routing\Requirement\Requirement;
use Symfony\Component\Security\Http\Attribute\IsGranted;
use Symfony\Component\String\Slugger\SluggerInterface;
use Symfony\Component\Uid\Uuid;

final class ExportDownloadController extends AbstractController
{
    public function __construct(
        private readonly ExportRepository $exports,
        private readonly FilesystemOperator $photosStorage,
        private readonly SluggerInterface $slugger,
    ) {
    }

    #[Route('/api/exports/{id}/download', name: 'export_download', requirements: ['id' => Requirement::UUID], methods: ['GET'])]
    #[IsGranted('ROLE_ADMIN')]
    public function __invoke(string $id): Response
    {
        $export = $this->exports->find(Uuid::fromString($id));
        $path = $export?->getFilePath();

        if (null === $export || ExportStatus::Ready !== $export->getStatus() || null === $path || !$this->photosStorage->fileExists($path)) {
            throw $this->createNotFoundException();
        }

        $author = $export->getAuthor();
        $fileName = 'photos-mariage'.(null !== $author ? '-'.$this->slugger->slug($author->getFirstName().' '.$author->getLastName())->lower() : '').'.zip';

        $stream = $this->photosStorage->readStream($path);
        $response = new StreamedResponse(static function () use ($stream): void {
            fpassthru($stream);
            fclose($stream);
        });
        $response->headers->set('Content-Type', 'application/zip');
        $response->headers->set('Content-Length', (string) $this->photosStorage->fileSize($path));
        $response->headers->set('Content-Disposition', HeaderUtils::makeDisposition(HeaderUtils::DISPOSITION_ATTACHMENT, $fileName));

        return $response;
    }
}
