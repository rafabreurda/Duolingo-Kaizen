/**
 * Normaliza um nome para username:
 * "João Silva" → "joaosilva"
 * "Rogério"    → "rogerio"
 */
export function normalizarUsername(nome: string): string {
  return nome
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove acentos
    .replace(/[^a-z0-9]/g, '')       // remove tudo que não seja letra/número
    .slice(0, 30)                     // limita a 30 chars
}

/**
 * Constrói o email interno a partir do username.
 * Nunca exposto ao usuário.
 */
export function usernameParaEmail(username: string): string {
  return `${username}@dojo.local`
}
