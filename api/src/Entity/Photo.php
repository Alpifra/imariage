<?php

namespace App\Entity;

use App\Enum\PhotoStatus;
use App\Repository\PhotoRepository;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Bridge\Doctrine\Types\UuidType;
use Symfony\Component\Uid\Uuid;

#[ORM\Entity(repositoryClass: PhotoRepository::class)]
#[ORM\Index(name: 'idx_photo_created_at', columns: ['created_at'])]
class Photo
{
    #[ORM\Id]
    #[ORM\Column(type: UuidType::NAME, unique: true)]
    private Uuid $id;

    #[ORM\ManyToOne]
    #[ORM\JoinColumn(nullable: false, onDelete: 'CASCADE')]
    private User $author;

    #[ORM\Column(length: 255)]
    private string $originalPath;

    #[ORM\Column(length: 255, nullable: true)]
    private ?string $thumbnailPath = null;

    #[ORM\Column(length: 255, nullable: true)]
    private ?string $mediumPath = null;

    #[ORM\Column(length: 50)]
    private string $mimeType;

    #[ORM\Column]
    private int $size;

    #[ORM\Column(nullable: true)]
    private ?int $width = null;

    #[ORM\Column(nullable: true)]
    private ?int $height = null;

    #[ORM\Column(nullable: true)]
    private ?\DateTimeImmutable $takenAt = null;

    #[ORM\Column]
    private \DateTimeImmutable $createdAt;

    #[ORM\Column(length: 20, enumType: PhotoStatus::class)]
    private PhotoStatus $status = PhotoStatus::Processing;

    public function __construct(User $author, string $originalPath, string $mimeType, int $size)
    {
        $this->id = Uuid::v7();
        $this->author = $author;
        $this->originalPath = $originalPath;
        $this->mimeType = $mimeType;
        $this->size = $size;
        $this->createdAt = new \DateTimeImmutable();
    }

    public function getId(): Uuid
    {
        return $this->id;
    }

    public function getAuthor(): User
    {
        return $this->author;
    }

    public function getOriginalPath(): string
    {
        return $this->originalPath;
    }

    public function getThumbnailPath(): ?string
    {
        return $this->thumbnailPath;
    }

    public function getMediumPath(): ?string
    {
        return $this->mediumPath;
    }

    public function getMimeType(): string
    {
        return $this->mimeType;
    }

    public function getSize(): int
    {
        return $this->size;
    }

    public function getWidth(): ?int
    {
        return $this->width;
    }

    public function getHeight(): ?int
    {
        return $this->height;
    }

    public function getTakenAt(): ?\DateTimeImmutable
    {
        return $this->takenAt;
    }

    public function getCreatedAt(): \DateTimeImmutable
    {
        return $this->createdAt;
    }

    public function getStatus(): PhotoStatus
    {
        return $this->status;
    }

    public function markReady(
        string $thumbnailPath,
        string $mediumPath,
        int $width,
        int $height,
        ?\DateTimeImmutable $takenAt,
    ): void {
        $this->thumbnailPath = $thumbnailPath;
        $this->mediumPath = $mediumPath;
        $this->width = $width;
        $this->height = $height;
        $this->takenAt = $takenAt;
        $this->status = PhotoStatus::Ready;
    }

    public function markFailed(): void
    {
        $this->status = PhotoStatus::Failed;
    }
}
