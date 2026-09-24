O programa do evento foi revisto hoje (24/09). Substituí o ficheiro data/programa.json pela versão nova. O evento já está a decorrer, por isso faz isto rápido e com cuidado.

ALTERAÇÕES DO NOVO PROGRAMA (para confirmares que o JSON as tem):

Dia 1 — ELEVATE Breakfast (Polana Serena)
- Horário do bloco: 08:00–12:10 (antes era 08:00–12:00).
- REMOVIDO: 09:00–09:10 "Intervenção do Secretário de Estado do Turismo" (Fredson Bacar).
- "Intervenções de Contexto" passa a 09:00–10:00 (antes 09:10–10:00).
- 11:00–11:05 "Considerações finais": o responsável passa a "Helder Jauana — PCA da ANDITUR" (EN: "Helder Jauana — Chairman of the Board, ANDITUR").
- NOVO: 11:05–11:10 "Discurso de encerramento" / "Closing address", por S. Ex.ª Rasaque Manhique, Presidente do Conselho Municipal de Maputo (EN: H.E. Rasaque Manhique — Mayor of Maputo).
- "Fotografia oficial e encerramento da sessão" passa a 11:10–11:20.
- "Pequeno-almoço e Networking Executivo" passa a 11:20–12:10.

Dia 1 — Welcome Mixer (Hotel Cardoso): sem alterações.
Dia 2 — Encontros de Negócios: sem alterações.

Dia 2 — 6.ª Gala (Montebelo Indy Village)
- REMOVIDO: 19:25–19:30 "Intervenção de Álvaro Massingue, Presidente da CTA".
- "Intervenção de S. Ex.ª Edmund Bartlett, Ministro do Turismo da Jamaica" passa a 19:25–19:40, só com o responsável "Protocolo". A parte "Apresentação do destino Moçambique / ANDITUR" foi retirada.

Dia 3 — Visita de familiarização: sem alterações.

O QUE FAZER
1. Verifica que data/programa.json é JSON válido e tem estas alterações (36 itens no total). Não edites o conteúdo do programa à mão, a não ser para corrigir algo que não bata com a lista acima.
2. Procura no código tudo o que dependa do programa antigo e ajusta: tipos TypeScript, contagens fixas de itens, IDs hardcoded, textos, oradores ou horários escritos directamente em componentes (ex.: "12:00", "Fredson Bacar" na manhã, "CTA", "Massingue").
3. Confirma que o badge "Ao vivo", o card "A decorrer agora / A seguir" e o selector de sessão das Perguntas usam os horários novos. Testa com ?now=2026-09-24T11:07 (deve mostrar "Discurso de encerramento" ao vivo e a seguir "Fotografia oficial"), ?now=2026-09-24T12:05 (pequeno-almoço ainda ao vivo) e ?now=2026-09-25T19:30 (Edmund Bartlett ao vivo).
4. Se já houver perguntas ou fotos no Supabase ligadas a event_id, não mudes os IDs dos blocos (elevate-breakfast, welcome-mixer, b2b-meetings, gala, fam-trip), porque continuam iguais.
5. `npm run build` e `npx tsc --noEmit` sem erros. Faz commit ("Actualiza programa — versão de 24/09") e deploy na Vercel.
6. No fim, responde-me em poucas linhas: o que alteraste e o link do deploy.
