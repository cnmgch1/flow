import type { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' })
  }

  const { baseUrl, apiKey, model, messages, stream = true } = req.body || {}

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'Invalid or missing messages array' })
  }

  if (!apiKey) {
    return res.status(401).json({ error: 'API Key is required' })
  }

  const cleanBaseUrl = (baseUrl || 'https://api.openai.com/v1').replace(/\/+$/, '')
  const targetUrl = `${cleanBaseUrl}/chat/completions`

  try {
    const upstreamRes = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: model || 'gpt-3.5-turbo',
        messages,
        stream,
      }),
    })

    if (!upstreamRes.ok) {
      const errorText = await upstreamRes.text()
      return res.status(upstreamRes.status).json({ error: errorText || 'Upstream API error' })
    }

    if (stream && upstreamRes.body) {
      res.setHeader('Content-Type', 'text/event-stream; charset=utf-8')
      res.setHeader('Cache-Control', 'no-cache, no-transform')
      res.setHeader('Connection', 'keep-alive')

      const reader = upstreamRes.body.getReader()
      let reading = true
      while (reading) {
        const { done, value } = await reader.read()
        if (done) {
          reading = false
          break
        }
        res.write(value)
      }
      return res.end()
    }

    const data = await upstreamRes.json()
    return res.status(200).json(data)
  } catch (err: any) {
    console.error('AI Proxy Error:', err)
    return res.status(500).json({ error: err?.message || 'Server error proxying AI request' })
  }
}
