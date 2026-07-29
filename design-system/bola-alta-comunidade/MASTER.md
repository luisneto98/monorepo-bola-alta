# Bola Alta Comunidade — Design System (MASTER)

> Fonte da verdade visual do app. Gerado com a skill `ui-ux-pro-max`
> (padrão **Community**, estilo **Kinetic Brutalism** adaptado para web/Tailwind,
> paleta **Sports/GPS tracking**) e ajustado para a identidade já aprovada:
> laranja de bola sobre azul de quadra.
>
> Ao construir uma página, veja antes se existe `pages/<pagina>.md` — as regras
> de lá sobrescrevem este arquivo. Se não existir, siga estritamente o que está aqui.

## Direção

Cara de **placar de ginásio**: fundo escuro, tipografia display gigante em caixa
alta, blocos de cor chapada, bordas duras de 2px e quase nenhum arredondamento.
Nada de card fofinho com sombra suave — cada pelada é um *ticket* de jogo.

- **Dark-first, tema único.** O app é usado à noite, no ginásio ou no ônibus. Um
  tema só = contraste garantido e metade da superfície de bug visual.
- **Densidade padrão** (escala 8px), **variância alta** (assimetria, blocos
  oversized), **movimento padrão** (stagger de entrada, marquee, flood no toque).

## Tokens

### Cor

| Token            | Hex                   | Uso                                   |
| ---------------- | --------------------- | ------------------------------------- |
| `canvas`         | `#0B1120`             | Fundo da aplicação                    |
| `surface`        | `#141C2F`             | Cards, listas, barras                 |
| `surface-high`   | `#1C2740`             | Estado elevado / hover                |
| `line`           | `#2C3A57`             | Bordas 2px e divisórias               |
| `brand` (bola)   | `#F97316` / `#EA580C` | Ação primária, destaque, dado ativo   |
| `court` (quadra) | `#3B82F6` / `#1D4ED8` | Ação secundária, informação           |
| `go`             | `#10B981`             | Confirmado, pago                      |
| `warn`           | `#FBBF24`             | Aguardando, a pagar                   |
| `stop`           | `#F43F5E`             | Cancelado, falta, dívida              |
| `fg`             | `#F8FAFC`             | Texto primário (≥ 4.5:1 no canvas)    |
| `fg-muted`       | `#94A3B8`             | Texto secundário (≥ 4.5:1 no surface) |

Nunca hex solto em componente — sempre o token do Tailwind (`bg-surface`,
`text-fg-muted`, `border-line`).

### Tipografia

- **Display:** Space Grotesk 700/800 — títulos, números, rótulos. Sempre
  `uppercase`, `tracking-tight` em tamanhos grandes e `tracking-[.18em]` em
  rótulos pequenos.
- **Corpo:** Inter 400/500/600 — texto corrido, 16px mínimo.
- Escala display: `clamp(2rem, 9vw, 3.5rem)` para o número/estado dominante.

### Forma e movimento

- `radius: 0` como padrão; `4px` só em pílulas de status.
- Bordas de **2px** (`border-2 border-line`) — é a borda que dá a cara, não a sombra.
- Transições de **100–250ms**. Entrada de lista com **stagger de 40ms** por item.
- Toque: *flood* — o bloco inteiro inverte para laranja/preto por 100ms. Nunca
  transform que empurre o layout.
- Tudo isso morre sob `prefers-reduced-motion: reduce` (marquee inclusive).

## Regras de componente

- **Card de pelada = ticket.** Coluna esquerda com o dia em número gigante e o
  estado em bloco de cor; corpo com hora, quadra e rateio; rodapé com o medidor.
- **Medidor de jogadores segmentado**, não barra lisa: um quadradinho por vaga,
  preenchido = confirmado, contorno tracejado = vaga livre, marca no mínimo. Dá
  para contar as vagas de relance, que é o que a pessoa quer saber.
- **Bottom nav** com no máximo 4 itens, alvo ≥ 44px, item ativo em bloco laranja.
- **Ícones:** só Lucide (SVG). Emoji **nunca** como ícone de UI — a bola do logo
  é um SVG próprio (`components/logo.tsx`). Emoji só no texto do convite do
  WhatsApp, que não é UI.
- **Estados sempre em texto + cor**, nunca só cor (daltonismo).

## Checklist de entrega

- [ ] Contraste ≥ 4.5:1 para texto, ≥ 3:1 para glifos
- [ ] Alvos de toque ≥ 44×44px com 8px de folga
- [ ] Foco visível no teclado (`focus-visible:ring-2 ring-brand`)
- [ ] `prefers-reduced-motion` respeitado
- [ ] Safe area (`env(safe-area-inset-*)`) no header e na bottom nav
- [ ] Sem scroll horizontal em 375px
- [ ] Nenhum emoji como ícone
