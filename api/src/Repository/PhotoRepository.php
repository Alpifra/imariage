<?php

namespace App\Repository;

use App\Entity\Photo;
use App\Entity\User;
use App\Enum\PhotoStatus;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;
use Symfony\Bridge\Doctrine\Types\UuidType;
use Symfony\Component\Uid\Uuid;

/**
 * @extends ServiceEntityRepository<Photo>
 */
class PhotoRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Photo::class);
    }

    /**
     * Newest first. UUIDv7 ids are time-ordered, so they double as a stable cursor
     * that does not shift when photos are added while a guest scrolls.
     *
     * @return list<Photo>
     */
    public function findPublishedPage(?User $author, ?Uuid $before, ?Uuid $after, int $limit): array
    {
        $queryBuilder = $this->createQueryBuilder('p')
            ->addSelect('a')
            ->join('p.author', 'a')
            ->andWhere('p.status = :ready')
            ->setParameter('ready', PhotoStatus::Ready)
            ->orderBy('p.id', 'DESC')
            ->setMaxResults($limit);

        if (null !== $author) {
            $queryBuilder->andWhere('p.author = :author')->setParameter('author', $author->getId(), UuidType::NAME);
        }
        if (null !== $before) {
            $queryBuilder->andWhere('p.id < :before')->setParameter('before', $before, UuidType::NAME);
        }
        if (null !== $after) {
            $queryBuilder->andWhere('p.id > :after')->setParameter('after', $after, UuidType::NAME);
        }

        /* @var list<Photo> */
        return $queryBuilder->getQuery()->getResult();
    }

    /**
     * @return array{photoCount: int, contributorCount: int, storageBytes: int}
     */
    public function getPublishedStats(): array
    {
        /** @var array{photoCount: int|string, contributorCount: int|string, storageBytes: int|string|null} $row */
        $row = $this->createQueryBuilder('p')
            ->select('COUNT(p.id) AS photoCount', 'COUNT(DISTINCT IDENTITY(p.author)) AS contributorCount', 'SUM(p.size) AS storageBytes')
            ->andWhere('p.status = :ready')
            ->setParameter('ready', PhotoStatus::Ready)
            ->getQuery()
            ->getSingleResult();

        return [
            'photoCount' => (int) $row['photoCount'],
            'contributorCount' => (int) $row['contributorCount'],
            'storageBytes' => (int) $row['storageBytes'],
        ];
    }

    /**
     * Scalars only: an export may cover thousands of photos and must not fill the identity map.
     *
     * @return list<array{originalPath: string, takenAt: ?\DateTimeImmutable, createdAt: \DateTimeImmutable, firstName: string, lastName: string}>
     */
    public function findForExport(?User $author): array
    {
        $queryBuilder = $this->createQueryBuilder('p')
            ->select('p.originalPath', 'p.takenAt', 'p.createdAt', 'a.firstName', 'a.lastName')
            ->join('p.author', 'a')
            ->andWhere('p.status = :ready')
            ->setParameter('ready', PhotoStatus::Ready)
            ->orderBy('p.id', 'ASC');

        if (null !== $author) {
            $queryBuilder->andWhere('p.author = :author')->setParameter('author', $author->getId(), UuidType::NAME);
        }

        /* @var list<array{originalPath: string, takenAt: ?\DateTimeImmutable, createdAt: \DateTimeImmutable, firstName: string, lastName: string}> */
        return $queryBuilder->getQuery()->getResult();
    }
}
