'use client'

import { useEffect, useState, useRef, useCallback } from 'react'

interface UseSSEProps {
  url: string
  onMessage: (data: any) => void
  enabled?: boolean
}

export function useSSE({ url, onMessage, enabled = true }: UseSSEProps) {
  const [isConnected, setIsConnected] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const retryCountRef = useRef(0)
  const maxRetries = 5
  const baseDelay = 1000
  const eventSourceRef = useRef<EventSource | null>(null)

  const connect = useCallback(() => {
    if (!enabled) return

    if (eventSourceRef.current) {
      eventSourceRef.current.close()
    }

    const eventSource = new EventSource(url)
    eventSourceRef.current = eventSource

    eventSource.onopen = () => {
      setIsConnected(true)
      setError(null)
      retryCountRef.current = 0
    }

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        onMessage(data)
      } catch (err) {
        console.error('Error parsing SSE message:', err)
      }
    }

    eventSource.onerror = (event) => {
      setIsConnected(false)
      eventSource.close()
      
      if (retryCountRef.current < maxRetries) {
        const delay = baseDelay * Math.pow(2, retryCountRef.current)
        retryCountRef.current += 1
        
        setTimeout(() => {
          connect()
        }, delay)
      } else {
        setError(new Error('Max reconnection retries reached'))
      }
    }
  }, [url, onMessage, enabled])

  useEffect(() => {
    if (enabled) {
      connect()
    }

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close()
        eventSourceRef.current = null
      }
    }
  }, [connect, enabled])

  return { isConnected, error }
}
