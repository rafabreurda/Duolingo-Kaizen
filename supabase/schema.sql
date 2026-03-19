-- ============================================================
-- KAIZEN DOJO — Schema Completo v2
-- Executar no Supabase SQL Editor
-- ============================================================

create extension if not exists "uuid-ossp";

-- ─── TABELAS ─────────────────────────────────────────────────

create table if not exists academias (
  id             uuid primary key default uuid_generate_v4(),
  nome           text not null,
  logo_url       text,
  cor_primaria   text,
  cor_secundaria text,
  mascote_nome   text,
  criado_em      timestamptz default now()
);

-- Perfis
-- role: 'aluno' | 'admin_mestre' | 'admin_sensei'
-- username: login de admin (sempre minúsculo). Alunos usam email.
create table if not exists perfis (
  id              uuid primary key references auth.users(id) on delete cascade,
  academia_id     uuid references academias(id),
  nome            text not null,
  email           text not null,
  username        text unique,
  telefone        text,
  endereco        text,
  data_nascimento date,
  faixa_atual     text not null default 'branca',
  modo_interface  text not null default 'adulto'
                    check (modo_interface in ('adulto', 'infantil')),
  role            text not null default 'aluno'
                    check (role in ('aluno', 'admin_mestre', 'admin_sensei')),
  kaizens_total   integer not null default 0,
  streak_dias     integer not null default 0,
  ultimo_acesso   date,
  avatar_url      text,
  criado_em       timestamptz default now()
);

create index if not exists idx_perfis_username on perfis (username);

-- Tabela de lookup de username → user_id (sem RLS para login client-side)
create table if not exists username_lookup (
  username text primary key,
  user_id  uuid not null references auth.users(id) on delete cascade
);

alter table username_lookup disable row level security;

create table if not exists faixas (
  id          uuid primary key default uuid_generate_v4(),
  academia_id uuid references academias(id),
  nome        text not null,
  cor_hex     text not null,
  ordem       integer not null,
  descricao   text,
  ativo       boolean not null default true,
  criado_em   timestamptz default now()
);

create table if not exists estacoes (
  id          uuid primary key default uuid_generate_v4(),
  faixa_id    uuid not null references faixas(id) on delete cascade,
  titulo      text not null,
  subtitulo   text,
  ordem       integer not null,
  e_boss      boolean not null default false,
  icone       text not null default '⚔️',
  kaizens_max integer not null default 100,
  ativo       boolean not null default true,
  criado_em   timestamptz default now()
);

create table if not exists blocos (
  id             uuid primary key default uuid_generate_v4(),
  estacao_id     uuid not null references estacoes(id) on delete cascade,
  tipo           text not null
                   check (tipo in ('texto','imagem','video_sensei','multipla_escolha','video_aluno')),
  ordem          integer not null,
  conteudo_texto text,
  imagem_url     text,
  video_url      text,
  kaizens_valor  integer not null default 0,
  obrigatorio    boolean not null default true,
  criado_em      timestamptz default now()
);

create table if not exists alternativas (
  id         uuid primary key default uuid_generate_v4(),
  bloco_id   uuid not null references blocos(id) on delete cascade,
  texto      text not null,
  e_correta  boolean not null default false,
  explicacao text,
  ordem      integer not null
);

create table if not exists progresso_estacoes (
  id             uuid primary key default uuid_generate_v4(),
  perfil_id      uuid not null references perfis(id) on delete cascade,
  estacao_id     uuid not null references estacoes(id) on delete cascade,
  status         text not null default 'bloqueada'
                   check (status in ('bloqueada','disponivel','em_progresso','concluida')),
  kaizens_ganhos integer not null default 0,
  tentativas     integer not null default 0,
  concluida_em   timestamptz,
  unique (perfil_id, estacao_id)
);

create table if not exists respostas_quiz (
  id                       uuid primary key default uuid_generate_v4(),
  perfil_id                uuid not null references perfis(id) on delete cascade,
  bloco_id                 uuid not null references blocos(id) on delete cascade,
  alternativa_escolhida_id uuid not null references alternativas(id),
  acertou                  boolean not null,
  respondido_em            timestamptz default now()
);

create table if not exists videos_aluno (
  id                 uuid primary key default uuid_generate_v4(),
  perfil_id          uuid not null references perfis(id) on delete cascade,
  bloco_id           uuid not null references blocos(id) on delete cascade,
  estacao_id         uuid not null references estacoes(id),
  video_url          text not null,
  duracao_segundos   integer,
  status             text not null default 'pendente'
                       check (status in ('pendente','aprovado','reprovado')),
  feedback_admin     text,
  kaizens_concedidos integer not null default 0,
  avaliado_por       uuid references perfis(id),
  enviado_em         timestamptz default now(),
  avaliado_em        timestamptz
);

create table if not exists kaizens_log (
  id         uuid primary key default uuid_generate_v4(),
  perfil_id  uuid not null references perfis(id) on delete cascade,
  origem     text not null
               check (origem in ('quiz','video_aprovado','streak','bonus_admin')),
  valor      integer not null,
  descricao  text,
  criado_em  timestamptz default now()
);

create table if not exists modulos_desbloqueados (
  id               uuid primary key default uuid_generate_v4(),
  perfil_id        uuid not null references perfis(id) on delete cascade,
  faixa_id         uuid not null references faixas(id) on delete cascade,
  desbloqueado_por uuid references perfis(id),
  desbloqueado_em  timestamptz default now(),
  unique (perfil_id, faixa_id)
);

