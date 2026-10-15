<?php

namespace App\Dto;

use Symfony\Component\Validator\Constraints as Assert;

final class ExportRequest
{
    /** Guest id; omitted to export every guest's photos */
    #[Assert\Uuid]
    public ?string $author = null;
}
