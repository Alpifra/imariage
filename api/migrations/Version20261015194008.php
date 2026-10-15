<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20261015194008 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE export ADD photo_count INT NOT NULL, ADD processed_count INT NOT NULL, ADD file_size BIGINT DEFAULT NULL, ADD finished_at DATETIME DEFAULT NULL, ADD author_id BINARY(16) DEFAULT NULL');
        $this->addSql('ALTER TABLE export ADD CONSTRAINT FK_428C1694F675F31B FOREIGN KEY (author_id) REFERENCES `user` (id) ON DELETE CASCADE');
        $this->addSql('CREATE INDEX IDX_428C1694F675F31B ON export (author_id)');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE export DROP FOREIGN KEY FK_428C1694F675F31B');
        $this->addSql('DROP INDEX IDX_428C1694F675F31B ON export');
        $this->addSql('ALTER TABLE export DROP photo_count, DROP processed_count, DROP file_size, DROP finished_at, DROP author_id');
    }
}
