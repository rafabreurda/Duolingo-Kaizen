import { createClient as createAdmin } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { normalizarUsername, usernameParaEmail } from '@/lib/username'

export async function POST(request: Request) {
  const { nome, senha, faixa_atual, telefone, endereco, data_nascimento } =
    await request.json()

  if (!nome || !senha) {
    return NextResponse.json({ error: 'Nome e senha são obrigatórios' }, { status: 400 })
  }

  const senhaLower = senha.trim().toLowerCase()
  const baseUsername = normalizarUsername(nome)

  if (!baseUsername) {
    return NextResponse.json({ error: 'Nome inválido' }, { status: 400 })
  }

  const adminSupabase = createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  // Verifica duplicata de username e incrementa se necessário
  let username = baseUsername
  let tentativa = 1
  while (true) {
    const { data: existe } = await adminSupabase
      .from('username_lookup')
      .select('username')
      .eq('username', username)
      .single()

    if (!existe) break
    tentativa++
    username = `${baseUsername}${tentativa}`
  }

  const emailInterno = usernameParaEmail(username)

  const { data: newUser, error: createError } = await adminSupabase.auth.admin.createUser({
    email: emailInterno,
    password: senhaLower,
    email_confirm: true,
    user_metadata: {
      nome: nome.trim(),
      username,
      role: 'aluno',
    },
  })

  if (createError || !newUser.user) {
    return NextResponse.json(
      { error: createError?.message ?? 'Erro ao criar conta' },
      { status: 500 }
    )
  }

  // Garante que perfil e lookup estão corretos
  await adminSupabase
    .from('perfis')
    .update({
      role: 'aluno',
      nome: nome.trim(),
      username,
      faixa_atual: faixa_atual ?? 'branca',
      telefone: telefone ?? null,
      endereco: endereco ?? null,
      data_nascimento: data_nascimento ?? null,
    })
    .eq('id', newUser.user.id)

  await adminSupabase
    .from('username_lookup')
    .upsert({ username, user_id: newUser.user.id })

  return NextResponse.json({ ok: true, username })
}
