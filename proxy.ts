import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import type { Role } from '@/lib/types'

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  // Rotas públicas — sem autenticação necessária
  const publicPaths = ['/', '/login', '/cadastro', '/setup']
  if (publicPaths.includes(pathname)) {
    // Se já logado e tentando acessar login/cadastro, redireciona
    if (user && (pathname === '/login' || pathname === '/cadastro')) {
      const role = await getUserRole(supabase, user.id)
      return NextResponse.redirect(new URL(getHomeByRole(role), request.url))
    }
    return supabaseResponse
  }

  // Sem sessão → login
  if (!user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Busca role do perfil
  const role = await getUserRole(supabase, user.id)

  // Proteção de rotas /admin/* → só admin_sensei
  if (pathname.startsWith('/admin')) {
    if (role !== 'admin_sensei') {
      return NextResponse.redirect(new URL(getHomeByRole(role), request.url))
    }
  }

  // Proteção de rotas /mestre/* → só admin_mestre
  if (pathname.startsWith('/mestre')) {
    if (role !== 'admin_mestre') {
      return NextResponse.redirect(new URL(getHomeByRole(role), request.url))
    }
  }

  // Proteção de rotas /dashboard, /faixa, /estacao, /perfil, /ranking, /kaizens → só aluno
  const alunoRoutes = ['/dashboard', '/faixa', '/estacao', '/ranking', '/kaizens']
  if (alunoRoutes.some((r) => pathname.startsWith(r))) {
    if (role !== 'aluno') {
      return NextResponse.redirect(new URL(getHomeByRole(role), request.url))
    }
  }

  return supabaseResponse
}

async function getUserRole(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  userId: string
): Promise<Role> {
  const { data } = await supabase
    .from('perfis')
    .select('role')
    .eq('id', userId)
    .single()

  return (data?.role as Role) ?? 'aluno'
}

function getHomeByRole(role: Role): string {
  switch (role) {
    case 'admin_sensei':
      return '/admin/dashboard'
    case 'admin_mestre':
      return '/mestre/alunos'
    default:
      return '/dashboard'
  }
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
