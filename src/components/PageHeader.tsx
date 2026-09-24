import type { ReactNode } from 'react'

/** Faixa escura de topo das páginas internas (o conteúdo abaixo é claro) */
export default function PageHeader({ kicker, title, sub, children }: { kicker?: string; title: string; sub?: string; children?: ReactNode }) {
  return (
    <section className="hero-bg relative isolate overflow-hidden text-white">
      <div className="pattern-diamonds absolute inset-0 -z-10 opacity-[0.06] [mask-image:radial-gradient(80%_100%_at_85%_0%,black,transparent)]" aria-hidden />
      <div className="mx-auto flex max-w-5xl flex-wrap items-end justify-between gap-4 px-4 pt-9 pb-8 md:pt-14 md:pb-10">
        <div>
          {kicker && <p className="text-[11px] font-bold tracking-[0.25em] text-gold uppercase md:text-xs">{kicker}</p>}
          <h1 className="mt-2 font-serif text-4xl font-bold md:text-5xl">{title}</h1>
          {sub && <p className="mt-2 max-w-xl text-white/70">{sub}</p>}
        </div>
        {children}
      </div>
      <div className="gold-rule absolute inset-x-0 bottom-0" aria-hidden />
    </section>
  )
}
