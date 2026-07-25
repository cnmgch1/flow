import type { NextApiRequest, NextApiResponse } from 'next'

import { authHeaders, buildUrl, getConfig } from './utils'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== 'POST') {
    return res.status(405).end()
  }

  const config = getConfig(req)
  if (!config) {
    return res.status(401).end()
  }

  const { paths } = req.body as { paths: string[] }
  if (!Array.isArray(paths) || paths.length === 0) {
    return res.status(400).end()
  }

  try {
    const headers = authHeaders(config)

    await Promise.all(
      paths.map((path) =>
        fetch(buildUrl(config, path), {
          method: 'DELETE',
          headers,
        }),
      ),
    )

    res.status(200).json({ ok: true })
  } catch {
    res.status(500).end()
  }
}
