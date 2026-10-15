<?php

namespace App\Dto;

use Symfony\Component\Validator\Constraints as Assert;

final class GuestIdentification
{
    #[Assert\NotBlank(normalizer: 'trim')]
    #[Assert\Length(max: 100)]
    public string $firstName = '';

    #[Assert\NotBlank(normalizer: 'trim')]
    #[Assert\Length(max: 100)]
    public string $lastName = '';

    #[Assert\NotBlank]
    public string $eventCode = '';

    /**
     * Answer to "already shared photos from another device?" when the name is already known.
     */
    public ?bool $sameGuest = null;
}
