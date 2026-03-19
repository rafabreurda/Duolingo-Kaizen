'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const FAIXAS = [
  { valor: 'branca',  label: 'Branca' },
  { valor: 'amarela', label: 'Amarela' },
  { valor: 'laranja', label: 'Laranja' },
  { valor: 'bordo',   label: 'Bordô' },
  { valor: 'azul',    label: 'Azul' },
  { valor: 'verde',   label: 'Verde' },
  { valor: 'roxa',    label: 'Roxa' },
  { valor: 'marrom',  label: 'Marrom' },
  { valor: 'preta',   label: 'Preta' },
]

export default function CadastroPage() {
  const router = useRouter()
  const supabase = createClient()

  const [nome, setNome] = useState('')
  const [senha, setSenha] = useState('')
  const [faixa, setFaixa] = useState('branca')
  const [erro, setErro] = useState('')
  const [carregando, setCarregando] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErro('')

    if (nome.trim().length < 2) {
      setErro('Digite seu nome completo.')
      return
    }
    if (senha.trim().length < 4) {
      setErro('Senha deve ter pelo menos 4 caracteres.')
      return
    }

    setCarregando(true)

    // Cria a conta via API (usa service role para criar sem email)
    const res = await fetch('/api/auth/registro', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome: nome.trim(), senha, faixa_atual: faixa }),
    })

    const json = await res.json()

    if (!res.ok) {
      setErro(json.error ?? 'Erro ao criar conta.')
      setCarregando(false)
      return
    }

    // Faz login automaticamente após cadastro
    const { error: loginError } = await supabase.auth.signInWithPassword({
      email: `${json.username}@dojo.local`,
      password: senha.trim().toLowerCase(),
    })

    if (loginError) {
      setErro('Conta criada! Faça login com seu nome e senha.')
      setCarregando(false)
      router.push('/login')
      return
    }

    router.push('/dashboard')
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#1a1a2e] px-4 py-12">
      <div className="w-full max-w-sm bg-white/5 border border-white/10 rounded-2xl p-8 space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white">⚔️ Criar Conta</h1>
          <p className="text-white/50 mt-1 text-sm">Preencha seus dados para começar</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nome */}
          <div>
            <label className="text-white/70 text-sm mb-1 block">Nome completo</label>
            <input
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              required
              placeholder="Ex: João Silva"
              className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2.5 text-white placeholder-white/30 focus:outline-none focus:border-[#e94560]"
            />
          </div>

          {/* Senha */}
          <div>
            <label className="text-white/70 text-sm mb-1 block">Senha</label>
            <input
              type="password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              required
              placeholder="Mínimo 4 caracteres"
              className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2.5 text-white placeholder-white/30 focus:outline-none focus:border-[#e94560]"
            />
            <p className="text-white/30 text-xs mt-1">Maiúscula e minúscula são iguais no login</p>
          </div>

          {/* Faixa */}
          <div>
            <label className="text-white/70 text-sm mb-1 block">Faixa atual</label>
            <select
              value={faixa}
              onChange={(e) => setFaixa(e.target.value)}
              className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-[#e94560]"
            >
              {FAIXAS.map((f) => (
                <option key={f.valor} value={f.valor} className="bg-[#1a1a2e]">
                  {f.label}
                </option>
              ))}
            </select>
          </div>

          {erro && <p className="text-[#f44336] text-sm">{erro}</p>}

          <button
            type="submit"
            disabled={carregando}
            className="w-full bg-[#e94560] hover:bg-[#c73550] text-white font-semibold py-2.5 rounded-lg transition-colors disabled:opacity-50"
          >
            {carregando ? 'Criando conta...' : 'Criar conta'}
          </button>
        </form>

        <p className="text-center text-white/40 text-sm">
          Já tem conta?{' '}
          <a href="/login" className="text-[#f5a623] hover:underline">
            Entrar
          </a>
        </p>
      </div>
    </main>
  )
}
