<?php

namespace App\Message;

final readonly class ProcessPhoto
{
    public function __construct(public string $photoId)
    {
    }
}
