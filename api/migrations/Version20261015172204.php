<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20261015172204 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('CREATE TABLE device (id BINARY(16) NOT NULL, token_hash VARCHAR(64) NOT NULL, created_at DATETIME NOT NULL, last_seen_at DATETIME NOT NULL, user_id BINARY(16) NOT NULL, UNIQUE INDEX UNIQ_92FB68EB3BC57DA (token_hash), INDEX IDX_92FB68EA76ED395 (user_id), PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('CREATE TABLE export (id BINARY(16) NOT NULL, status VARCHAR(20) NOT NULL, file_path VARCHAR(255) DEFAULT NULL, created_at DATETIME NOT NULL, requested_by_id BINARY(16) NOT NULL, INDEX IDX_428C16944DA1E751 (requested_by_id), PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('CREATE TABLE photo (id BINARY(16) NOT NULL, original_path VARCHAR(255) NOT NULL, thumbnail_path VARCHAR(255) DEFAULT NULL, medium_path VARCHAR(255) DEFAULT NULL, mime_type VARCHAR(50) NOT NULL, size INT NOT NULL, width INT DEFAULT NULL, height INT DEFAULT NULL, taken_at DATETIME DEFAULT NULL, created_at DATETIME NOT NULL, status VARCHAR(20) NOT NULL, author_id BINARY(16) NOT NULL, INDEX idx_photo_created_at (created_at), INDEX IDX_14B78418F675F31B (author_id), PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('CREATE TABLE `user` (id BINARY(16) NOT NULL, first_name VARCHAR(100) NOT NULL, last_name VARCHAR(100) NOT NULL, normalized_name VARCHAR(201) NOT NULL, roles JSON NOT NULL, username VARCHAR(180) DEFAULT NULL, password VARCHAR(255) DEFAULT NULL, created_at DATETIME NOT NULL, UNIQUE INDEX UNIQ_8D93D649F85E0677 (username), INDEX idx_user_normalized_name (normalized_name), PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('ALTER TABLE device ADD CONSTRAINT FK_92FB68EA76ED395 FOREIGN KEY (user_id) REFERENCES `user` (id) ON DELETE CASCADE');
        $this->addSql('ALTER TABLE export ADD CONSTRAINT FK_428C16944DA1E751 FOREIGN KEY (requested_by_id) REFERENCES `user` (id) ON DELETE CASCADE');
        $this->addSql('ALTER TABLE photo ADD CONSTRAINT FK_14B78418F675F31B FOREIGN KEY (author_id) REFERENCES `user` (id) ON DELETE CASCADE');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE device DROP FOREIGN KEY FK_92FB68EA76ED395');
        $this->addSql('ALTER TABLE export DROP FOREIGN KEY FK_428C16944DA1E751');
        $this->addSql('ALTER TABLE photo DROP FOREIGN KEY FK_14B78418F675F31B');
        $this->addSql('DROP TABLE device');
        $this->addSql('DROP TABLE export');
        $this->addSql('DROP TABLE photo');
        $this->addSql('DROP TABLE `user`');
    }
}
