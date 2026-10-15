<?php

namespace App\Message;

final readonly class BuildExport
{
    public function __construct(public string $exportId)
    {
    }
}
