# 🏐 Bola Alta Comunidade

Site (PWA) para organizar as peladas de vôlei de quadra da turma: marcar o jogo,
confirmar presença, controlar lista de espera, saber quem pagou e copiar o convite
pronto para o WhatsApp.

## Como funciona

- **Cadastro por aprovação.** Qualquer um se cadastra, mas só entra de fato quando
  um organizador (`ADMIN`) aprova. O primeiro usuário criado na base vira admin
  automaticamente.
- **Pelada com mínimo e máximo.** Nasce `PENDENTE`; ao bater o mínimo de
  confirmados vira `CONFIRMADA`. Acima do máximo, quem confirma entra na **lista de
  espera** e é promovido automaticamente (por ordem de chegada) se alguém desiste.
- **Rateio automático.** Você informa o custo da quadra; o valor por pessoa é
  `custo ÷ confirmados` e recalcula sozinho conforme a turma confirma. A baixa do
  pagamento é manual, feita pelo organizador.
- **Convite do WhatsApp.** Um botão gera o texto com data, hora, local, vagas,
  valor por pessoa, lista de confirmados/espera e o link direto para confirmar.
- **PWA com push.** Instalável na tela inicial e com notificação de pelada nova,
  pelada confirmada, vaga liberada na espera e cancelamento.
- **Histórico e ranking** de presença, faltas e pendências financeiras.

## Stack

| Camada  | Tecnologia                                       |
| ------- | ------------------------------------------------ |
| Front   | Next.js 15 (App Router), Tailwind, React Query    |
| Back    | NestJS 11, Mongoose                              |
| Banco   | MongoDB                                          |
| Sessão  | JWT em cookie `httpOnly`                         |
| Deploy  | Docker + Traefik (servidor pessoal)              |

Monorepo com npm workspaces:

```
apps/
  api/   NestJS  — porta 3334
  web/   Next.js — porta 3010
```

## Rodando local

```bash
npm install
cp apps/api/.env.example apps/api/.env   # ajuste o que precisar
npm run vapid                            # gera as chaves de push -> cole no .env
npm run db:up                            # MongoDB em Docker (porta 27019)
npm run seed                             # cria o admin e uma pelada de exemplo
npm run dev                              # API + web juntos
```

- Site: http://localhost:3010
- API: http://localhost:3334/api
- Admin do seed: `admin@bolaalta.com` / `bolaalta123`

Em dev o Next faz proxy de `/api/*` para a API, então o cookie de sessão fica no
mesmo domínio e não há CORS no caminho.

## Deploy no servidor

Site e API respondem no **mesmo domínio** — o Traefik manda `/api/*` para o
container da API e o resto para o Next.

```bash
cp .env.example .env && chmod 600 .env   # preencha APP_DOMAIN, JWT_SECRET, VAPID
docker compose up -d --build
```

Depois é só apontar o subdomínio na Cloudflare para o túnel do servidor.

> As notificações push só funcionam em HTTPS (ou em `localhost`).

## Papéis

| Ação                          | Jogador | Organizador |
| ----------------------------- | :-----: | :---------: |
| Ver peladas e confirmar       |   ✅    |     ✅      |
| Entrar/sair da lista de espera|   ✅    |     ✅      |
| Copiar convite do WhatsApp    |   ✅    |     ✅      |
| Criar/editar/cancelar pelada  |   —     |     ✅      |
| Aprovar cadastros             |   —     |     ✅      |
| Dar baixa em pagamento        |   —     |     ✅      |
| Mandar recado por notificação |   —     |     ✅      |

## API

```
POST   /api/auth/register|login|logout      GET /api/auth/me
GET    /api/users            (admin)        PATCH /api/users/:id/approve|reject|role
GET    /api/users/community                 PATCH /api/users/me
GET    /api/games?scope=upcoming|past|all   POST /api/games (admin)
GET    /api/games/:id                       PATCH|DELETE /api/games/:id (admin)
GET    /api/games/:id/invite                POST /api/games/:id/join|leave
POST   /api/games/:id/cancel|reopen|finish  (admin)
POST   /api/games/:id/players/:userId       (admin) — coloca alguém na pelada
PATCH  /api/games/:id/players/:userId/payment|no-show   (admin)
GET    /api/stats/ranking|me                GET /api/stats/summary (admin)
GET    /api/push/public-key                 POST /api/push/subscribe|unsubscribe
POST   /api/push/broadcast                  (admin)
```
