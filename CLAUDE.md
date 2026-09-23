# Pyne Awards Africa 2026 — Mini-site do evento

> Este ficheiro é o briefing do projecto para o Claude Code. Lê-o todo antes de começar.
> Idioma de trabalho com o Kinho: **português (Moçambique)**. Respostas curtas e directas.

## 1. Contexto

- **Evento:** The Pyne Awards Africa 2026 (6.ª edição) — Maputo, **24 a 26 de Setembro de 2026**.
- **Prazo:** o site tem de estar **online antes das 08h00 de 24/09** (primeira sessão do Dia 1). Trabalhamos contra o relógio: primeiro funcional, depois bonito.
- **O quê:** um site **pequeno**, de uma só finalidade, com três coisas:
  1. **Agenda** do programa (3 dias, 5 blocos, 37 itens).
  2. **Galeria** de fotos actualizada **em tempo real** durante o evento.
  3. **Perguntas em tempo real** (Q&A): o público envia dúvidas, a equipa modera, aparecem ao vivo.
  4. Um **QR Code** que leva ao site (para imprimir/projectar no local).
- **Domínio:** vai viver num **subdomínio** de um domínio já existente (ex.: `pyne.<dominio-principal>`). O domínio exacto ainda não está definido → usar a variável `VITE_SITE_URL`.
- **Bilingue:** PT (padrão) e EN. Os dois documentos originais (PT e EN) têm o mesmo programa; já foram fundidos em `data/programa.json`.
- Projecto semelhante já feito pelo Kinho: portal BFSI Mozambique 2026 (mesma stack, card "A decorrer agora", agenda por dias, galeria Supabase). Seguir o mesmo espírito.

## 2. Stack (decidida)

- **Vite + React + TypeScript + Tailwind CSS**
- **React Router** (rotas abaixo)
- **Supabase**: Postgres + **Realtime** + **Storage** + **Auth** (só para a equipa)
- **Vercel** para deploy (SPA: adicionar `vercel.json` com rewrite de tudo para `/index.html`)
- Bibliotecas: `@supabase/supabase-js`, `qrcode.react` (QR), `browser-image-compression` (comprimir fotos antes do upload), `date-fns-tz` ou `Intl` para fuso horário
- **Fuso horário:** `Africa/Maputo` (UTC+2). Toda a lógica de "agora" usa este fuso, independentemente do dispositivo.

Variáveis de ambiente (`.env.local` e Vercel):
```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_SITE_URL=https://pyne.exemplo.co.mz
```

## 3. Ficheiros já prontos nesta pasta

| Ficheiro | O que é |
|---|---|
| `data/programa.json` | Programa completo, bilingue, estruturado (dias → blocos → itens → oradores). **Fonte única da agenda.** Ler o campo `_notes` (correcções feitas e pontos por confirmar). |
| `supabase/schema.sql` | Tabelas `photos` e `questions`, RLS, função `upvote_question`, Realtime e bucket `galeria`. Colar no SQL Editor do Supabase. |
| `public/pyne-emblem.png` | Emblema dourado do Pyne Awards (retirado do documento). |
| `public/partners-banner.png` | Faixa de logótipos (Pyne, República de Moçambique, CMM, I Love Maputo, Media Craft) em fundo azul-marinho — usar no rodapé. |

A agenda é **estática** (importar o JSON no build). Não criar tabela de agenda no Supabase — não há tempo nem necessidade.

## 4. Identidade visual

Cores extraídas dos materiais oficiais:

- Azul-marinho `#13263D` (fundo principal)
- Dourado `#FDC91C` (destaques, botões, linha do tempo)
- Vermelho `#C12128` (acento pontual: "Ao vivo", badges)
- Branco `#FFFFFF`

Tom: gala, elegante, africano. Fundo escuro, títulos numa serif elegante (ex.: *Playfair Display* ou *Cormorant*), corpo em sans (*Inter*). **Mobile-first** — 90 % das pessoas vão abrir pelo QR no telemóvel. Botões grandes, texto legível, carregamento rápido.

## 5. Páginas / rotas

```
/            Início: hero (nome, datas, local), card "A decorrer agora / A seguir",
             3 atalhos grandes (Agenda · Galeria · Perguntas), rodapé com parceiros
/agenda      Agenda por dias
/galeria     Galeria em tempo real
/perguntas   Enviar pergunta + lista de perguntas aprovadas (tempo real, votos)
/ecra        Modo projector: perguntas aprovadas em letra grande, auto-actualiza (sem navegação)
/qr          QR Code grande do site + botões "Descarregar PNG" e "Descarregar SVG"
/admin       Login da equipa (Supabase Auth, email+password) →
             separador "Fotos" (upload múltiplo) e separador "Perguntas" (moderar)
```
Selector PT/EN fixo no cabeçalho (guardar escolha em `localStorage`, com try/catch).

### 5.1 Agenda
- Tabs por dia: **Dia 1 · 24 Set**, **Dia 2 · 25 Set**, **Dia 3 · 26 Set**. Abrir automaticamente no dia actual (em Maputo) durante o evento.
- Cada bloco (evento) em cartão: título, local, horário, **traje** (dress code) e público, se existirem.
- Itens em linha do tempo: hora início–fim, título, responsável; se houver `speakers`, listar nome + cargo.
- Destacar o item **a decorrer agora** (badge vermelho "Ao vivo"/"Live") e esmaecer os já terminados.
- A Gala (`highlight: true`) tem tratamento visual especial (dourado).
- Itens com `end: null` (marcos como "Encerramento") mostram só a hora.

