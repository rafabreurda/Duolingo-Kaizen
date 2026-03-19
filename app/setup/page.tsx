'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import { readFileSync } from 'fs'

// SQL do schema embutido aqui para exibir no browser
const SCHEMA_SQL = `-- ============================================================
-- KAIZEN DOJO — Schema Completo
-- Cole todo este conteúdo no SQL Editor do Supabase
-- e clique em "Run"
-- ============================================================

create extension if not exists "uuid-ossp";

create table if not exists academias (
  id uuid primary key default uuid_generate_v4(),
  nome text not null,
  logo_url text, cor_primaria text, cor_secundaria text, mascote_nome text,
  criado_em timestamptz default now()
);

create table if not exists perfis (
  id uuid primary key references auth.users(id) on delete cascade,
  academia_id uuid references academias(id),
  nome text not null,
  email text not null,
  username text unique,
  telefone text, endereco text, data_nascimento date,
  faixa_atual text not null default 'branca',
  modo_interface text not null default 'adulto' check (modo_interface in ('adulto','infantil')),
  role text not null default 'aluno' check (role in ('aluno','admin_mestre','admin_sensei')),
  kaizens_total integer not null default 0,
  streak_dias integer not null default 0,
  ultimo_acesso date, avatar_url text,
  criado_em timestamptz default now()
);

create index if not exists idx_perfis_username on perfis (username);

create table if not exists username_lookup (
  username text primary key,
  user_id uuid not null references auth.users(id) on delete cascade
);
alter table username_lookup disable row level security;

create table if not exists faixas (
  id uuid primary key default uuid_generate_v4(),
  academia_id uuid references academias(id),
  nome text not null, cor_hex text not null, ordem integer not null,
  descricao text, ativo boolean not null default true,
  criado_em timestamptz default now()
);

create table if not exists estacoes (
  id uuid primary key default uuid_generate_v4(),
  faixa_id uuid not null references faixas(id) on delete cascade,
  titulo text not null, subtitulo text, ordem integer not null,
  e_boss boolean not null default false, icone text not null default '⚔️',
  kaizens_max integer not null default 100, ativo boolean not null default true,
  criado_em timestamptz default now()
);

create table if not exists blocos (
  id uuid primary key default uuid_generate_v4(),
  estacao_id uuid not null references estacoes(id) on delete cascade,
  tipo text not null check (tipo in ('texto','imagem','video_sensei','multipla_escolha','video_aluno')),
  ordem integer not null, conteudo_texto text, imagem_url text, video_url text,
  kaizens_valor integer not null default 0, obrigatorio boolean not null default true,
  criado_em timestamptz default now()
);

create table if not exists alternativas (
  id uuid primary key default uuid_generate_v4(),
  bloco_id uuid not null references blocos(id) on delete cascade,
  texto text not null, e_correta boolean not null default false,
  explicacao text, ordem integer not null
);

create table if not exists progresso_estacoes (
  id uuid primary key default uuid_generate_v4(),
  perfil_id uuid not null references perfis(id) on delete cascade,
  estacao_id uuid not null references estacoes(id) on delete cascade,
  status text not null default 'bloqueada' check (status in ('bloqueada','disponivel','em_progresso','concluida')),
  kaizens_ganhos integer not null default 0, tentativas integer not null default 0,
  concluida_em timestamptz, unique (perfil_id, estacao_id)
);

create table if not exists respostas_quiz (
  id uuid primary key default uuid_generate_v4(),
  perfil_id uuid not null references perfis(id) on delete cascade,
  bloco_id uuid not null references blocos(id) on delete cascade,
  alternativa_escolhida_id uuid not null references alternativas(id),
  acertou boolean not null, respondido_em timestamptz default now()
);

create table if not exists videos_aluno (
  id uuid primary key default uuid_generate_v4(),
  perfil_id uuid not null references perfis(id) on delete cascade,
  bloco_id uuid not null references blocos(id) on delete cascade,
  estacao_id uuid not null references estacoes(id),
  video_url text not null, duracao_segundos integer,
  status text not null default 'pendente' check (status in ('pendente','aprovado','reprovado')),
  feedback_admin text, kaizens_concedidos integer not null default 0,
  avaliado_por uuid references perfis(id),
  enviado_em timestamptz default now(), avaliado_em timestamptz
);

create table if not exists kaizens_log (
  id uuid primary key default uuid_generate_v4(),
  perfil_id uuid not null references perfis(id) on delete cascade,
  origem text not null check (origem in ('quiz','video_aprovado','streak','bonus_admin')),
  valor integer not null, descricao text, criado_em timestamptz default now()
);

create table if not exists modulos_desbloqueados (
  id uuid primary key default uuid_generate_v4(),
  perfil_id uuid not null references perfis(id) on delete cascade,
  faixa_id uuid not null references faixas(id) on delete cascade,
  desbloqueado_por uuid references perfis(id),
  desbloqueado_em timestamptz default now(),
  unique (perfil_id, faixa_id)
);

create or replace view ranking_por_faixa as
select id, nome, faixa_atual, kaizens_total, streak_dias, avatar_url,
  rank() over (partition by faixa_atual order by kaizens_total desc) as posicao_faixa,
  rank() over (order by kaizens_total desc) as posicao_geral
from perfis where role = 'aluno';

alter table perfis enable row level security;
alter table progresso_estacoes enable row level security;
alter table respostas_quiz enable row level security;
alter table videos_aluno enable row level security;
alter table kaizens_log enable row level security;
alter table faixas enable row level security;
alter table estacoes enable row level security;
alter table blocos enable row level security;
alter table alternativas enable row level security;

create policy "Aluno acessa proprio perfil" on perfis for select using (auth.uid() = id);
create policy "Admin Sensei acessa todos perfis" on perfis for all using (exists (select 1 from perfis p where p.id = auth.uid() and p.role = 'admin_sensei'));
create policy "Admin Mestre acessa todos perfis" on perfis for all using (exists (select 1 from perfis p where p.id = auth.uid() and p.role = 'admin_mestre'));
create policy "Aluno acessa proprio progresso" on progresso_estacoes for all using (auth.uid() = perfil_id);
create policy "Admin Sensei acessa todo progresso" on progresso_estacoes for all using (exists (select 1 from perfis p where p.id = auth.uid() and p.role = 'admin_sensei'));
create policy "Aluno acessa proprias respostas" on respostas_quiz for all using (auth.uid() = perfil_id);
create policy "Admin Sensei acessa todas respostas" on respostas_quiz for all using (exists (select 1 from perfis p where p.id = auth.uid() and p.role = 'admin_sensei'));
create policy "Aluno acessa proprios videos" on videos_aluno for all using (auth.uid() = perfil_id);
create policy "Admin Sensei gerencia videos" on videos_aluno for all using (exists (select 1 from perfis p where p.id = auth.uid() and p.role = 'admin_sensei'));
create policy "Aluno acessa proprio log" on kaizens_log for all using (auth.uid() = perfil_id);
create policy "Admin Sensei acessa todo log" on kaizens_log for all using (exists (select 1 from perfis p where p.id = auth.uid() and p.role = 'admin_sensei'));
create policy "Autenticados leem faixas" on faixas for select using (auth.uid() is not null);
create policy "Admin Sensei gerencia faixas" on faixas for all using (exists (select 1 from perfis p where p.id = auth.uid() and p.role = 'admin_sensei'));
create policy "Autenticados leem estacoes" on estacoes for select using (auth.uid() is not null);
create policy "Admin Sensei gerencia estacoes" on estacoes for all using (exists (select 1 from perfis p where p.id = auth.uid() and p.role = 'admin_sensei'));
create policy "Autenticados leem blocos" on blocos for select using (auth.uid() is not null);
create policy "Admin Sensei gerencia blocos" on blocos for all using (exists (select 1 from perfis p where p.id = auth.uid() and p.role = 'admin_sensei'));
create policy "Autenticados leem alternativas" on alternativas for select using (auth.uid() is not null);
create policy "Admin Sensei gerencia alternativas" on alternativas for all using (exists (select 1 from perfis p where p.id = auth.uid() and p.role = 'admin_sensei'));

create or replace function public.handle_new_user()
returns trigger as $$
declare v_username text;
begin
  v_username := lower(trim(coalesce(new.raw_user_meta_data->>'username', '')));
  insert into public.perfis (id, nome, email, username, role)
  values (new.id, coalesce(new.raw_user_meta_data->>'nome','Usuário'), new.email, nullif(v_username,''), coalesce(new.raw_user_meta_data->>'role','aluno'));
  if v_username <> '' then
    insert into public.username_lookup (username, user_id) values (v_username, new.id) on conflict (username) do nothing;
  end if;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();

insert into faixas (nome, cor_hex, ordem, descricao) values
  ('branca','#e8e8e8',1,'Faixa inicial — fundamentos do karatê'),
  ('amarela','#f5c842',2,'Primeiros passos — técnicas básicas'),
  ('laranja','#f5832a',3,'Desenvolvimento — posições e golpes'),
  ('bordo','#8B1A1A',4,'Progressão — combinações e katas'),
  ('azul','#1a5fa8',5,'Intermediário — técnicas avançadas'),
  ('verde','#2e8b3a',6,'Avançado — direções e variações'),
  ('roxa','#6b3fa0',7,'Especialização — Waza e Kata'),
  ('marrom','#7B4F2E',8,'Pré-Dan — em definição com o Sensei'),
  ('preta','#1a1a1a',9,'Dan — em definição com o Sensei')
on conflict do nothing;`

