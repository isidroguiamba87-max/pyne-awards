Cola isto no Claude Code (VS Code), com esta pasta aberta como projecto:

---

Lê o CLAUDE.md, o data/programa.json e o supabase/schema.sql. Vamos construir o mini-site do Pyne Awards Africa 2026 descrito no CLAUDE.md.

Começa pela Prioridade 1: cria o projecto Vite + React + TypeScript + Tailwind nesta pasta (sem apagar data/, public/, supabase/ nem os .md), com React Router, i18n PT/EN, as cores da marca, a página inicial, a página /agenda a ler o data/programa.json (tabs por dia, item "Ao vivo" pela hora de Africa/Maputo) e a página /qr. Adiciona o vercel.json para SPA e um .env.example.

No fim corre `npm run build`, confirma que não há erros e diz-me em poucas linhas o que falta eu configurar (Supabase, Vercel, DNS). Depois seguimos para a Galeria e para as Perguntas.
