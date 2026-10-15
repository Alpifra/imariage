import type { Album, ExportJob, Guest, Photo } from './types'

export class ApiError extends Error {
  readonly status: number
  readonly detail: string
  readonly violations: Record<string, string>

  constructor(status: number, detail: string, violations: Record<string, string> = {}) {
    super(detail || `HTTP ${status}`)
    this.status = status
    this.detail = detail
    this.violations = violations
  }
}

interface Problem {
  detail?: string
  /** json_login failures use this key instead of the problem format */
  error?: string
  violations?: { propertyPath: string; message: string }[]
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const response = await fetch(`/api${path}`, {
    method,
    credentials: 'same-origin',
    headers: {
      Accept: 'application/json',
      ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })

  const text = await response.text()
  const data: unknown = text !== '' ? JSON.parse(text) : null

  if (!response.ok) {
    const problem = (data ?? {}) as Problem
    const violations = Object.fromEntries((problem.violations ?? []).map((v) => [v.propertyPath, v.message]))
    throw new ApiError(response.status, problem.detail ?? problem.error ?? '', violations)
  }

  return data as T
}

export interface PhotoQuery {
  before?: string
  after?: string
  mine?: boolean
  author?: string
}

function query(params: PhotoQuery): string {
  const search = new URLSearchParams()
  if (params.before) search.set('before', params.before)
  if (params.after) search.set('after', params.after)
  if (params.mine) search.set('mine', '1')
  if (params.author) search.set('author', params.author)
  const string = search.toString()

  return string !== '' ? `?${string}` : ''
}

export const api = {
  checkEventCode: (code: string) => request<unknown>('GET', `/events/${encodeURIComponent(code)}`),
  identify: (firstName: string, lastName: string, eventCode: string, sameGuest?: boolean) =>
    request<Guest>('POST', '/guests', { firstName, lastName, eventCode, sameGuest }),
  me: () => request<Guest>('GET', '/guests/me'),
  guests: () => request<Guest[]>('GET', '/guests'),
  album: () => request<Album>('GET', '/album'),
  photos: (params: PhotoQuery = {}) => request<Photo[]>('GET', `/photos${query(params)}`),
  photo: (id: string) => request<Photo>('GET', `/photos/${id}`),
  deletePhoto: (id: string) => request<null>('DELETE', `/photos/${id}`),
  login: (username: string, password: string) => request<Guest>('POST', '/login', { username, password }),
  logout: () => request<null>('POST', '/logout'),
  exports: () => request<ExportJob[]>('GET', '/exports'),
  exportJob: (id: string) => request<ExportJob>('GET', `/exports/${id}`),
  createExport: (author?: string) => request<ExportJob>('POST', '/exports', { author }),
}

export interface UploadHandle {
  promise: Promise<Photo>
  abort: () => void
}

/** XMLHttpRequest because fetch still exposes no upload progress */
export function uploadPhoto(file: File, onProgress: (ratio: number) => void): UploadHandle {
  const xhr = new XMLHttpRequest()
  const promise = new Promise<Photo>((resolve, reject) => {
    xhr.open('POST', '/api/photos')
    xhr.setRequestHeader('Accept', 'application/json')
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) onProgress(event.loaded / event.total)
    }
    xhr.onload = () => {
      const data = (xhr.responseText !== '' ? JSON.parse(xhr.responseText) : {}) as Problem & Photo
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(data)
      } else {
        reject(new ApiError(xhr.status, data.detail ?? data.violations?.[0]?.message ?? ''))
      }
    }
    xhr.onerror = () => reject(new ApiError(0, 'network'))
    xhr.onabort = () => reject(new ApiError(0, 'aborted'))

    const body = new FormData()
    body.append('file', file)
    xhr.send(body)
  })

  return { promise, abort: () => xhr.abort() }
}