type Status = 'idle' | 'loading' | 'done' | 'error'

export default function SetupPage() {
  const [sqlCopied, setSqlCopied] = useState(false)
  const [adminStatus, setAdminStatus] = useState<Status>('idle')
  const [adminResultados, setAdminResultados] = useState<{nome: string; status: string}[]>([])
  const [adminErro, setAdminErro] = useState('')

  async function copiarSQL() {
    await navigator.clipboard.writeText(SCHEMA_SQL)
    setSqlCopied(true)
    setTimeout(() => setSqlCopied(false), 2000)
  }

  async function criarAdmins() {
    setAdminStatus('loading')
    setAdminErro('')
    try {
      const res = await fetch('/api/setup', { method: 'POST' })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Erro desconhecido')
      setAdminResultados(json.resultados ?? [])
      setAdminStatus('done')
    } catch (e: unknown) {
      setAdminErro(e instanceof Error ? e.message : 'Erro')
      setAdminStatus('error')
    }
  }

  return (
    <main className="min-h-screen bg-[#1a1a2e] text-white px-6 py-12">
      <div className="max-w-2xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold">⚙️ Setup — Kaizen Dojo</h1>
          <p className="text-white/50 mt-2">Configure o banco de dados em 2 passos</p>
        </div>

        {/* ── PASSO 1: Schema ──────────────────────────────── */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
          <div className="flex items-start gap-3">
            <span className="bg-[#e94560] text-white text-xs font-bold px-2 py-1 rounded-full mt-0.5">1</span>
            <div>
              <h2 className="font-semibold text-lg">Criar tabelas no Supabase</h2>
              <p className="text-white/50 text-sm mt-1">
                Copie o SQL abaixo e cole no{' '}
                <strong className="text-white">SQL Editor</strong> do Supabase Dashboard,
                depois clique em <strong className="text-white">Run</strong>.
              </p>
            </div>
          </div>

          <div className="bg-black/30 rounded-xl p-4 max-h-48 overflow-auto">
            <pre className="text-green-400 text-xs font-mono whitespace-pre-wrap">
              {SCHEMA_SQL.slice(0, 300)}...
            </pre>
          </div>

          <button
            onClick={copiarSQL}
            className="w-full bg-[#e94560] hover:bg-[#c73550] text-white font-semibold py-3 rounded-xl transition-colors"
          >
            {sqlCopied ? '✓ SQL Copiado!' : '📋 Copiar SQL Completo'}
          </button>

          <p className="text-white/30 text-xs text-center">
            Supabase → SQL Editor → Cole → Run
          </p>
        </div>

        {/* ── PASSO 2: Admins ─────────────────────────────── */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
          <div className="flex items-start gap-3">
            <span className="bg-[#f5a623] text-black text-xs font-bold px-2 py-1 rounded-full mt-0.5">2</span>
            <div>
              <h2 className="font-semibold text-lg">Criar contas de administrador</h2>
              <p className="text-white/50 text-sm mt-1">
                Clique para criar as contas dos admins automaticamente.
                <br />Faça isso <strong className="text-white">após</strong> executar o SQL do passo 1.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {[
              { titulo: 'Admin Mestre', login: 'NeuroFlux', senha: '607652', cor: 'border-yellow-500/30 bg-yellow-500/5' },
              { titulo: 'Admin Sensei', login: 'Rogerio',   senha: 'Kaizen',  cor: 'border-red-500/30 bg-red-500/5' },
            ].map((a) => (
              <div key={a.login} className={`border rounded-xl p-3 ${a.cor}`}>
                <p className="font-semibold text-sm">{a.titulo}</p>
                <p className="text-white/50 text-xs mt-1">Login: <span className="text-white font-mono">{a.login}</span></p>
                <p className="text-white/50 text-xs">Senha: <span className="text-white font-mono">{a.senha}</span></p>
              </div>
            ))}
          </div>

          {adminStatus === 'done' && (
            <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 space-y-1">
              {adminResultados.map((r) => (
                <p key={r.nome} className="text-green-400 text-sm">
                  ✓ {r.nome} — {r.status}
                </p>
              ))}
            </div>
          )}

          {adminStatus === 'error' && (
            <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/30 rounded-xl p-4">
              ✗ {adminErro}
              <br /><span className="text-red-300/60 text-xs">Certifique-se de ter executado o SQL do Passo 1 primeiro.</span>
            </p>
          )}

          <button
            onClick={criarAdmins}
            disabled={adminStatus === 'loading' || adminStatus === 'done'}
            className="w-full bg-[#f5a623] hover:bg-[#e09520] disabled:opacity-50 text-black font-semibold py-3 rounded-xl transition-colors"
          >
            {adminStatus === 'loading' ? 'Criando...' :
             adminStatus === 'done'    ? '✓ Admins Criados!' :
             '🥋 Criar Admins'}
          </button>
        </div>

        {/* Próximos passos */}
        {adminStatus === 'done' && (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <h3 className="font-semibold mb-3">✅ Setup concluído! Próximos passos:</h3>
            <div className="space-y-2 text-sm text-white/70">
              <p>→ <a href="/login" className="text-[#f5a623] hover:underline">Ir para o Login</a></p>
              <p>→ Entre como <strong className="text-white">NeuroFlux</strong> (senha: 607652) para gerenciar usuários</p>
              <p>→ Entre como <strong className="text-white">Rogerio</strong> (senha: Kaizen) para acessar o painel Sensei</p>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
