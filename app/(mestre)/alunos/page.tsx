import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import MestreAlunosClient from './MestreAlunosClient'

export default async function MestreAlunosPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: perfil } = await supabase
    .from('perfis')
    .select('role')
    .eq('id', user.id)
    .single()

  if (perfil?.role !== 'admin_mestre') redirect('/login')

  const { data: alunos } = await supabase
    .from('perfis')
    .select('id, nome, email, username, role, faixa_atual, criado_em')
    .order('criado_em', { ascending: false })

  return <MestreAlunosClient alunos={alunos ?? []} />
}
