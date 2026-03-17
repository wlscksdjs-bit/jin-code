import { NextResponse } from 'next/server'
import { subscribe } from '@/lib/sse-broadcast'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    start(controller) {
      // Send heartbeat every 30s
      const heartbeat = setInterval(() => {
        controller.enqueue(encoder.encode(`data: {"type":"heartbeat"}\n\n`))
      }, 30000)
      
      // Send initial connection event
      controller.enqueue(encoder.encode(`data: {"type":"connected"}\n\n`))
      
      // Subscribe to global events
      const unsubscribe = subscribe('global', (data) => {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))
        } catch (error) {
          console.error('Error enqueuing SSE event:', error)
        }
      })
      
      // Cleanup on close
      request.signal.addEventListener('abort', () => {
        clearInterval(heartbeat)
        unsubscribe()
        controller.close()
      })
    }
  })
  
  return new NextResponse(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  })
}
