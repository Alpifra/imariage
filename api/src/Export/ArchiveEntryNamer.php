<?php

namespace App\Export;

/**
 * Names entries "20270612-213045_Jean-Dupont.jpg" so that sorting by name follows the day.
 * One instance per archive: it remembers the names already used to suffix duplicates.
 */
final class ArchiveEntryNamer
{
    /** @var array<string, int> */
    private array $used = [];

    public function name(\DateTimeImmutable $date, string $firstName, string $lastName, string $extension): string
    {
        $author = (string) preg_replace('/[\s\/\\\\:*?"<>|]+/u', '-', trim($firstName.' '.$lastName));
        $base = $date->format('Ymd-His').'_'.trim($author, '-');

        $count = $this->used[$base] = ($this->used[$base] ?? 0) + 1;

        return ($count > 1 ? $base.'_'.$count : $base).'.'.strtolower($extension);
    }
}
