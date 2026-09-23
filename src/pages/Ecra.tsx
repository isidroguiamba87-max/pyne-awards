import { useSearchParams } from 'react-router-dom'
import { QRSvg } from '../components/PyneQR'
import { useI18n } from '../i18n'
import { eventById } from '../lib/programa'
import { useQuestions } from '../lib/questions'
import { SITE_URL, supabase } from '../lib/supabase'
import { maputoTime, useNow } from '../lib/time'
import { IconThumb } from '../components/Icons'

/** Modo projector: /ecra  (opcional: ?sessao=gala&lang=en) */
export default function Ecra() {
  const { t, L } = useI18n()
  const [params] = useSearchParams()
  const session = params.get('sessao')
  const { items } = useQuestions(['approved'], 'questions-screen')
  const t0 = useNow(15_000)

  const list = session ? items.filter((q) => q.event_id === session) : items
  const pinned = list.find((q) => q.pinned)
  const rest = list.filter((q) => q !== pinned).slice(0, 6)
  const ev = eventById(session)

  return (
    <div className="hero-bg flex min-h-dvh flex-col overflow-hidden p-[3vw] text-white">
      <header className="flex items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <img src="/pyne-emblem-gold.png" alt="" className="h-[6vh] w-auto" />
          <div>
            <p className="font-serif text-[2.4vh] font-bold">
              The Pyne Awards <span className="text-gold">Africa</span> 2026
            </p>
            <p className="text-[1.8vh] text-white/70">{ev ? L(ev.title) : t('q.title')}</p>
          </div>
        </div>
        <p className="font-serif text-[3.5vh] font-bold text-gold tabular-nums">{maputoTime(t0)}</p>
      </header>

      <main className="mt-[3vh] flex min-h-0 flex-1 flex-col gap-[2.5vh] pb-[19vh]">
        {!supabase && <p className="text-[3vh] text-white/70">{t('offline')}</p>}

        {pinned ? (
          <section className="animate-pop-in rounded-[2vh] border-2 border-gold bg-gold/10 p-[3vh]" key={pinned.id}>
            <p className="text-[5vh] leading-tight font-semibold break-words">{pinned.body}</p>
            <p className="mt-[1.5vh] text-[2.4vh] text-gold">
              — {pinned.author_name || t('q.anon')}
              {!session && eventById(pinned.event_id) && <span className="text-white/60"> · {L(eventById(pinned.event_id)!.title)}</span>}
            </p>
          </section>
        ) : (
          list.length === 0 && supabase && <p className="m-auto text-center font-serif text-[4vh] text-white/60">{t('screen.empty')}</p>
        )}

        <ul className="grid min-h-0 flex-1 auto-rows-min grid-cols-1 gap-[1.5vh] overflow-hidden lg:grid-cols-2">
          {rest.map((q) => (
            <li key={q.id} className="animate-pop-in flex gap-[1.5vh] rounded-[1.5vh] border border-navy-line bg-navy-soft/70 p-[2vh]">
              <div className="min-w-0 flex-1">
                <p className="line-clamp-3 text-[2.6vh] leading-snug break-words">{q.body}</p>
                <p className="mt-[0.8vh] text-[1.8vh] text-white/55">{q.author_name || t('q.anon')}</p>
              </div>
              <div className="flex shrink-0 flex-col items-center text-[2.2vh] font-bold text-gold tabular-nums">
                <IconThumb className="h-[2.6vh] w-[2.6vh]" />
                {q.votes}
              </div>
            </li>
          ))}
        </ul>
      </main>

      <aside className="fixed right-[2vw] bottom-[2vw] flex items-center gap-3 rounded-[1.5vh] bg-white p-[1.2vh] pr-[2vh] text-navy shadow-2xl">
        <QRSvg value={`${SITE_URL}/perguntas`} size={160} className="h-[14vh] w-[14vh]" />
        <div className="max-w-[18vh]">
          <p className="font-serif text-[2.2vh] leading-tight font-bold">{t('screen.send')}</p>
          <p className="mt-1 text-[1.5vh] break-all text-navy/70">{SITE_URL.replace(/^https?:\/\//, '')}/perguntas</p>
        </div>
      </aside>
    </div>
  )
}
