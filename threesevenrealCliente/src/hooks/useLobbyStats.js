import { useState, useEffect, useRef } from "react";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { useAuth } from "../context/useAuth";

export function useLobbyStats() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    playersOnline: 0,
    gamesToday: 0,
    winStreak: 0,
    maxWinStreak: 0,
  });

  const [connected, setConnected] = useState(false);
  const clientRef = useRef(null);

  useEffect(() => {
    if (!user) return;

    const token = localStorage.getItem("token");
    const client = new Client({
      webSocketFactory: () => new SockJS("http://localhost:8080/ws"),
      connectHeaders: { Authorization: `Bearer ${token}` },
      reconnectDelay: 3000,

      onConnect: () => {
        setConnected(true);

        // Stats globales del lobby
        client.subscribe("/topic/lobby.stats", (frame) => {
          const data = JSON.parse(frame.body);
          setStats((prev) => ({ ...prev, ...data }));
        });

        // Stats personales del usuario
        client.subscribe("/user/queue/lobby.stats", (frame) => {
          const data = JSON.parse(frame.body);
          setStats((prev) => ({
            ...prev,
            winStreak: data.winStreak,
            maxWinStreak: data.maxWinStreak
          }));
        });

        // Registrar entrada al lobby
        client.publish({
          destination: "/app/lobby.connect",
          body: JSON.stringify({ username: user.username }),
        });
      },

      onDisconnect: () => setConnected(false),
    });

    client.activate();
    clientRef.current = client;

    return () => {
      const c = clientRef.current;

      if (c && c.connected) {
        c.publish({
          destination: "/app/lobby.disconnect",
          body: JSON.stringify({ username: user.username }),
        });
      }

      c?.deactivate();
    };
  }, [user]);

  return { stats, connected };
}
