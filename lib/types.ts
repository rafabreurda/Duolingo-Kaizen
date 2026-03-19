export type Role = 'aluno' | 'admin_mestre' | 'admin_sensei'

export type Faixa =
  | 'branca'
  | 'amarela'
  | 'laranja'
  | 'bordo'
  | 'azul'
  | 'verde'
  | 'roxa'
  | 'marrom'
  | 'preta'

export type ModoInterface = 'adulto' | 'infantil'

export type StatusEstacao =
  | 'bloqueada'
  | 'disponivel'
  | 'em_progresso'
  | 'concluida'

export type TipoBloco =
  | 'texto'
  | 'imagem'
  | 'video_sensei'
  | 'multipla_escolha'
  | 'video_aluno'

export type StatusVideo = 'pendente' | 'aprovado' | 'reprovado'

export type OrigemKaizen =
  | 'quiz'
  | 'video_aprovado'
  | 'streak'
  | 'bonus_admin'

// ─── Database Row Types ───────────────────────────────────────────────────────

export interface Academia {
  id: string
  nome: string
  logo_url: string | null
  cor_primaria: string | null
  cor_secundaria: string | null
  mascote_nome: string | null
  criado_em: string
}

export interface Perfil {
  id: string
  academia_id: string | null
  nome: string
  email: string
  telefone: string | null
  endereco: string | null
  data_nascimento: string | null
  faixa_atual: Faixa
  modo_interface: ModoInterface
  role: Role
  kaizens_total: number
  streak_dias: number
  ultimo_acesso: string | null
  avatar_url: string | null
  criado_em: string
}

export interface FaixaRow {
  id: string
  academia_id: string
  nome: string
  cor_hex: string
  ordem: number
  descricao: string | null
  ativo: boolean
  criado_em: string
}

export interface Estacao {
  id: string
  faixa_id: string
  titulo: string
  subtitulo: string | null
  ordem: number
  e_boss: boolean
  icone: string
  kaizens_max: number
  ativo: boolean
  criado_em: string
}

export interface Bloco {
  id: string
  estacao_id: string
  tipo: TipoBloco
  ordem: number
  conteudo_texto: string | null
  imagem_url: string | null
  video_url: string | null
  kaizens_valor: number
  obrigatorio: boolean
  criado_em: string
}

export interface Alternativa {
  id: string
  bloco_id: string
  texto: string
  e_correta: boolean
  explicacao: string | null
  ordem: number
}

export interface ProgressoEstacao {
  id: string
  perfil_id: string
  estacao_id: string
  status: StatusEstacao
  kaizens_ganhos: number
  tentativas: number
  concluida_em: string | null
}

export interface RespostaQuiz {
  id: string
  perfil_id: string
  bloco_id: string
  alternativa_escolhida_id: string
  acertou: boolean
  respondido_em: string
}

export interface VideoAluno {
  id: string
  perfil_id: string
  bloco_id: string
  estacao_id: string
  video_url: string
  duracao_segundos: number | null
  status: StatusVideo
  feedback_admin: string | null
  kaizens_concedidos: number
  avaliado_por: string | null
  enviado_em: string
  avaliado_em: string | null
}

export interface KaizenLog {
  id: string
  perfil_id: string
  origem: OrigemKaizen
  valor: number
  descricao: string | null
  criado_em: string
}
