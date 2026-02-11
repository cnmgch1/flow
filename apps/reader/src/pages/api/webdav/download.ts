import type { NextApiRequest, NextApiResponse } from 'next'

import { authHeaders, buildUrl, getConfig } from './utils'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== 'GET') {
    return res.status(405).end()
  }

  const config = getConfig(req)
  if (!config) {
    return res.status(401).end()
  }

  const path = req.query.path as string
  if (!path) {
    return res.status(400).end()
  }

  try {
    const url = buildUrl(config, path)

    const davRes = await fetch(url, {
      method: 'GET',
      headers: authHeaders(config),
    })

    if (!davRes.ok) {
      return res.status(davRes.status).end()
    }

    const contentType =
      davRes.headers.get('content-type') || 'application/octet-stream'
    res.setHeader('Content-Type', contentType)

    const buffer = Buffer.from(await davRes.arrayBuffer())
    res.status(200).send(buffer)
  } catch {
    res.status(500).end()
  }
}
