<?php

namespace App\Enum;

enum PhotoStatus: string
{
    case Processing = 'processing';
    case Ready = 'ready';
}
