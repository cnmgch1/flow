import type { NextApiRequest, NextApiResponse } from 'next'

import { authHeaders, buildUrl, getConfig, parseMultistatus } from './utils'

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

  const path = (req.query.path as string) || '/files'
  const url = buildUrl(config, path + (path.endsWith('/') ? '' : '/'))

  try {
    const davRes = await fetch(url, {
      method: 'PROPFIND',
      headers: {
        ...authHeaders(config),
        Depth: '1',
      },
    })

    if (!davRes.ok && davRes.status !== 207) {
      return res.status(davRes.status).end()
    }

    const xml = await davRes.text()
    const files = parseMultistatus(xml)

    res.status(200).json(files)
  } catch {
    res.status(500).end()
  }
}
