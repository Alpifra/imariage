<?php

namespace App\Entity;

use App\Repository\UserRepository;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Bridge\Doctrine\Types\UuidType;
use Symfony\Component\Security\Core\User\PasswordAuthenticatedUserInterface;
use Symfony\Component\Security\Core\User\UserInterface;
use Symfony\Component\Uid\Uuid;

#[ORM\Entity(repositoryClass: UserRepository::class)]
#[ORM\Table(name: '`user`')]
#[ORM\Index(name: 'idx_user_normalized_name', columns: ['normalized_name'])]
class User implements UserInterface, PasswordAuthenticatedUserInterface
{
    public const string ROLE_GUEST = 'ROLE_GUEST';
    public const string ROLE_ADMIN = 'ROLE_ADMIN';

    #[ORM\Id]
    #[ORM\Column(type: UuidType::NAME, unique: true)]
    private Uuid $id;

    #[ORM\Column(length: 100)]
    private string $firstName;

    #[ORM\Column(length: 100)]
    private string $lastName;

    #[ORM\Column(length: 201)]
    private string $normalizedName;

    /** @var list<string> */
    #[ORM\Column(type: Types::JSON)]
    private array $roles = [self::ROLE_GUEST];

    #[ORM\Column(length: 180, unique: true, nullable: true)]
    private ?string $username = null;

    #[ORM\Column(nullable: true)]
    private ?string $password = null;

    #[ORM\Column]
    private \DateTimeImmutable $createdAt;

    public function __construct(string $firstName, string $lastName, string $normalizedName)
    {
        $this->id = Uuid::v7();
        $this->firstName = $firstName;
        $this->lastName = $lastName;
        $this->normalizedName = $normalizedName;
        $this->createdAt = new \DateTimeImmutable();
    }

    public function getId(): Uuid
    {
        return $this->id;
    }

    public function getFirstName(): string
    {
        return $this->firstName;
    }

    public function getLastName(): string
    {
        return $this->lastName;
    }

    public function getNormalizedName(): string
    {
        return $this->normalizedName;
    }

    public function rename(string $firstName, string $lastName, string $normalizedName): void
    {
        $this->firstName = $firstName;
        $this->lastName = $lastName;
        $this->normalizedName = $normalizedName;
    }

    public function getUserIdentifier(): string
    {
        return null !== $this->username && '' !== $this->username ? $this->username : $this->id->toRfc4122();
    }

    /** @return list<string> */
    public function getRoles(): array
    {
        return array_values(array_unique([...$this->roles, self::ROLE_GUEST]));
    }

    /** @param list<string> $roles */
    public function setRoles(array $roles): void
    {
        $this->roles = $roles;
    }

    public function isAdmin(): bool
    {
        return \in_array(self::ROLE_ADMIN, $this->roles, true);
    }

    public function getUsername(): ?string
    {
        return $this->username;
    }

    public function setUsername(?string $username): void
    {
        $this->username = $username;
    }

    public function getPassword(): ?string
    {
        return $this->password;
    }

    public function setPassword(?string $password): void
    {
        $this->password = $password;
    }

    public function getCreatedAt(): \DateTimeImmutable
    {
        return $this->createdAt;
    }
}
