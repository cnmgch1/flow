import type { NextApiRequest, NextApiResponse } from 'next'

import { authHeaders, buildUrl, getConfig } from './utils'

export const config = {
  api: {
    bodyParser: false,
  },
}

async function readBody(req: NextApiRequest): Promise<Buffer> {
  const chunks: Buffer[] = []
  for await (const chunk of req) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk)
  }
  return Buffer.concat(chunks)
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== 'PUT') {
    return res.status(405).end()
  }

  const davConfig = getConfig(req)
  if (!davConfig) {
    return res.status(401).end()
  }

  const path = req.query.path as string
  if (!path) {
    return res.status(400).end()
  }

  try {
    const body = await readBody(req)
    const url = buildUrl(davConfig, path)

    const davRes = await fetch(url, {
      method: 'PUT',
      headers: {
        ...authHeaders(davConfig),
        'Content-Type': req.headers['content-type'] || 'application/octet-stream',
      },
      body,
    })

    if (!davRes.ok && davRes.status !== 201 && davRes.status !== 204) {
      return res.status(davRes.status).end()
    }

    res.status(200).json({ ok: true })
  } catch {
    res.status(500).end()
  }
}
