import type { NextApiRequest, NextApiResponse } from 'next'
import nookies from 'nookies'

import { WEBDAV_CONFIG_KEY, WebDAVConfig, authHeaders, buildUrl } from './utils'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== 'POST') {
    return res.status(405).end()
  }

  const { url, directory, username, password } = req.body as WebDAVConfig

  if (!url || !username || !password) {
    return res.status(400).json({ error: 'Missing required fields' })
  }

  const config: WebDAVConfig = {
    url: url.replace(/\/$/, ''),
    directory: directory || '/',
    username,
    password,
  }

  try {
    const headers = authHeaders(config)

    // Test connection with PROPFIND on base directory
    const baseUrl = buildUrl(config, '/')
    const testRes = await fetch(baseUrl, {
      method: 'PROPFIND',
      headers: { ...headers, Depth: '0' },
    })

    if (testRes.status === 404) {
      // Try to create the base directory
      const mkcolRes = await fetch(baseUrl, {
        method: 'MKCOL',
        headers,
      })
      if (!mkcolRes.ok && mkcolRes.status !== 405) {
        return res
          .status(400)
          .json({ error: 'Cannot create base directory' })
      }
    } else if (testRes.status === 401 || testRes.status === 403) {
      return res.status(401).json({ error: 'Authentication failed' })
    } else if (!testRes.ok && testRes.status !== 207) {
      return res.status(400).json({ error: 'Connection failed' })
    }

    // Ensure /files subdirectory exists
    const filesUrl = buildUrl(config, '/files/')
    const filesCheck = await fetch(filesUrl, {
      method: 'PROPFIND',
      headers: { ...headers, Depth: '0' },
    })
    if (filesCheck.status === 404) {
      await fetch(filesUrl, { method: 'MKCOL', headers })
    }

    // Save config to cookie
    const cookieValue = Buffer.from(JSON.stringify(config)).toString('base64')
    nookies.set({ res }, WEBDAV_CONFIG_KEY, cookieValue, {
      maxAge: 365 * 24 * 60 * 60,
      path: '/',
      sameSite: 'lax',
    })

    res.status(200).json({ ok: true })
  } catch {
    res.status(500).json({ error: 'Connection failed' })
  }
}
