import { createClient as createAdmin } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { normalizarUsername, usernameParaEmail } from '@/lib/username'

export async function POST(request: Request) {
  const supabase = await createClient()

  // Só admin_mestre ou admin_sensei pode criar
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const { data: perfil } = await supabase
    .from('perfis')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!perfil || !['admin_mestre', 'admin_sensei'].includes(perfil.role)) {
    return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
  }

  const { nome, username, senha, role } = await request.json()

  if (!nome || !username || !senha || !role) {
    return NextResponse.json({ error: 'Campos obrigatórios: nome, username, senha, role' }, { status: 400 })
  }

  if (!['admin_mestre', 'admin_sensei'].includes(role)) {
    return NextResponse.json({ error: 'Role inválido para admin' }, { status: 400 })
  }

  // Normaliza (case-insensitive) — usa mesma função do login
  const usernameLower = normalizarUsername(username)
  const senhaLower = senha.trim().toLowerCase()
  const emailInterno = usernameParaEmail(usernameLower)

  // Verifica se username já existe
  const { data: existing } = await supabase
    .from('username_lookup')
    .select('username')
    .eq('username', usernameLower)
    .single()

  if (existing) {
    return NextResponse.json({ error: 'Username já está em uso' }, { status: 409 })
  }

  // Cria usuário no Supabase Auth com service role
  const adminSupabase = createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  const { data: newUser, error: createError } = await adminSupabase.auth.admin.createUser({
    email: emailInterno,
    password: senhaLower,
    email_confirm: true,
    user_metadata: {
      nome: nome.trim(),
      username: usernameLower,
      role,
    },
  })

  if (createError || !newUser.user) {
    return NextResponse.json(
      { error: createError?.message ?? 'Erro ao criar usuário' },
      { status: 500 }
    )
  }

  // Garante role, nome e username corretos (trigger pode ter usado defaults)
  await adminSupabase
    .from('perfis')
    .update({ role, nome: nome.trim(), username: usernameLower })
    .eq('id', newUser.user.id)

  // Garante entrada no lookup
  await adminSupabase
    .from('username_lookup')
    .upsert({ username: usernameLower, user_id: newUser.user.id })

  return NextResponse.json({ ok: true, id: newUser.user.id })
}
