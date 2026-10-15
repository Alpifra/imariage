<?php

namespace App\Exception;

use Symfony\Component\HttpKernel\Exception\ConflictHttpException;

/**
 * The name is already known: the guest must say whether it is them before going further.
 */
final class IdentityCheckRequiredException extends ConflictHttpException
{
    public function __construct(public readonly string $displayName)
    {
        parent::__construct($displayName);
    }
}
