'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Role } from '@/lib/types'

const ROLE_LABEL: Record<Role, string> = {
  aluno: 'Aluno',
  admin_mestre: 'Admin Mestre',
  admin_sensei: 'Admin Sensei',
}

const ROLE_COLOR: Record<Role, string> = {
  aluno: 'bg-blue-500/20 text-blue-300',
  admin_mestre: 'bg-yellow-500/20 text-yellow-300',
  admin_sensei: 'bg-red-500/20 text-red-300',
}

interface Perfil {
  id: string
  nome: string
  email: string
  username: string | null
  role: Role
  faixa_atual: string
  criado_em: string
}

type Modal = 'none' | 'editar' | 'criar'

export default function MestreAlunosClient({ alunos: initial }: { alunos: Perfil[] }) {
  const supabase = createClient()
  const [usuarios, setUsuarios] = useState(initial)
  const [busca, setBusca] = useState('')
  const [modal, setModal] = useState<Modal>('none')
  const [mensagem, setMensagem] = useState('')
  const [carregando, setCarregando] = useState(false)

  const [selectedUser, setSelectedUser] = useState<Perfil | null>(null)
  const [novoRole, setNovoRole] = useState<Role>('aluno')
  const [novaSenha, setNovaSenha] = useState('')

  const [criarNome, setCriarNome] = useState('')
  const [criarUsername, setCriarUsername] = useState('')
  const [criarSenha, setCriarSenha] = useState('')
  const [criarRole, setCriarRole] = useState<'admin_mestre' | 'admin_sensei'>('admin_sensei')

  const filtrados = usuarios.filter(
    (u) =>
      u.nome.toLowerCase().includes(busca.toLowerCase()) ||
      (u.username ?? '').toLowerCase().includes(busca.toLowerCase())
  )

  function abrirEditar(user: Perfil) {
    setSelectedUser(user)
    setNovoRole(user.role)
    setNovaSenha('')
    setMensagem('')
    setModal('editar')
  }

  function abrirCriar() {
    setCriarNome(''); setCriarUsername(''); setCriarSenha('')
    setCriarRole('admin_sensei'); setMensagem(''); setModal('criar')
  }

  function fecharModal() { setModal('none'); setMensagem('') }

  async function salvarAlteracoes() {
    if (!selectedUser) return
    setMensagem(''); setCarregando(true)
    const { error } = await supabase.from('perfis').update({ role: novoRole }).eq('id', selectedUser.id)
    if (error) { setMensagem('Erro ao atualizar função.'); setCarregando(false); return }
    if (novaSenha.trim().length >= 4) {
      const res = await fetch('/api/mestre/reset-senha', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: selectedUser.id, novaSenha }),
      })
      if (!res.ok) { const j = await res.json(); setMensagem('Erro: ' + j.error); setCarregando(false); return }
    }
    setUsuarios((prev) => prev.map((u) => u.id === selectedUser.id ? { ...u, role: novoRole } : u))
    setMensagem('✓ Salvo!'); setCarregando(false)
    setTimeout(fecharModal, 900)
  }

  async function criarAdmin() {
    if (!criarNome || !criarUsername || !criarSenha) { setMensagem('Preencha tudo.'); return }
    setMensagem(''); setCarregando(true)
    const res = await fetch('/api/mestre/criar-admin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome: criarNome, username: criarUsername, senha: criarSenha, role: criarRole }),
    })
    const json = await res.json()
    if (!res.ok) { setMensagem('Erro: ' + json.error); setCarregando(false); return }
    setUsuarios((prev) => [{
      id: json.id, nome: criarNome,
      email: `${criarUsername.toLowerCase()}@dojo.local`,
      username: criarUsername.toLowerCase(),
      role: criarRole, faixa_atual: 'branca', criado_em: new Date().toISOString(),
    }, ...prev])
    setMensagem('✓ Admin criado!'); setCarregando(false)
    setTimeout(fecharModal, 900)
  }

  async function logout() { await supabase.auth.signOut(); window.location.href = '/login' }

  return (
    <div className="screen-height bg-[#1a1a2e] text-white flex flex-col">
      {/* Header */}
      <header className="bg-[#16213e] border-b border-white/10 px-4 md:px-6 py-4 flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-lg md:text-xl font-bold">⚔️ Kaizen Dojo</h1>
          <p className="text-xs text-yellow-400">Painel Admin Mestre</p>
        </div>
        <button onClick={logout} className="text-white/50 hover:text-white text-sm transition-colors">Sair</button>
      </header>

      <main className="flex-1 overflow-y-auto px-4 md:px-6 py-6 pb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg md:text-2xl font-bold">Usuários</h2>
          <div className="flex items-center gap-3">
            <span className="text-white/40 text-xs">{usuarios.length}</span>
            <button onClick={abrirCriar}
              className="bg-yellow-500 hover:bg-yellow-400 text-black font-semibold px-3 py-1.5 rounded-lg text-sm transition-colors">
              + Admin
            </button>
          </div>
        </div>

        <input type="text" value={busca} onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar por nome ou username..."
          className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-white/30 mb-4 focus:outline-none focus:border-yellow-400 text-base" />

        {/* Desktop: tabela | Mobile: cards */}
        <div className="hidden md:block bg-white/5 rounded-xl border border-white/10 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-white/5 border-b border-white/10">
              <tr className="text-white/50 text-left">
                <th className="px-4 py-3">Nome</th>
                <th className="px-4 py-3">Username</th>
                <th className="px-4 py-3">Função</th>
                <th className="px-4 py-3">Faixa</th>
                <th className="px-4 py-3">Ação</th>
              </tr>
            </thead>
            <tbody>
              {filtrados.map((u, i) => (
                <tr key={u.id}
                  className={`border-b border-white/5 hover:bg-white/5 transition-colors ${i % 2 ? 'bg-white/[0.02]' : ''}`}>
                  <td className="px-4 py-3 font-medium">{u.nome}</td>
                  <td className="px-4 py-3 font-mono text-yellow-300 text-xs">
                    {u.username ? `@${u.username}` : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs ${ROLE_COLOR[u.role]}`}>{ROLE_LABEL[u.role]}</span>
                  </td>
                  <td className="px-4 py-3 capitalize text-white/60">{u.faixa_atual}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => abrirEditar(u)} className="text-yellow-400 hover:text-yellow-300 text-xs underline">Editar</button>
                  </td>
                </tr>
              ))}
              {filtrados.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-white/30">Nenhum encontrado</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile: cards */}
        <div className="md:hidden space-y-3">
          {filtrados.map((u) => (
            <div key={u.id} className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-lg shrink-0">
                {u.nome.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{u.nome}</p>
                {u.username && <p className="text-yellow-300 text-xs font-mono">@{u.username}</p>}
                <span className={`px-2 py-0.5 rounded-full text-xs mt-1 inline-block ${ROLE_COLOR[u.role]}`}>
                  {ROLE_LABEL[u.role]}
                </span>
              </div>
              <button onClick={() => abrirEditar(u)}
                className="text-yellow-400 text-sm shrink-0 px-3 py-1.5 bg-yellow-500/10 rounded-lg">
                Editar
              </button>
            </div>
          ))}
          {filtrados.length === 0 && (
            <p className="text-center text-white/30 py-8">Nenhum encontrado</p>
          )}
        </div>
      </main>

      {/* ── Modal Editar ──────────────────────────────────── */}
      {modal === 'editar' && selectedUser && (
        <div className="fixed inset-0 bg-black/70 flex items-end sm:items-center justify-center z-50 px-4 pb-0 sm:pb-4">
          <div className="bg-[#16213e] border border-white/10 rounded-t-2xl sm:rounded-2xl p-6 w-full sm:max-w-md space-y-4 safe-bottom">
            <h3 className="text-lg font-bold">Editar: {selectedUser.nome}</h3>
            {selectedUser.username && <p className="text-yellow-400 text-sm font-mono">@{selectedUser.username}</p>}
            <div>
              <label className="text-white/70 text-sm mb-1 block">Função</label>
              <select value={novoRole} onChange={(e) => setNovoRole(e.target.value as Role)}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-3 text-white focus:outline-none focus:border-yellow-400 text-base">
                <option value="aluno">Aluno</option>
                <option value="admin_mestre">Admin Mestre</option>
                <option value="admin_sensei">Admin Sensei</option>
              </select>
            </div>
            <div>
              <label className="text-white/70 text-sm mb-1 block">
                Nova Senha <span className="text-white/30 text-xs">(vazio = manter)</span>
              </label>
              <input type="text" value={novaSenha} onChange={(e) => setNovaSenha(e.target.value)}
                placeholder="Nova senha"
                className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-3 text-white placeholder-white/30 focus:outline-none focus:border-yellow-400 text-base" />
            </div>
            {mensagem && <p className={`text-sm ${mensagem.startsWith('✓') ? 'text-green-400' : 'text-red-400'}`}>{mensagem}</p>}
            <div className="flex gap-3">
              <button onClick={fecharModal} className="flex-1 border border-white/20 text-white/70 py-3 rounded-xl hover:bg-white/5">Cancelar</button>
              <button onClick={salvarAlteracoes} disabled={carregando}
                className="flex-1 bg-yellow-500 hover:bg-yellow-400 text-black font-semibold py-3 rounded-xl disabled:opacity-50">
                {carregando ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal Criar ───────────────────────────────────── */}
      {modal === 'criar' && (
        <div className="fixed inset-0 bg-black/70 flex items-end sm:items-center justify-center z-50 px-4 pb-0 sm:pb-4">
          <div className="bg-[#16213e] border border-white/10 rounded-t-2xl sm:rounded-2xl p-6 w-full sm:max-w-md space-y-4 safe-bottom">
            <div>
              <h3 className="text-lg font-bold">Novo Admin</h3>
              <p className="text-white/40 text-xs mt-1">Username e senha são case-insensitive</p>
            </div>
            {[
              { label: 'Nome completo', val: criarNome,     set: setCriarNome,     ph: 'Ex: Rogério Silva' },
              { label: 'Username',      val: criarUsername, set: setCriarUsername, ph: 'Ex: Rogerio' },
              { label: 'Senha',         val: criarSenha,    set: setCriarSenha,    ph: 'Ex: Kaizen' },
            ].map((f) => (
              <div key={f.label}>
                <label className="text-white/70 text-sm mb-1 block">{f.label}</label>
                <input type="text" value={f.val} onChange={(e) => f.set(e.target.value)}
                  placeholder={f.ph} spellCheck={false}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-3 text-white placeholder-white/30 focus:outline-none focus:border-yellow-400 text-base" />
              </div>
            ))}
            <div>
              <label className="text-white/70 text-sm mb-2 block">Tipo de acesso</label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { v: 'admin_sensei', t: 'Admin Sensei', s: 'Acesso total',    c: criarRole === 'admin_sensei' ? 'border-red-500 bg-red-500/10 text-red-300' : 'border-white/10 text-white/50' },
                  { v: 'admin_mestre', t: 'Admin Mestre', s: 'Só usuários',    c: criarRole === 'admin_mestre' ? 'border-yellow-500 bg-yellow-500/10 text-yellow-300' : 'border-white/10 text-white/50' },
                ].map((opt) => (
                  <button key={opt.v} type="button" onClick={() => setCriarRole(opt.v as typeof criarRole)}
                    className={`p-3 rounded-xl border text-sm text-left transition-colors ${opt.c}`}>
                    <p className="font-semibold">{opt.t}</p>
                    <p className="text-xs mt-0.5 opacity-70">{opt.s}</p>
                  </button>
                ))}
              </div>
            </div>
            {mensagem && <p className={`text-sm ${mensagem.startsWith('✓') ? 'text-green-400' : 'text-red-400'}`}>{mensagem}</p>}
            <div className="flex gap-3">
              <button onClick={fecharModal} className="flex-1 border border-white/20 text-white/70 py-3 rounded-xl hover:bg-white/5">Cancelar</button>
              <button onClick={criarAdmin} disabled={carregando}
                className="flex-1 bg-yellow-500 hover:bg-yellow-400 text-black font-semibold py-3 rounded-xl disabled:opacity-50">
                {carregando ? 'Criando...' : 'Criar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
