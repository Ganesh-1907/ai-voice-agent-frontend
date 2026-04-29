const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000'
const API_PREFIX = '/api'

type RequestOptions = RequestInit & {
  token?: string
}

export class ApiError extends Error {
  status: number
  body: unknown

  constructor(message: string, status: number, body: unknown) {
    super(message)
    this.status = status
    this.body = body
  }
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { token, headers, ...rest } = options

  const response = await fetch(`${API_BASE_URL}${API_PREFIX}${path}`, {
    ...rest,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(headers ?? {}),
    },
  })

  const text = await response.text()
  const body = text ? safeParseJson(text) : null

  if (!response.ok) {
    throw new ApiError(`API request failed with ${response.status}`, response.status, body)
  }

  return body as T
}

function safeParseJson(value: string): unknown {
  try {
    return JSON.parse(value)
  } catch {
    return value
  }
}

