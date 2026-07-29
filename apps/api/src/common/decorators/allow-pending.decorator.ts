import { SetMetadata } from '@nestjs/common';

export const ALLOW_PENDING_KEY = 'allowPending';

/**
 * Libera a rota para quem está logado mas ainda não foi aprovado por um admin
 * (usado no /auth/me e no logout, para a tela de "aguardando aprovação").
 */
export const AllowPending = () => SetMetadata(ALLOW_PENDING_KEY, true);
