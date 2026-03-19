import { useEffect, useRef, useState } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

export function useWebSocket(roomId, onMessage) {
  const clientRef = useRef(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!roomId) return;

    const client = new Client({
      webSocketFactory: () => new SockJS('http://localhost:8080/ws'),
      onConnect: () => {
        setConnected(true);
        client.subscribe(`/topic/room/${roomId}`, (msg) => {
          const body = JSON.parse(msg.body);
          onMessage(body);
        });
      },
      onDisconnect: () => setConnected(false),
      reconnectDelay: 3000,
    });

    client.activate();
    clientRef.current = client;

    return () => client.deactivate();
  }, [roomId]);

  const sendAction = (action, playerId) => {
    if (!clientRef.current?.connected) return;
    clientRef.current.publish({
      destination: `/app/game/${roomId}/action`,
      body: JSON.stringify({ type: 'ACTION', roomId, playerId, action, timestamp: Date.now() }),
    });
  };

  const sendChat = (message, username) => {
    if (!clientRef.current?.connected) return;
    clientRef.current.publish({
      destination: `/app/game/${roomId}/chat`,
      body: JSON.stringify({ type: 'CHAT', roomId, username, message, timestamp: Date.now() }),
    });
  };

  return { connected, sendAction, sendChat };
}