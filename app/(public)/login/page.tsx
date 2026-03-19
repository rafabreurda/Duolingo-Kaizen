'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { normalizarUsername, usernameParaEmail } from '@/lib/username'
import type { Role } from '@/lib/types'

// Login por nome + senha — sem email
// Funciona para alunos, Admin Mestre e Admin Sensei
// Tudo case-insensitive: "Rogerio", "ROGERIO", "rogerio" → mesmo login
export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()

  const [nome, setNome] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')
  const [carregando, setCarregando] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setErro('')
    setCarregando(true)

    // Normaliza: "João Silva" → "joaosilva", "NeuroFlux" → "neuroflux"
    const username = normalizarUsername(nome)
    const senhaNorm = senha.trim().toLowerCase()

    if (!username) {
      setErro('Digite seu nome.')
      setCarregando(false)
      return
    }

    // Busca o username no lookup (tabela sem RLS, acessível anonimamente)
    const { data: lookup } = await supabase
      .from('username_lookup')
      .select('user_id')
      .eq('username', username)
      .single()

    if (!lookup) {
      setErro('Nome não encontrado. Verifique ou cadastre-se.')
      setCarregando(false)
      return
    }

    const email = usernameParaEmail(username)

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password: senhaNorm,
    })

    if (error || !data.user) {
      setErro('Senha incorreta.')
      setCarregando(false)
      return
    }

    const { data: perfil } = await supabase
      .from('perfis')
      .select('role')
      .eq('id', data.user.id)
      .single()

    const role = (perfil?.role as Role) ?? 'aluno'

    if (role === 'admin_sensei') router.push('/admin/dashboard')
    else if (role === 'admin_mestre') router.push('/mestre/alunos')
    else router.push('/dashboard')
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#1a1a2e] px-4">
      <div className="w-full max-w-sm bg-white/5 border border-white/10 rounded-2xl p-8 space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white">⚔️ Kaizen Dojo</h1>
          <p className="text-white/50 mt-1 text-sm">Entre na sua conta</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="text-white/70 text-sm mb-1 block">Nome</label>
            <input
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              required
              autoComplete="username"
              spellCheck={false}
              className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2.5 text-white placeholder-white/30 focus:outline-none focus:border-[#e94560]"
              placeholder="Seu nome ou usuário"
            />
          </div>

          <div>
            <label className="text-white/70 text-sm mb-1 block">Senha</label>
            <input
              type="password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              required
              autoComplete="current-password"
              className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2.5 text-white placeholder-white/30 focus:outline-none focus:border-[#e94560]"
              placeholder="••••••••"
            />
          </div>

          {erro && <p className="text-[#f44336] text-sm">{erro}</p>}

          <button
            type="submit"
            disabled={carregando}
            className="w-full bg-[#e94560] hover:bg-[#c73550] text-white font-semibold py-2.5 rounded-lg transition-colors disabled:opacity-50"
          >
            {carregando ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <p className="text-center text-white/40 text-sm">
          Novo aluno?{' '}
          <a href="/cadastro" className="text-[#f5a623] hover:underline">
            Cadastre-se
          </a>
        </p>
      </div>
    </main>
  )
}
