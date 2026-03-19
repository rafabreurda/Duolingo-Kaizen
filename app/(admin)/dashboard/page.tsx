import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

const NAV = [
  { label: 'Dashboard',    href: '/admin/dashboard',    icon: '📊' },
  { label: 'Faixas',       href: '/admin/faixas',        icon: '🥋' },
  { label: 'Alunos',       href: '/admin/alunos',        icon: '👥' },
  { label: 'Vídeos',       href: '/admin/videos',        icon: '📹' },
  { label: 'Config',       href: '/admin/configuracoes', icon: '⚙️' },
]

export default async function AdminDashboardPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: perfil } = await supabase
    .from('perfis').select('role, nome').eq('id', user.id).single()
  if (perfil?.role !== 'admin_sensei') redirect('/login')

  const [{ count: totalAlunos }, { count: videosPendentes }, { count: totalEstacoes }] =
    await Promise.all([
      supabase.from('perfis').select('*', { count: 'exact', head: true }).eq('role', 'aluno'),
      supabase.from('videos_aluno').select('*', { count: 'exact', head: true }).eq('status', 'pendente'),
      supabase.from('estacoes').select('*', { count: 'exact', head: true }).eq('ativo', true),
    ])

  const cards = [
    { label: 'Alunos',           valor: totalAlunos    ?? 0, icon: '👥', href: '/admin/alunos', cor: 'from-blue-600 to-blue-800' },
    { label: 'Vídeos Pendentes', valor: videosPendentes ?? 0, icon: '📹', href: '/admin/videos', cor: 'from-red-600 to-red-800' },
    { label: 'Estações Ativas',  valor: totalEstacoes  ?? 0, icon: '⚔️', href: '/admin/faixas', cor: 'from-purple-600 to-purple-800' },
  ]

  return (
    <div className="screen-height bg-[#1a1a2e] text-white flex">

      {/* ── Sidebar — só desktop ─────────────────────────── */}
      <aside className="hidden md:flex fixed left-0 top-0 h-full w-56 bg-[#16213e] border-r border-white/10 flex-col py-6 px-4 z-30">
        <div className="mb-8">
          <h1 className="text-xl font-bold">⚔️ Kaizen Dojo</h1>
          <p className="text-xs text-red-400 mt-0.5">Painel Sensei</p>
        </div>
        <nav className="space-y-1 flex-1">
          {NAV.map((item) => (
            <Link key={item.href} href={item.href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors text-sm">
              <span>{item.icon}</span>{item.label}
            </Link>
          ))}
        </nav>
        <form action="/api/auth/logout" method="POST">
          <button className="w-full text-left px-3 py-2 text-white/40 hover:text-white text-sm transition-colors">
            Sair
          </button>
        </form>
      </aside>

      {/* ── Conteúdo ─────────────────────────────────────── */}
      <main className="flex-1 md:ml-56 px-4 md:px-8 pt-6 pb-24 md:pb-8 overflow-y-auto">
        <div className="mb-6">
          <h2 className="text-xl md:text-2xl font-bold">Bem-vindo, {perfil.nome}</h2>
          <p className="text-white/50 mt-1 text-sm">Visão geral do dojo</p>
        </div>

        {/* Cards stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
          {cards.map((card) => (
            <Link key={card.href} href={card.href}
              className={`bg-gradient-to-br ${card.cor} rounded-xl p-5 flex sm:flex-col items-center sm:items-start gap-4 sm:gap-2 hover:opacity-90 transition-opacity`}>
              <p className="text-3xl">{card.icon}</p>
              <div>
                <p className="text-2xl font-bold leading-none">{card.valor}</p>
                <p className="text-white/70 text-sm mt-1">{card.label}</p>
              </div>
            </Link>
          ))}
        </div>

        {/* Ações rápidas */}
        <div className="bg-white/5 rounded-xl border border-white/10 p-4 md:p-6">
          <h3 className="font-semibold mb-3 text-sm md:text-base">Ações Rápidas</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { href: '/admin/faixas',  icon: '🥋', label: 'Gerenciar Faixas',   sub: 'Estações e blocos' },
              { href: '/admin/videos',  icon: '📹', label: 'Avaliar Vídeos',     sub: 'Aprovar ou reprovar' },
              { href: '/admin/alunos',  icon: '👥', label: 'Ver Alunos',         sub: 'Progresso e Kaizens' },
              { href: '/admin/configuracoes', icon: '⚙️', label: 'Configurações', sub: 'Academia e visual' },
            ].map((a) => (
              <Link key={a.href} href={a.href}
                className="flex items-center gap-3 p-4 bg-white/5 rounded-lg hover:bg-white/10 transition-colors">
                <span className="text-2xl">{a.icon}</span>
                <div>
                  <p className="font-medium text-sm">{a.label}</p>
                  <p className="text-white/40 text-xs">{a.sub}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </main>

      {/* ── Bottom Nav — só mobile ────────────────────────── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[#16213e] border-t border-white/10 flex items-center justify-around safe-bottom z-30">
        {NAV.map((item) => (
          <Link key={item.href} href={item.href}
            className="flex flex-col items-center gap-0.5 py-2 px-3 text-white/50 hover:text-white transition-colors min-w-0">
            <span className="text-xl">{item.icon}</span>
            <span className="text-[10px] truncate">{item.label}</span>
          </Link>
        ))}
      </nav>
    </div>
  )
}
