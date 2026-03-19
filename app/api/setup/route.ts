// API de setup — cria os admins iniciais via service role
// Chamada uma única vez pelo /setup
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const ADMINS = [
  { nome: 'NeuroFlux', username: 'neuroflux', senha: '607652', role: 'admin_mestre' },
  { nome: 'Rogério',   username: 'rogerio',   senha: 'kaizen',  role: 'admin_sensei' },
]

export async function POST() {
  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  const resultados: { nome: string; status: string }[] = []

  for (const a of ADMINS) {
    const email = `${a.username}@dojo.local`

    // Tenta criar — se já existe, atualiza o role
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password: a.senha,
      email_confirm: true,
      user_metadata: { nome: a.nome, username: a.username, role: a.role },
    })

    if (error) {
      if (error.message.includes('already been registered') || error.message.includes('already exists')) {
        // Usuário já existe — garante role correto
        const { data: lookup } = await admin
          .from('username_lookup').select('user_id').eq('username', a.username).single()
        if (lookup) {
          await admin.from('perfis').update({ role: a.role, nome: a.nome, username: a.username }).eq('id', lookup.user_id)
        }
        resultados.push({ nome: a.nome, status: 'já existia — role atualizado' })
      } else {
        resultados.push({ nome: a.nome, status: `erro: ${error.message}` })
      }
      continue
    }

    const uid = data.user.id
    await admin.from('perfis').update({ role: a.role, nome: a.nome, username: a.username }).eq('id', uid)
    await admin.from('username_lookup').upsert({ username: a.username, user_id: uid })
    resultados.push({ nome: a.nome, status: 'criado ✓' })
  }

  return NextResponse.json({ ok: true, resultados })
}
