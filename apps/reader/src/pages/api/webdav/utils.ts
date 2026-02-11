import type { NextApiRequest } from 'next'

export const WEBDAV_CONFIG_KEY = 'webdav-config'

export interface WebDAVConfig {
  url: string
  directory: string
  username: string
  password: string
}

export function getConfig(req: NextApiRequest): WebDAVConfig | null {
  const raw = req.cookies[WEBDAV_CONFIG_KEY]
  if (!raw) return null
  try {
    return JSON.parse(Buffer.from(raw, 'base64').toString()) as WebDAVConfig
  } catch {
    return null
  }
}

export function buildUrl(config: WebDAVConfig, path: string): string {
  const base = config.url.replace(/\/$/, '')
  const dir = config.directory
    ? config.directory.replace(/\/$/, '').replace(/^(?!\/)/, '/')
    : ''
  const cleanPath = path.startsWith('/') ? path : '/' + path
  return `${base}${dir}${cleanPath}`
}

export function authHeaders(
  config: WebDAVConfig,
): Record<string, string> {
  return {
    Authorization:
      'Basic ' +
      Buffer.from(`${config.username}:${config.password}`).toString('base64'),
  }
}

export interface RemoteFile {
  name: string
}

export function parseMultistatus(xml: string): RemoteFile[] {
  const files: RemoteFile[] = []
  const blocks = xml.split(/<(?:[\w]+:)?response[\s>]/i).slice(1)

  for (const block of blocks) {
    if (/<(?:[\w]+:)?collection/i.test(block)) continue

    const hrefMatch = block.match(
      /<(?:[\w]+:)?href[^>]*>([\s\S]*?)<\/(?:[\w]+:)?href>/i,
    )
    if (!hrefMatch) continue

    const href = decodeURIComponent(hrefMatch[1]!.trim())
    if (href.endsWith('/')) continue

    const name = href.split('/').filter(Boolean).pop()
    if (name) {
      files.push({ name })
    }
  }

  return files
}