-- ─── VIEW: RANKING ───────────────────────────────────────────

create or replace view ranking_por_faixa as
select
  id,
  nome,
  faixa_atual,
  kaizens_total,
  streak_dias,
  avatar_url,
  rank() over (partition by faixa_atual order by kaizens_total desc) as posicao_faixa,
  rank() over (order by kaizens_total desc) as posicao_geral
from perfis
where role = 'aluno';

-- ─── ROW LEVEL SECURITY ──────────────────────────────────────

alter table perfis enable row level security;
alter table progresso_estacoes enable row level security;
alter table respostas_quiz enable row level security;
alter table videos_aluno enable row level security;
alter table kaizens_log enable row level security;
alter table faixas enable row level security;
alter table estacoes enable row level security;
alter table blocos enable row level security;
alter table alternativas enable row level security;

create policy "Aluno acessa proprio perfil" on perfis
  for select using (auth.uid() = id);

create policy "Admin Sensei acessa todos perfis" on perfis
  for all using (
    exists (select 1 from perfis p where p.id = auth.uid() and p.role = 'admin_sensei')
  );

create policy "Admin Mestre acessa todos perfis" on perfis
  for all using (
    exists (select 1 from perfis p where p.id = auth.uid() and p.role = 'admin_mestre')
  );

create policy "Aluno acessa proprio progresso" on progresso_estacoes
  for all using (auth.uid() = perfil_id);

create policy "Admin Sensei acessa todo progresso" on progresso_estacoes
  for all using (
    exists (select 1 from perfis p where p.id = auth.uid() and p.role = 'admin_sensei')
  );

create policy "Aluno acessa proprias respostas" on respostas_quiz
  for all using (auth.uid() = perfil_id);

create policy "Admin Sensei acessa todas respostas" on respostas_quiz
  for all using (
    exists (select 1 from perfis p where p.id = auth.uid() and p.role = 'admin_sensei')
  );

create policy "Aluno acessa proprios videos" on videos_aluno
  for all using (auth.uid() = perfil_id);

create policy "Admin Sensei gerencia videos" on videos_aluno
  for all using (
    exists (select 1 from perfis p where p.id = auth.uid() and p.role = 'admin_sensei')
  );

create policy "Aluno acessa proprio log" on kaizens_log
  for all using (auth.uid() = perfil_id);

create policy "Admin Sensei acessa todo log" on kaizens_log
  for all using (
    exists (select 1 from perfis p where p.id = auth.uid() and p.role = 'admin_sensei')
  );

create policy "Autenticados leem faixas" on faixas
  for select using (auth.uid() is not null);

create policy "Admin Sensei gerencia faixas" on faixas
  for all using (
    exists (select 1 from perfis p where p.id = auth.uid() and p.role = 'admin_sensei')
  );

create policy "Autenticados leem estacoes" on estacoes
  for select using (auth.uid() is not null);

create policy "Admin Sensei gerencia estacoes" on estacoes
  for all using (
    exists (select 1 from perfis p where p.id = auth.uid() and p.role = 'admin_sensei')
  );

create policy "Autenticados leem blocos" on blocos
  for select using (auth.uid() is not null);

create policy "Admin Sensei gerencia blocos" on blocos
  for all using (
    exists (select 1 from perfis p where p.id = auth.uid() and p.role = 'admin_sensei')
  );

create policy "Autenticados leem alternativas" on alternativas
  for select using (auth.uid() is not null);

create policy "Admin Sensei gerencia alternativas" on alternativas
  for all using (
    exists (select 1 from perfis p where p.id = auth.uid() and p.role = 'admin_sensei')
  );

-- ─── TRIGGER: cria perfil ao cadastrar ───────────────────────

create or replace function public.handle_new_user()
returns trigger as $$
declare
  v_username text;
begin
  v_username := lower(trim(coalesce(new.raw_user_meta_data->>'username', '')));

  insert into public.perfis (id, nome, email, username, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'nome', 'Usuário'),
    new.email,
    nullif(v_username, ''),
    coalesce(new.raw_user_meta_data->>'role', 'aluno')
  );

  if v_username <> '' then
    insert into public.username_lookup (username, user_id)
    values (v_username, new.id)
    on conflict (username) do nothing;
  end if;

  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ─── SEED: Faixas ────────────────────────────────────────────

insert into faixas (nome, cor_hex, ordem, descricao) values
  ('branca',  '#e8e8e8', 1, 'Faixa inicial — fundamentos do karatê'),
  ('amarela', '#f5c842', 2, 'Primeiros passos — técnicas básicas'),
  ('laranja', '#f5832a', 3, 'Desenvolvimento — posições e golpes'),
  ('bordo',   '#8B1A1A', 4, 'Progressão — combinações e katas'),
  ('azul',    '#1a5fa8', 5, 'Intermediário — técnicas avançadas'),
  ('verde',   '#2e8b3a', 6, 'Avançado — direções e variações'),
  ('roxa',    '#6b3fa0', 7, 'Especialização — Waza e Kata'),
  ('marrom',  '#7B4F2E', 8, 'Pré-Dan — em definição com o Sensei'),
  ('preta',   '#1a1a1a', 9, 'Dan — em definição com o Sensei')
on conflict do nothing;
