import { createContext, createElement, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { Lang, Localized } from './lib/programa'
import { getItem, setItem } from './lib/storage'

const pt = {
  // navegação
  'nav.home': 'Início',
  'nav.agenda': 'Agenda',
  'nav.gallery': 'Galeria',
  'nav.questions': 'Perguntas',
  'lang.switch': 'Mudar para inglês',
  'skip': 'Saltar para o conteúdo',

  // início
  'home.edition': '6.ª edição',
  'home.dates': '24 – 26 Setembro 2026',
  'home.city': 'Maputo, Moçambique',
  'home.agenda.sub': 'Programa dos 3 dias',
  'home.gallery.sub': 'Fotos em tempo real',
  'home.questions.sub': 'Envie a sua pergunta',
  'home.partners': 'Parceiros e organização',

  // card agora
  'now.live': 'Ao vivo',
  'now.title': 'A decorrer agora',
  'now.next': 'A seguir',
  'now.startsIn': 'O evento começa em',
  'now.days': 'dias',
  'now.hours': 'horas',
  'now.min': 'min',
  'now.sec': 'seg',
  'now.firstSession': 'Primeira sessão',
  'now.after.title': 'Obrigado!',
  'now.after.text': 'O Pyne Awards Africa 2026 terminou. Reviva os melhores momentos na galeria.',
  'now.after.cta': 'Ver a galeria',
  'now.break': 'Intervalo',
  'now.fullAgenda': 'Ver agenda completa',
  'now.at': 'às',

  // agenda
  'agenda.title': 'Agenda',
  'agenda.venue': 'Local',
  'agenda.time': 'Horário',
  'agenda.dress': 'Traje',
  'agenda.audience': 'Público',
  'agenda.done': 'Terminado',
  'agenda.speakers': 'Oradores',
  'agenda.panel': 'Painel',

  // galeria
  'gallery.title': 'Galeria',
  'gallery.sub': 'Actualizada em tempo real durante o evento.',
  'gallery.all': 'Todos',
  'gallery.day': 'Dia',
  'gallery.empty': 'Ainda não há fotos. Volte daqui a pouco!',
  'gallery.new.one': '1 nova foto',
  'gallery.new.many': '{n} novas fotos',
  'gallery.more': 'Carregar mais',
  'gallery.loading': 'A carregar…',
  'gallery.download': 'Descarregar',
  'gallery.close': 'Fechar',
  'gallery.prev': 'Anterior',
  'gallery.next': 'Seguinte',
  'gallery.photo': 'Foto',

  // perguntas
  'q.title': 'Perguntas',
  'q.sub': 'Envie a sua pergunta aos oradores. A equipa modera e as perguntas aprovadas aparecem aqui ao vivo.',
  'q.name': 'Nome (opcional)',
  'q.name.ph': 'Anónimo',
  'q.session': 'Sessão',
  'q.body': 'A sua pergunta',
  'q.body.ph': 'Escreva aqui…',
  'q.send': 'Enviar pergunta',
  'q.sending': 'A enviar…',
  'q.thanks': 'Obrigado! A sua pergunta será analisada pela equipa.',
  'q.wait': 'Aguarde {s} s antes de enviar outra pergunta.',
  'q.tooShort': 'A pergunta é demasiado curta.',
  'q.error': 'Não foi possível enviar. Tente novamente.',
  'q.list': 'Perguntas aprovadas',
  'q.empty': 'Ainda não há perguntas aprovadas.',
  'q.anon': 'Anónimo',
  'q.vote': 'Apoiar esta pergunta',
  'q.voted': 'Já votou',
  'q.answered': 'Respondida',
  'q.pinned': 'Em destaque',
  'q.allSessions': 'Todas as sessões',

  // ecrã
  'screen.send': 'Envie a sua pergunta',
  'screen.empty': 'As perguntas aprovadas aparecem aqui.',

  // QR
  'qr.title': 'QR Code',
  'qr.caption.site': 'Agenda · Galeria · Perguntas',
  'qr.caption.questions': 'Envie a sua pergunta',
  'qr.target.site': 'Site',
  'qr.target.questions': 'Perguntas',
  'qr.png': 'Descarregar PNG',
  'qr.svg': 'Descarregar SVG',
  'qr.hint': 'Imprima depois de o subdomínio estar activo — o QR aponta para:',

  // comuns
  'offline': 'Esta secção ainda não está ligada ao servidor (Supabase por configurar).',
  'loadError': 'Erro ao carregar. Verifique a ligação.',
  'retry': 'Tentar de novo',
  'cancel': 'Cancelar',
  'confirm': 'Confirmar',
  'notFound': 'Página não encontrada.',
  'backHome': 'Voltar ao início',

  // admin
  'admin.title': 'Área da equipa',
  'admin.email': 'Email',
  'admin.password': 'Palavra-passe',
  'admin.login': 'Entrar',
  'admin.logout': 'Sair',
  'admin.loginError': 'Email ou palavra-passe incorrectos.',
  'admin.tab.photos': 'Fotos',
  'admin.tab.questions': 'Perguntas',
  'admin.upload.title': 'Carregar fotos',
  'admin.upload.day': 'Dia',
  'admin.upload.event': 'Bloco',
  'admin.upload.pick': 'Escolher fotos',
  'admin.upload.drop': 'Toque para escolher várias fotos (ou arraste para aqui)',
  'admin.upload.clear': 'Limpar concluídos',
  'admin.status.queued': 'Em fila',
  'admin.status.compressing': 'A comprimir',
  'admin.status.uploading': 'A enviar',
  'admin.status.done': 'Concluído',
  'admin.status.error': 'Erro',
  'admin.photos.recent': 'Fotos publicadas',
  'admin.photos.hide': 'Esconder',
  'admin.photos.show': 'Mostrar',
  'admin.photos.delete': 'Apagar',
  'admin.photos.hidden': 'Escondida',
  'admin.photos.confirmDelete': 'Apagar esta foto definitivamente?',
  'admin.q.pending': 'Pendentes',
  'admin.q.approved': 'Aprovadas',
  'admin.q.answered': 'Respondidas',
  'admin.q.rejected': 'Rejeitadas',
  'admin.q.approve': 'Aprovar',
  'admin.q.reject': 'Rejeitar',
  'admin.q.answer': 'Marcar respondida',
  'admin.q.pin': 'Fixar',
  'admin.q.unpin': 'Desafixar',
  'admin.q.empty': 'Nada aqui.',
  'admin.q.newPending': '{n} nova(s) pendente(s)',
  'admin.q.votes': 'votos',
  'admin.q.screen': 'Abrir ecrã do projector',
}

type Key = keyof typeof pt

const en: Record<Key, string> = {
  'nav.home': 'Home',
  'nav.agenda': 'Agenda',
  'nav.gallery': 'Gallery',
  'nav.questions': 'Questions',
  'lang.switch': 'Switch to Portuguese',
  'skip': 'Skip to content',

  'home.edition': '6th edition',
  'home.dates': '24 – 26 September 2026',
  'home.city': 'Maputo, Mozambique',
  'home.agenda.sub': '3-day programme',
  'home.gallery.sub': 'Live photos',
  'home.questions.sub': 'Ask your question',
  'home.partners': 'Partners & organisers',

  'now.live': 'Live',
  'now.title': 'Happening now',
  'now.next': 'Up next',
  'now.startsIn': 'The event starts in',
  'now.days': 'days',
  'now.hours': 'hours',
  'now.min': 'min',
  'now.sec': 'sec',
  'now.firstSession': 'First session',
  'now.after.title': 'Thank you!',
  'now.after.text': 'The Pyne Awards Africa 2026 has ended. Relive the best moments in the gallery.',
  'now.after.cta': 'View the gallery',
  'now.break': 'Break',
  'now.fullAgenda': 'See full agenda',
  'now.at': 'at',

  'agenda.title': 'Agenda',
  'agenda.venue': 'Venue',
  'agenda.time': 'Time',
  'agenda.dress': 'Dress code',
  'agenda.audience': 'Audience',
  'agenda.done': 'Finished',
  'agenda.speakers': 'Speakers',
  'agenda.panel': 'Panel',

  'gallery.title': 'Gallery',
  'gallery.sub': 'Updated live throughout the event.',
  'gallery.all': 'All',
  'gallery.day': 'Day',
  'gallery.empty': 'No photos yet. Check back soon!',
  'gallery.new.one': '1 new photo',
  'gallery.new.many': '{n} new photos',
  'gallery.more': 'Load more',
  'gallery.loading': 'Loading…',
  'gallery.download': 'Download',
  'gallery.close': 'Close',
  'gallery.prev': 'Previous',
  'gallery.next': 'Next',
  'gallery.photo': 'Photo',

  'q.title': 'Questions',
  'q.sub': 'Send your question to the speakers. The team moderates and approved questions appear here live.',
  'q.name': 'Name (optional)',
  'q.name.ph': 'Anonymous',
  'q.session': 'Session',
  'q.body': 'Your question',
  'q.body.ph': 'Type here…',
  'q.send': 'Send question',
  'q.sending': 'Sending…',
  'q.thanks': 'Thank you! Your question will be reviewed by the team.',
  'q.wait': 'Please wait {s} s before sending another question.',
  'q.tooShort': 'The question is too short.',
  'q.error': 'Could not send. Please try again.',
  'q.list': 'Approved questions',
  'q.empty': 'No approved questions yet.',
  'q.anon': 'Anonymous',
  'q.vote': 'Support this question',
  'q.voted': 'Already voted',
  'q.answered': 'Answered',
  'q.pinned': 'Featured',
  'q.allSessions': 'All sessions',

  'screen.send': 'Send your question',
  'screen.empty': 'Approved questions will appear here.',

  'qr.title': 'QR Code',
  'qr.caption.site': 'Agenda · Gallery · Questions',
  'qr.caption.questions': 'Send your question',
  'qr.target.site': 'Website',
  'qr.target.questions': 'Questions',
  'qr.png': 'Download PNG',
  'qr.svg': 'Download SVG',
  'qr.hint': 'Print once the subdomain is live — the QR points to:',

  'offline': 'This section is not connected to the server yet (Supabase not configured).',
  'loadError': 'Could not load. Check your connection.',
  'retry': 'Try again',
  'cancel': 'Cancel',
  'confirm': 'Confirm',
  'notFound': 'Page not found.',
  'backHome': 'Back to home',

  'admin.title': 'Team area',
  'admin.email': 'Email',
  'admin.password': 'Password',
  'admin.login': 'Sign in',
  'admin.logout': 'Sign out',
  'admin.loginError': 'Wrong email or password.',
  'admin.tab.photos': 'Photos',
  'admin.tab.questions': 'Questions',
  'admin.upload.title': 'Upload photos',
  'admin.upload.day': 'Day',
  'admin.upload.event': 'Session',
  'admin.upload.pick': 'Choose photos',
  'admin.upload.drop': 'Tap to choose several photos (or drag them here)',
  'admin.upload.clear': 'Clear finished',
  'admin.status.queued': 'Queued',
  'admin.status.compressing': 'Compressing',
  'admin.status.uploading': 'Uploading',
  'admin.status.done': 'Done',
  'admin.status.error': 'Error',
  'admin.photos.recent': 'Published photos',
  'admin.photos.hide': 'Hide',
  'admin.photos.show': 'Show',
  'admin.photos.delete': 'Delete',
  'admin.photos.hidden': 'Hidden',
  'admin.photos.confirmDelete': 'Permanently delete this photo?',
  'admin.q.pending': 'Pending',
  'admin.q.approved': 'Approved',
  'admin.q.answered': 'Answered',
  'admin.q.rejected': 'Rejected',
  'admin.q.approve': 'Approve',
  'admin.q.reject': 'Reject',
  'admin.q.answer': 'Mark answered',
  'admin.q.pin': 'Pin',
  'admin.q.unpin': 'Unpin',
  'admin.q.empty': 'Nothing here.',
  'admin.q.newPending': '{n} new pending',
  'admin.q.votes': 'votes',
  'admin.q.screen': 'Open projector screen',
}

const dict: Record<Lang, Record<Key, string>> = { pt, en }

interface I18n {
  lang: Lang
  setLang: (l: Lang) => void
  t: (key: Key, vars?: Record<string, string | number>) => string
  L: (v: Localized | null | undefined) => string
}

const Ctx = createContext<I18n | null>(null)

function initialLang(): Lang {
  const q = new URLSearchParams(window.location.search).get('lang')
  if (q === 'pt' || q === 'en') return q
  const saved = getItem('pyne.lang')
  return saved === 'en' ? 'en' : 'pt'
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(initialLang)

  const setLang = useCallback((l: Lang) => {
    setLangState(l)
    setItem('pyne.lang', l)
  }, [])

  useEffect(() => {
    document.documentElement.lang = lang
  }, [lang])

  const value = useMemo<I18n>(
    () => ({
      lang,
      setLang,
      t: (key, vars) => {
        let s = dict[lang][key] ?? key
        if (vars) for (const [k, v] of Object.entries(vars)) s = s.replace(`{${k}}`, String(v))
        return s
      },
      L: (v) => (v ? v[lang] || v.pt : ''),
    }),
    [lang, setLang],
  )

  return createElement(Ctx.Provider, { value }, children)
}

export function useI18n() {
  const v = useContext(Ctx)
  if (!v) throw new Error('useI18n fora do I18nProvider')
  return v
}
