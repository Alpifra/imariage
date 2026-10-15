<?php

namespace App\Repository;

use App\Entity\Photo;
use App\Entity\User;
use App\Enum\PhotoStatus;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<User>
 */
class UserRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, User::class);
    }

    /**
     * @return list<array{user: User, photoCount: int}>
     */
    public function findAllWithPhotoCount(): array
    {
        /** @var list<array{0: User, photoCount: int|string}> $rows */
        $rows = $this->createQueryBuilder('u')
            ->addSelect('COUNT(p.id) AS photoCount')
            ->leftJoin(Photo::class, 'p', 'WITH', 'p.author = u AND p.status = :ready')
            ->setParameter('ready', PhotoStatus::Ready)
            // Only admins have a username
            ->andWhere('u.username IS NULL')
            ->groupBy('u.id')
            ->orderBy('u.lastName')
            ->addOrderBy('u.firstName')
            ->getQuery()
            ->getResult();

        return array_map(static fn (array $row): array => ['user' => $row[0], 'photoCount' => (int) $row['photoCount']], $rows);
    }
}
