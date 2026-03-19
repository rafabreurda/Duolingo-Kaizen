import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// Esta rota usa a service role key para resetar senhas
// Só pode ser chamada por um admin_mestre autenticado

export async function POST(request: Request) {
  const supabase = await createServerClient()

  // Verifica se o chamador é admin_mestre
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  }

  const { data: perfil } = await supabase
    .from('perfis')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!perfil || !['admin_mestre', 'admin_sensei'].includes(perfil.role)) {
    return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
  }

  const { userId, novaSenha } = await request.json()

  if (!userId || !novaSenha || novaSenha.trim().length < 4) {
    return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 })
  }

  // Senha sempre normalizada para minúsculo (sistema case-insensitive)
  const senhaNorm = novaSenha.trim().toLowerCase()

  const adminSupabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  const { error } = await adminSupabase.auth.admin.updateUserById(userId, {
    password: senhaNorm,
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
