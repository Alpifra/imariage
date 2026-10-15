<?php

namespace App\Enum;

enum ExportStatus: string
{
    case Pending = 'pending';
    case Processing = 'processing';
    case Ready = 'ready';
    case Failed = 'failed';
}
