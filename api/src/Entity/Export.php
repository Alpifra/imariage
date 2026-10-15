<?php

namespace App\Entity;

use App\Enum\ExportStatus;
use App\Repository\ExportRepository;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Bridge\Doctrine\Types\UuidType;
use Symfony\Component\Uid\Uuid;

#[ORM\Entity(repositoryClass: ExportRepository::class)]
class Export
{
    #[ORM\Id]
    #[ORM\Column(type: UuidType::NAME, unique: true)]
    private Uuid $id;

    #[ORM\Column(length: 20, enumType: ExportStatus::class)]
    private ExportStatus $status = ExportStatus::Pending;

    #[ORM\Column(length: 255, nullable: true)]
    private ?string $filePath = null;

    #[ORM\Column]
    private \DateTimeImmutable $createdAt;

    #[ORM\ManyToOne]
    #[ORM\JoinColumn(nullable: false, onDelete: 'CASCADE')]
    private User $requestedBy;

    /** Null when the export covers every guest */
    #[ORM\ManyToOne]
    #[ORM\JoinColumn(nullable: true, onDelete: 'CASCADE')]
    private ?User $author;

    #[ORM\Column]
    private int $photoCount = 0;

    #[ORM\Column]
    private int $processedCount = 0;

    #[ORM\Column(type: 'bigint', nullable: true)]
    private ?int $fileSize = null;

    #[ORM\Column(nullable: true)]
    private ?\DateTimeImmutable $finishedAt = null;

    public function __construct(User $requestedBy, ?User $author = null)
    {
        $this->id = Uuid::v7();
        $this->requestedBy = $requestedBy;
        $this->author = $author;
        $this->createdAt = new \DateTimeImmutable();
    }

    public function getId(): Uuid
    {
        return $this->id;
    }

    public function getStatus(): ExportStatus
    {
        return $this->status;
    }

    public function getFilePath(): ?string
    {
        return $this->filePath;
    }

    public function getCreatedAt(): \DateTimeImmutable
    {
        return $this->createdAt;
    }

    public function getRequestedBy(): User
    {
        return $this->requestedBy;
    }

    public function getAuthor(): ?User
    {
        return $this->author;
    }

    public function getPhotoCount(): int
    {
        return $this->photoCount;
    }

    public function getProcessedCount(): int
    {
        return $this->processedCount;
    }

    public function getFileSize(): ?int
    {
        return $this->fileSize;
    }

    public function getFinishedAt(): ?\DateTimeImmutable
    {
        return $this->finishedAt;
    }

    public function markProcessing(int $photoCount): void
    {
        $this->status = ExportStatus::Processing;
        $this->photoCount = $photoCount;
        $this->processedCount = 0;
    }

    public function advance(int $processedCount): void
    {
        $this->processedCount = $processedCount;
    }

    public function markReady(string $filePath, int $fileSize): void
    {
        $this->filePath = $filePath;
        $this->fileSize = $fileSize;
        $this->status = ExportStatus::Ready;
        $this->finishedAt = new \DateTimeImmutable();
    }

    public function markFailed(): void
    {
        $this->status = ExportStatus::Failed;
        $this->finishedAt = new \DateTimeImmutable();
    }
}
