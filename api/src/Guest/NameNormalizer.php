<?php

namespace App\Guest;

final class NameNormalizer
{
    public function clean(string $name): string
    {
        $collapsed = trim((string) preg_replace('/\s+/u', ' ', $name));

        // Mixed case is kept as typed so that names like "McDonald" or "de La Tour" survive
        if ($collapsed !== mb_strtolower($collapsed) && $collapsed !== mb_strtoupper($collapsed)) {
            return $collapsed;
        }

        return (string) preg_replace_callback(
            "/(^|[\\s\\-'’])(\\p{L})/u",
            static fn (array $m): string => $m[1].mb_strtoupper($m[2]),
            mb_strtolower($collapsed),
        );
    }

    public function normalize(string $firstName, string $lastName): string
    {
        $name = $this->clean($firstName).' '.$this->clean($lastName);
        $ascii = (string) transliterator_transliterate('Any-Latin; Latin-ASCII; Lower()', $name);

        return trim((string) preg_replace('/[\s\-]+/', ' ', $ascii));
    }
}
