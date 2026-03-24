import { useEffect, useRef, useState } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

export function useWebSocket(roomId, onMessage, playerId) {
  const clientRef = useRef(null);
  const [connected, setConnected] = useState(false);
  const onMessageRef = useRef(onMessage);

  useEffect(() => {
    onMessageRef.current = onMessage;
  }, [onMessage]);

  useEffect(() => {
    if (!roomId || !playerId) return;

    const client = new Client({
      webSocketFactory: () => new SockJS('http://localhost:8080/ws'),

      onConnect: () => {
        setConnected(true);

        // 1. Topic general — JOIN, CHAT, ACTION_NOTICE, errores
        client.subscribe(`/topic/room/${roomId}`, (msg) => {
          onMessageRef.current(JSON.parse(msg.body));
        });

        // 2. Topic personal — STATE_UPDATE con tu mano específica
        client.subscribe(`/topic/room/${roomId}/${playerId}`, (msg) => {
          onMessageRef.current(JSON.parse(msg.body));
        });

        // 3. Registrar sesión en el servidor para detectar desconexión
        //    FIX #1: el backend ahora reenvía el estado si la partida ya empezó
        client.publish({
          destination: `/app/game/${roomId}/connect`,
          body: JSON.stringify({
            type: 'CONNECT',
            roomId,
            playerId,
            timestamp: Date.now(),
          }),
        });
      },

      onDisconnect: () => setConnected(false),
      reconnectDelay: 3000,
    });

    client.activate();
    clientRef.current = client;

    return () => client.deactivate();
  }, [roomId, playerId]);

  const sendAction = (action, pid) => {
    if (!clientRef.current?.connected) return;
    clientRef.current.publish({
      destination: `/app/game/${roomId}/action`,
      body: JSON.stringify({ type: 'ACTION', roomId, playerId: pid, action, timestamp: Date.now() }),
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