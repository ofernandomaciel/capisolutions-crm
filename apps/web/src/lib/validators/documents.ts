// ─── CPF ────────────────────────────────────────────────────────────────────

export function formatCPF(value: string): string {
  return value
    .replace(/\D/g, '')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
}

export function formatCNPJ(value: string): string {
  return value
    .replace(/\D/g, '')
    .replace(/(\d{2})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1/$2')
    .replace(/(\d{4})(\d{1,2})$/, '$1-$2')
}

export function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, '')
  if (digits.length <= 10) {
    return digits
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{4})(\d)/, '$1-$2')
  }
  return digits
    .replace(/(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d)/, '$1-$2')
}

export function formatCEP(value: string): string {
  return value
    .replace(/\D/g, '')
    .replace(/(\d{5})(\d)/, '$1-$2')
}

export function validateCPF(cpf: string): boolean {
  const digits = cpf.replace(/\D/g, '')
  if (digits.length !== 11) return false
  if (/^(\d)\1{10}$/.test(digits)) return false

  let sum = 0
  for (let i = 0; i < 9; i++) sum += parseInt(digits[i]) * (10 - i)
  let rest = (sum * 10) % 11
  if (rest === 10 || rest === 11) rest = 0
  if (rest !== parseInt(digits[9])) return false

  sum = 0
  for (let i = 0; i < 10; i++) sum += parseInt(digits[i]) * (11 - i)
  rest = (sum * 10) % 11
  if (rest === 10 || rest === 11) rest = 0
  return rest === parseInt(digits[10])
}

export function validateCNPJ(cnpj: string): boolean {
  const digits = cnpj.replace(/\D/g, '')
  if (digits.length !== 14) return false
  if (/^(\d)\1{13}$/.test(digits)) return false

  const calc = (d: string, weights: number[]) =>
    weights.reduce((acc, w, i) => acc + parseInt(d[i]) * w, 0)

  const mod = (n: number) => {
    const r = n % 11
    return r < 2 ? 0 : 11 - r
  }

  const w1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
  const w2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]

  if (mod(calc(digits, w1)) !== parseInt(digits[12])) return false
  if (mod(calc(digits, w2)) !== parseInt(digits[13])) return false
  return true
}

// ─── CEP lookup via ViaCEP ───────────────────────────────────────────────────

export interface CEPData {
  street:       string
  neighborhood: string
  city:         string
  state:        string
}

export async function lookupCEP(cep: string): Promise<CEPData | null> {
  const digits = cep.replace(/\D/g, '')
  if (digits.length !== 8) return null

  try {
    const res  = await fetch(`https://viacep.com.br/ws/${digits}/json/`)
    const json = await res.json()
    if (json.erro) return null
    return {
      street:       json.logradouro ?? '',
      neighborhood: json.bairro     ?? '',
      city:         json.localidade ?? '',
      state:        json.uf         ?? '',
    }
  } catch {
    return null
  }
}

// ─── CNPJ lookup via BrasilAPI ───────────────────────────────────────────────

export interface CNPJData {
  razao_social:  string
  nome_fantasia: string
  email:         string
  telefone:      string
  street:        string
  street_number: string
  complement:    string
  neighborhood:  string
  city:          string
  state:         string
  zip_code:      string
}

export async function lookupCNPJ(cnpj: string): Promise<CNPJData | null> {
  const digits = cnpj.replace(/\D/g, '')
  if (digits.length !== 14) return null

  try {
    const res  = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${digits}`)
    if (!res.ok) return null
    const json = await res.json()
    return {
      razao_social:  json.razao_social   ?? '',
      nome_fantasia: json.nome_fantasia  ?? '',
      email:         json.email          ?? '',
      telefone:      json.ddd_telefone_1 ?? '',
      street:        json.logradouro     ?? '',
      street_number: json.numero         ?? '',
      complement:    json.complemento    ?? '',
      neighborhood:  json.bairro         ?? '',
      city:          json.municipio      ?? '',
      state:         json.uf             ?? '',
      zip_code:      json.cep?.replace(/\D/g, '') ?? '',
    }
  } catch {
    return null
  }
}
