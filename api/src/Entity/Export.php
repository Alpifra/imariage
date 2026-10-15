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

    public function __construct(User $requestedBy)
    {
        $this->id = Uuid::v7();
        $this->requestedBy = $requestedBy;
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

    public function markProcessing(): void
    {
        $this->status = ExportStatus::Processing;
    }

    public function markReady(string $filePath): void
    {
        $this->filePath = $filePath;
        $this->status = ExportStatus::Ready;
    }

    public function markFailed(): void
    {
        $this->status = ExportStatus::Failed;
    }
}
