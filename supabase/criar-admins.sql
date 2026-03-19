-- ============================================================
-- CRIAR CONTAS DE ADMINISTRADOR INICIAIS
-- Executar APÓS o schema.sql
-- ============================================================
--
-- PASSO 1: No Supabase Dashboard
--   → Authentication → Users → "Add user"
--   Crie os dois usuários abaixo (marque "Auto Confirm User")
--
--   Admin Mestre (você):
--     Email:    neuroflux@dojo.local
--     Password: 607652
--
--   Admin Sensei (Rogério):
--     Email:    rogerio@dojo.local
--     Password: kaizen
--
-- PASSO 2: Execute as queries abaixo no SQL Editor
-- ============================================================

-- Admin Mestre (você)
UPDATE perfis
SET role = 'admin_mestre', nome = 'NeuroFlux', username = 'neuroflux'
WHERE email = 'neuroflux@dojo.local';

INSERT INTO username_lookup (username, user_id)
SELECT 'neuroflux', id FROM auth.users WHERE email = 'neuroflux@dojo.local'
ON CONFLICT (username) DO NOTHING;

-- Admin Sensei (Rogério)
UPDATE perfis
SET role = 'admin_sensei', nome = 'Rogério', username = 'rogerio'
WHERE email = 'rogerio@dojo.local';

INSERT INTO username_lookup (username, user_id)
SELECT 'rogerio', id FROM auth.users WHERE email = 'rogerio@dojo.local'
ON CONFLICT (username) DO NOTHING;

-- Verificar
SELECT id, nome, email, username, role FROM perfis
WHERE role IN ('admin_mestre', 'admin_sensei');

-- ============================================================
-- CREDENCIAIS DE ACESSO
-- ============================================================
--
--  ADMIN MESTRE (você)
--    Nome:  NeuroFlux   ← digita no campo "Nome" do login
--    Senha: 607652
--    Rota:  /mestre/alunos
--    Pode:  ver usuários, alterar funções e senhas, criar novos admins
--
--  ADMIN SENSEI (Rogério)
--    Nome:  Rogerio     ← digita no campo "Nome" do login
--    Senha: Kaizen      ← qualquer variação: kaizen, KAIZEN, kAiZeN
--    Rota:  /admin/dashboard
--    Pode:  tudo (faixas, estações, vídeos, alunos, configurações)
--
-- IMPORTANTE: maiúsculas e minúsculas são sempre aceitas.
-- "NeuroFlux", "NEUROFLUX", "neuroflux" → todos funcionam.
