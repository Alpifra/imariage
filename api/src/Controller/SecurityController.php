<?php

namespace App\Controller;

use App\Entity\User;
use App\Repository\PhotoRepository;
use App\State\CurrentGuestProvider;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\CurrentUser;

final class SecurityController extends AbstractController
{
    /**
     * Only reached once json_login has authenticated the request.
     */
    #[Route('/api/login', name: 'api_login', methods: ['POST'])]
    public function login(#[CurrentUser] ?User $user, PhotoRepository $photos): JsonResponse
    {
        if (null === $user) {
            return $this->json(['detail' => 'Missing credentials.'], 401);
        }

        return $this->json(CurrentGuestProvider::fromUser($user, $photos));
    }

    #[Route('/api/logout', name: 'api_logout', methods: ['POST'])]
    public function logout(): never
    {
        throw new \LogicException('Intercepted by the logout key of the firewall.');
    }
}
