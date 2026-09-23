Lê primeiro o CLAUDE.md, o data/programa.json e o supabase/schema.sql desta pasta. Esse é o briefing completo. Vais construir o mini-site do Pyne Awards Africa 2026 do princípio ao fim, sem parar entre fases, a não ser que precises de algo que só eu te posso dar (chaves do Supabase, domínio). Fala comigo em português.

REGRAS GERAIS
- Não apagues nem alteres data/, public/, supabase/, CLAUDE.md nem os ficheiros PROMPT_*.md.
- A agenda vem só do data/programa.json. Não inventes conteúdo.
- Mobile-first (testa a 375 px), bilingue PT/EN, cores da marca: #13263D (fundo), #FDC91C (dourado), #C12128 (vermelho), branco.
- Fuso horário sempre Africa/Maputo, seja qual for o dispositivo.
- Sem alert()/confirm() nativos. localStorage sempre dentro de try/catch.
- No fim de cada fase: `npm run build` sem erros nem avisos de TypeScript. Se falhar, corrige antes de avançar.
- Se as variáveis do Supabase ainda não existirem, continua na mesma: o site tem de funcionar (agenda e QR) sem Supabase, e a galeria/perguntas mostram "Em breve" em vez de rebentar.

FASE 1 — ESQUELETO
1. Cria o projecto Vite + React + TypeScript nesta pasta (sem apagar o que já existe). Instala: react-router-dom, tailwindcss (configurado), @supabase/supabase-js, qrcode.react, browser-image-compression, lucide-react.
2. Fontes: Playfair Display (títulos) e Inter (texto), via Google Fonts no index.html.
3. Estrutura:
   src/lib/supabase.ts (cliente; exporta `null` se faltarem variáveis)
   src/lib/time.ts (hora actual em Africa/Maputo, "a decorrer agora", "a seguir", contagem decrescente)
   src/i18n.ts (dicionário PT/EN + hook useLang; escolha guardada em localStorage)
   src/data/programa.ts (importa ../../data/programa.json com tipos TypeScript)
   src/components/ (Header com selector PT/EN, Footer com public/partners-banner.png, Layout, Toast)
   src/pages/ (Home, Agenda, Galeria, Perguntas, Ecra, QR, Admin)
4. Rotas: / , /agenda , /galeria , /perguntas , /ecra , /qr , /admin . A /ecra não mostra header nem footer.
5. Cria vercel.json (rewrite de tudo para /index.html), .env.example com VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY e VITE_SITE_URL, e .gitignore.
6. Meta tags: título, descrição, Open Graph com public/pyne-emblem.png, favicon a partir do emblema, theme-color #13263D.

FASE 2 — INÍCIO E AGENDA
1. Início: hero com emblema, "The Pyne Awards Africa 2026", "Maputo · 24–26 Setembro 2026"; card "A decorrer agora / A seguir" (antes do evento mostra contagem decrescente para 24/09 às 08:00; depois do fim mostra "Obrigado! Veja a galeria"; actualiza a cada 30 s); três botões grandes: Agenda, Galeria, Perguntas.
2. Agenda: tabs Dia 1 · Dia 2 · Dia 3, que abrem automaticamente no dia de hoje durante o evento. Cada bloco num cartão com título, subtítulo, local, horário, traje e público (só os campos que existem). Os itens aparecem em linha do tempo com a hora, o título, o responsável e os oradores (nome e cargo). O item actual leva o badge vermelho "Ao vivo"/"Live" e os já terminados ficam esmaecidos. A Gala (highlight) tem destaque dourado. Os itens com end null mostram só a hora. Botão "Ir para agora".
3. Para testar, aceita ?now=2026-09-25T19:45 na URL, que simula a hora (só para desenvolvimento).

FASE 3 — QR CODE
1. /qr: QR grande de VITE_SITE_URL (ou window.location.origin se não existir), com o emblema ao centro e nível de correcção H. Legenda: "Agenda · Galeria · Perguntas".
2. Um selector para gerar o QR do site inteiro ou só de /perguntas.
3. Botões "Descarregar PNG" (2048 px) e "Descarregar SVG". A página tem de ter bom aspecto também quando é impressa (@media print).

