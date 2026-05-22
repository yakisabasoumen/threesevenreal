import { useEffect, useRef, useState } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

export function useWebSocket(roomId, onMessage, playerId, gameType = 'game') {
  const clientRef = useRef(null);
  const [connected, setConnected] = useState(false);
  const [playerStreak, setPlayerStreak] = useState({ winStreak: 0, maxWinStreak: 0 });
  const onMessageRef = useRef(onMessage);

  useEffect(() => {
    onMessageRef.current = onMessage;
  }, [onMessage]);

  const prefix = gameType === 'domino' ? 'domino' : 'game';

  useEffect(() => {
    if (!roomId || !playerId) return;

    const token = localStorage.getItem('token');

    const client = new Client({
      webSocketFactory: () => new SockJS('http://localhost:8080/ws'),
      connectHeaders: {
        Authorization: token ? `Bearer ${token}` : undefined,
      },

      onConnect: () => {
        setConnected(true);

        const roomTopic   = gameType === 'domino' ? `/topic/domino.${roomId}`             : `/topic/room/${roomId}`;
        const playerTopic = gameType === 'domino' ? `/topic/domino.${roomId}/${playerId}` : `/topic/room/${roomId}/${playerId}`;

        client.subscribe(roomTopic, (msg) => {
          const message = JSON.parse(msg.body);
          if (message.type === 'JOIN' && message.winStreak != null) {
            setPlayerStreak({ winStreak: message.winStreak, maxWinStreak: message.maxWinStreak });
          }
          onMessageRef.current(message);
        });

        client.subscribe(playerTopic, (msg) => {
          onMessageRef.current(JSON.parse(msg.body));
        });

        // ← delay para asegurar que las suscripciones están activas antes del CONNECT
        setTimeout(() => {
          client.publish({
            destination: `/app/${prefix}/${roomId}/connect`,
            body: JSON.stringify({
              type: 'CONNECT',
              roomId,
              playerId,
              timestamp: Date.now(),
            }),
          });
        }, 300);
      },

      onDisconnect: () => setConnected(false),
      reconnectDelay: 3000,
    });

    client.activate();
    clientRef.current = client;

    return () => client.deactivate();
  }, [roomId, playerId, gameType]);

  const sendAction = (action, pid) => {
    if (!clientRef.current?.connected) return;

    const payload = typeof action === 'string'
      ? { type: 'ACTION', roomId, playerId: pid, action, timestamp: Date.now() }
      : { ...action, roomId, playerId: pid, timestamp: Date.now() };

    clientRef.current.publish({
      destination: `/app/${gameType === 'domino' ? 'domino' : 'game'}/${roomId}/action`,
      body: JSON.stringify(payload),
    });
  };

  const sendChat = (message, username) => {
    if (!clientRef.current?.connected) return;
    clientRef.current.publish({
      destination: `/app/${prefix}/${roomId}/chat`,
      body: JSON.stringify({ type: 'CHAT', roomId, username, message, timestamp: Date.now() }),
    });
  };

  return { connected, sendAction, sendChat, playerStreak };
}