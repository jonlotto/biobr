# Régua de espaçamento — painel admin VtrineBio

Base: grade de 8. Objetivo: padronizar sem redesenhar. Cores, bordas, raios e sombras não mudam.

## Valores permitidos

| px | Tailwind | Uso |
|----|----------|-----|
| 0  | 0  | — |
| 4  | 1  | Exceção: só nos casos listados em "Onde 4 é permitido" |
| 8  | 2  | Elementos relacionados (ícone↔texto, label↔campo, título↔subtítulo, entre pílulas/botões lado a lado) |
| 16 | 4  | Padrão: padding de card, entre campos, entre cards de uma lista, divisores |
| 24 | 6  | Padding de card de destaque, título da página↔conteúdo, padding lateral da página (desktop) |
| 32 | 8  | Entre seções, topo da página |
| 40 | 10 | Altura de campo e botão secundário |
| 48 | 12 | Altura do botão principal, espaço grande entre blocos |
| 64 | 16 | Altura da bottom nav, respiros grandes |

Não usar: 2, 6, 10, 12, 14, 20, 28 (`0.5`, `1.5`, `2.5`, `3`, `3.5`, `5`, `7`).

## Onde 4 é permitido
- Entre campo e mensagem de erro/ajuda.
- Padding vertical de selos/badges pequenos (`px-2 py-1`).
- Entre ícone e texto em elementos compactos (texto ≤ 12px).

## Página
- Padding lateral: 16 no mobile, 24 no desktop.
- Topo: 32. Rodapé com bottom nav: espaço suficiente para ela não cobrir conteúdo.
- Título da página → conteúdo: 24.
- Entre seções: 32.

## Cards e blocos
- Padding: 16 (padrão) ou 24 (card de destaque/estado vazio).
- Entre cards de uma lista: 16.
- Divisor dentro de card: 16 acima e 16 abaixo.
- Título → subtítulo: 8. Subtítulo → conteúdo: 16 ou 24.
- Listas de opções clicáveis (seletores, menus): 8 entre itens.
- Estado vazio: 24 lateral e 40 vertical (`px-6 py-10`).

## Formulários
- Label → campo: 8.
- Entre campos: 16.
- Campo → erro/ajuda: 4.
- Exceção: campos empilhados dentro de um bloco compacto (ex.: bloco de link aberto) usam 8 entre si.

## Alturas de controles
- Campo, select, botão secundário: 40.
- Botão principal: 48 (ou 56 se já for maior hoje; não diminuir).
- Pílula/chip: 40 de altura (`h-10 px-4`), gap 8 entre elas.
- Botão de ícone: 32 (compacto) ou 40.
- Área de toque mínima no mobile: 40; itens da bottom nav: 48.

## Regras para converter valores fora da grade
- 2 → 0 ou 4
- 6 → 8 (ou 4 se for caso permitido)
- 10 → 8
- 12 → 8 se ligar elementos relacionados; 16 se separar blocos
- 20 → 24 (ou 16 se apertar o layout)
- Na dúvida, escolher o valor que muda menos o visual atual.

## Fora da régua
- Tamanho de ícones, bordas de 1px, line-height e tamanhos de fonte.
- Margem negativa + padding usados só para ampliar área de toque.
- Conteúdo do preview do celular e página pública da bio.