FASE 4 — ADMIN (login)
1. /admin: login com email e password (Supabase Auth). Depois de entrar, dois separadores: Fotos e Perguntas, e um botão Sair.
2. Protege as acções no cliente, mas a segurança real está no RLS do schema.sql.

FASE 5 — GALERIA EM TEMPO REAL
1. Upload (Admin → Fotos): selecção múltipla, que no telemóvel também abre a câmara/galeria. Selectores de Dia e de Bloco do programa, que por defeito ficam no dia e bloco actuais, e uma legenda opcional. Para cada ficheiro, no browser: versão grande com máx. 1600 px e miniatura com 480 px, ambas em WebP com qualidade ~0.8. Envia para o bucket "galeria" em `dia-{n}/{uuid}.webp` e `dia-{n}/thumbs/{uuid}.webp` e insere a linha em photos (com width e height). Mostra uma barra de progresso por ficheiro e envia no máximo 3 em paralelo. Os erros aparecem por ficheiro, com um botão "Tentar de novo".
2. Na lista de fotos do admin: botões esconder/mostrar e apagar (apaga também os ficheiros do bucket), com um modal próprio de confirmação.
3. Página /galeria: grelha de miniaturas (2 colunas no telemóvel, 3 no tablet, 5 no desktop), das mais recentes para as mais antigas, com lazy loading. Filtro Todos / Dia 1 / Dia 2 / Dia 3. Carrega 40 de cada vez, com scroll infinito.
4. Realtime: subscreve INSERT/UPDATE/DELETE em photos. Se o utilizador estiver no topo, a foto nova entra com animação. Se estiver mais abaixo, aparece o aviso "N novas fotos ↑".
5. Lightbox: setas, swipe, tecla Esc, contador, legenda e botão "Descarregar" da versão grande.

FASE 6 — PERGUNTAS EM TEMPO REAL
1. /perguntas: formulário com nome (opcional; vazio = "Anónimo"), sessão (os blocos do programa, por defeito o actual) e pergunta (3–400 caracteres, com contador). Ao enviar: toast "Obrigado! A sua pergunta será analisada pela equipa." Um envio a cada 30 s por dispositivo.
2. Lista pública só com as perguntas approved e answered, ordenadas por pinned, depois votes, depois data. Filtro por sessão. Botão 👍 que usa rpc('upvote_question'), com um voto por pergunta por dispositivo. As respondidas levam o badge "Respondida".
3. Admin → Perguntas: separadores Pendentes (com contador), Aprovadas, Respondidas e Rejeitadas. Acções: Aprovar, Rejeitar, Marcar respondida, Fixar/Desafixar e Apagar. Tempo real, sem recarregar a página. Som discreto opcional quando entra uma pendente.
4. /ecra (projector): fundo #13263D e letra muito grande. A pergunta fixada aparece em destaque e até 5 aprovadas por baixo, rodando a cada 10 s se houver mais. Mostra o nome da sessão actual e, no canto, um QR pequeno de /perguntas com "Envie a sua pergunta". Tempo real. Um botão de ecrã inteiro que desaparece ao fim de 3 s sem mexer o rato.

FASE 7 — ACABAMENTOS E VERIFICAÇÃO
1. Estados de carregamento (skeletons), estados vazios ("Ainda sem fotos — volte em breve") e mensagens de erro de rede, tudo em PT e EN.
2. Acessibilidade: contraste AA, alt nas imagens, foco visível, botões com aria-label.
3. Revê todas as páginas a 375 px e a 1440 px (se tiveres browser/Playwright disponível, tira screenshots e verifica).
4. `npm run build` final sem erros. Corre `npx tsc --noEmit`.
5. Cria um README.md curto, em português, com: como correr localmente, como configurar o Supabase (correr schema.sql e criar o utilizador da equipa), as variáveis na Vercel, o DNS do subdomínio (CNAME → cname.vercel-dns.com) e como usar o /admin, o /ecra e o /qr no dia do evento.
6. Inicializa o git e faz um commit ("Mini-site Pyne Awards Africa 2026").

NO FIM, responde-me só com:
- o que ficou pronto (lista curta);
- os passos que eu tenho de fazer (Supabase, Vercel, domínio), por ordem;
- qualquer coisa do programa que precise de confirmação (ver `_notes` em data/programa.json).
