<?php

namespace App\Photo;

final readonly class ProcessedImage
{
    public function __construct(
        public string $thumbnail,
        public string $medium,
        public int $width,
        public int $height,
        public ?\DateTimeImmutable $takenAt,
    ) {
    }
}
