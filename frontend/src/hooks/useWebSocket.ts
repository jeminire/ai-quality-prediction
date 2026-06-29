import { useEffect, useRef, useState } from "react"

export function useWebSocket(url: string) {
  const wsRef = useRef<WebSocket | null>(null)
  const [connected, setConnected] = useState(false)
  const [lastMessage, setLastMessage] = useState<any>(null)

  useEffect(() => {
    const ws = new WebSocket(url)
    wsRef.current = ws

    ws.onopen = () => setConnected(true)

    ws.onmessage = (event) => {
      try {
        setLastMessage(JSON.parse(event.data))
      } catch {
        setLastMessage(event.data)
      }
    }

    ws.onclose = () => setConnected(false)

    ws.onerror = () => setConnected(false)

    return () => ws.close()
  }, [url])

  const send = (data: any) => {
    if (wsRef.current?.readyState === 1) {
      wsRef.current.send(JSON.stringify(data))
    }
  }

  return {
    connected,
    lastMessage,
    send
  }
}