### 5.2 Card "A decorrer agora"
Na página inicial: mostra o item actual e o seguinte (com base na hora de Maputo). Antes do evento → contagem decrescente para 24/09 08h00. Depois do fim → "Obrigado! Veja a galeria". Actualizar a cada 30 s.

### 5.3 Galeria em tempo real
- Grelha responsiva de miniaturas (2 colunas no telemóvel, 4+ no desktop), mais recentes primeiro.
- Filtro por dia (Todos · Dia 1 · Dia 2 · Dia 3).
- **Realtime:** subscrever `INSERT`/`UPDATE`/`DELETE` em `photos`; nova foto aparece no topo com uma pequena animação e um aviso "X novas fotos".
- Clicar abre **lightbox** (setas, swipe no telemóvel, botão descarregar a imagem grande).
- Paginação/infinite scroll de 40 em 40.
- **Upload (em /admin):** seleccionar várias fotos de uma vez (telemóvel ou PC) → no browser gerar versão grande (máx. 1600 px, ~80 % JPEG/WebP) e miniatura (480 px) com `browser-image-compression` → enviar as duas para o bucket `galeria` (`{dia}/{uuid}.webp` e `{dia}/thumbs/{uuid}.webp`) → inserir linha em `photos`. Barra de progresso por ficheiro. Escolher dia e bloco (evento) antes do upload; por defeito o dia/bloco actual.
- Admin pode esconder/apagar uma foto.

### 5.4 Perguntas em tempo real (Q&A)
- Formulário: nome (opcional, "Anónimo" se vazio), sessão (select com os blocos do programa, por defeito o actual), pergunta (máx. 400 caracteres).
- Ao enviar: mensagem "Obrigado! A sua pergunta será analisada pela equipa." Limitar a 1 envio a cada 30 s por dispositivo (localStorage).
- Lista pública: só `approved` e `answered`, ordenadas por `pinned`, depois `votes`, depois data. Botão 👍 chama `rpc('upvote_question')`, 1 voto por pergunta por dispositivo (localStorage).
- **Realtime** em `questions` para a lista pública, para `/ecra` e para o painel do moderador.
- Moderador (/admin → Perguntas): separadores Pendentes / Aprovadas / Respondidas / Rejeitadas; botões Aprovar, Rejeitar, Marcar respondida, Fixar. Novas pendentes aparecem sem recarregar (com contador).
- `/ecra`: fundo escuro, pergunta fixada em destaque grande, restantes aprovadas abaixo; QR pequeno no canto a dizer "Envie a sua pergunta".

### 5.5 QR Code
- `/qr` gera o QR de `VITE_SITE_URL` (com emblema Pyne ao centro, nível de correcção H), com legenda "Agenda · Galeria · Perguntas".
- Opção de gerar QR para `/perguntas` directamente (para projectar durante os painéis).
- Descarregar em PNG (alta resolução, 2048 px) e SVG para impressão.

## 6. Ordem de trabalho (prioridades)

1. **Esqueleto + Agenda + QR + deploy na Vercel** (tem de ficar pronto primeiro — é o que se usa amanhã às 08h00).
2. **Galeria** (upload no /admin + vista pública em tempo real).
3. **Perguntas** (envio, moderação, /ecra).
4. Afinações: card "A decorrer agora", animações, SEO/meta tags (Open Graph com o emblema), favicon.

Depois de cada etapa: `npm run build` sem erros, testar em largura de telemóvel (375 px) e fazer deploy.

## 7. Configuração (passos para o Kinho)

1. Criar projecto no Supabase → SQL Editor → colar e correr `supabase/schema.sql`.
2. Authentication → Users → criar a conta da equipa (email + password).
3. Copiar URL e anon key para `.env.local` e para as variáveis da Vercel.
4. Vercel → Domains → adicionar o subdomínio; no DNS do domínio principal criar `CNAME pyne → cname.vercel-dns.com`.
5. Imprimir o QR a partir de `/qr` depois de o subdomínio estar activo (o QR aponta para `VITE_SITE_URL`).

## 8. Pontos por confirmar com a organização

- Subdomínio final (ex.: `pyne.pulse.co.mz`?).
- Gala: há um intervalo 22h00–22h10 entre o Jantar e o Encerramento — manter como está?
- Dia 2 (Encontros de Negócios) e Dia 3 não têm traje indicado.
- Correcções já feitas no JSON: "Presidiu" → "Presidium"; "Payne" → "Pyne".
- Quem vai carregar fotos durante o evento (quantas contas de equipa)?

## 9. Regras

- Não inventar conteúdo do programa: tudo vem de `data/programa.json`.
- Não usar `alert()`/`confirm()` nativos; usar toasts/modais próprios.
- Todo o texto de interface em PT e EN (ficheiro `src/i18n.ts` simples com objecto de traduções).
- Acessibilidade básica: contraste AA, `alt` nas imagens, foco visível.
- Código simples e legível; sem dependências desnecessárias.
