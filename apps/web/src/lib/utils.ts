import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, formatDistanceToNow, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'

// Merge de classes Tailwind
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Formatação de moeda BRL
export function formatCurrency(value: number | null | undefined, options?: {
  compact?: boolean
}): string {
  if (value == null) return 'R$ 0,00'
  if (options?.compact && Math.abs(value) >= 1000) {
    return new Intl.NumberFormat('pt-BR', {
      style:    'currency',
      currency: 'BRL',
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(value)
  }
  return new Intl.NumberFormat('pt-BR', {
    style:    'currency',
    currency: 'BRL',
  }).format(value)
}

// Formatação de número
export function formatNumber(value: number | null | undefined): string {
  if (value == null) return '0'
  return new Intl.NumberFormat('pt-BR').format(value)
}

// Formatação de percentual
export function formatPercent(value: number | null | undefined, decimals = 1): string {
  if (value == null) return '0%'
  return `${value.toFixed(decimals)}%`
}

// Formatação de data
export function formatDate(
  date: string | Date | null | undefined,
  pattern = 'dd/MM/yyyy',
): string {
  if (!date) return '-'
  const d = typeof date === 'string' ? parseISO(date) : date
  return format(d, pattern, { locale: ptBR })
}

// Formatação de data e hora
export function formatDateTime(date: string | Date | null | undefined): string {
  return formatDate(date, 'dd/MM/yyyy HH:mm')
}

// Data relativa (ex: "há 2 horas")
export function formatRelativeDate(date: string | Date | null | undefined): string {
  if (!date) return '-'
  const d = typeof date === 'string' ? parseISO(date) : date
  return formatDistanceToNow(d, { addSuffix: true, locale: ptBR })
}

// Truncar texto
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength) + '…'
}

// Iniciais do nome
export function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase()
}

// Formatar CPF
export function formatCPF(cpf: string): string {
  const digits = cpf.replace(/\D/g, '')
  return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
}

// Formatar CNPJ
export function formatCNPJ(cnpj: string): string {
  const digits = cnpj.replace(/\D/g, '')
  return digits.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')
}

// Formatar telefone
export function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  if (digits.length === 11) {
    return digits.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')
  }
  return digits.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3')
}

// Formatar CEP
export function formatCEP(cep: string): string {
  return cep.replace(/\D/g, '').replace(/(\d{5})(\d{3})/, '$1-$2')
}

// Gerar slug
export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}

// Delay (para uso em loading states)
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// Debounce
export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number,
): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout>
  return (...args: Parameters<T>) => {
    clearTimeout(timer)
    timer = setTimeout(() => fn(...args), delay)
  }
}
