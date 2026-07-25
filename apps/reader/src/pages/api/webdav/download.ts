import type { NextApiRequest, NextApiResponse } from 'next'

import { authHeaders, buildUrl, getConfig } from './utils'

export const config = {
  api: {
    bodyParser: false,
    responseLimit: false, // Disable response size limit
  },
}

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

  let davRes: Response | null = null

  try {
    const url = buildUrl(config, path)

    // Create abort controller for timeout
    const abortController = new AbortController();
    const timeoutId = setTimeout(() => {
      abortController.abort();
    }, 300000); // 5 minute timeout

    davRes = await fetch(url, {
      method: 'GET',
      headers: authHeaders(config),
      signal: abortController.signal,
    });

    clearTimeout(timeoutId);

    if (!davRes.ok) {
      return res.status(davRes.status).end()
    }

    // Set appropriate headers
    const contentType = davRes.headers.get('content-type') || 'application/octet-stream'
    const contentLength = davRes.headers.get('content-length')
    
    res.setHeader('Content-Type', contentType)
    if (contentLength) {
      res.setHeader('Content-Length', contentLength)
    }
    
    // Set headers to prevent caching for download
    res.setHeader('Cache-Control', 'no-cache')
    res.setHeader('Transfer-Encoding', 'chunked')

    // Convert ReadableStream to Node.js stream
    const reader = davRes.body?.getReader()
    if (!reader) {
      return res.status(500).end()
    }

    // Handle streaming response
    const pump = async (): Promise<void> => {
      try {
        let doneReading = false;
        while (!doneReading) {
          const { done, value } = await reader.read()
          
          if (done) {
            res.end()
            doneReading = true;
            break
          }
          
          // Write chunk to response
          const chunkWritten = res.write(Buffer.from(value))
          
          // If the socket buffer is full, wait for drain event
          if (!chunkWritten) {
            await new Promise(resolve => res.once('drain', resolve))
          }
        }
      } catch (error) {
        console.error('Streaming error:', error)
        if (!res.destroyed) {
          res.destroy()
        }
      } finally {
        reader.releaseLock()
      }
    }

    // Start pumping data
    await pump()

  } catch (error: any) {
    console.error('Download error:', error)
    if (res.writableEnded) return
    
    // Check if it's a timeout error
    if (error.name === 'AbortError') {
      return res.status(408).send('Request Timeout')
    }
    
    res.status(500).json({ 
      error: 'Download failed',
      message: error.message 
    })
  }
}
