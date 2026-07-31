/**
 * Chave de comparação de nomes.
 *
 * As listas do WhatsApp são escritas à mão: "Luís", "luis", "LUÍS" e "Luís " são a
 * mesma pessoa. Normalizamos para casar o que a lista diz com quem está cadastrado.
 *
 * NÃO serve como identificador único: a mesma pelada pode ter dois "Eduardo"
 * diferentes, e isso é normal.
 */
export function nameKey(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // tira acentos
    .replace(/[^\p{L}\p{N}\s]/gu, ' ') // tira emoji, pontuação, ✅
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

/** Primeiro nome — as listas raramente trazem sobrenome. */
export function firstNameKey(name: string): string {
  return nameKey(name).split(' ')[0] ?? '';
}
