// src/hooks/useLobbyChat.js
import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "../context/useAuth";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";

const COOLDOWN_SECONDS = 3;

export function useLobbyChat() {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [cooldown, setCooldown] = useState(0);
  const [connected, setConnected] = useState(false);
  const clientRef = useRef(null);
  const cooldownRef = useRef(null);

  // Cargar historial
  useEffect(() => {
    fetch("/api/chat/history", {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    })
      .then((r) => r.json())
      .then((history) => setMessages(history))
      .catch(console.error);
  }, []);

  // ✅ startCooldown ANTES del useEffect que lo usa
  const startCooldown = useCallback((seconds = COOLDOWN_SECONDS) => {
    setCooldown(seconds);
    clearInterval(cooldownRef.current);
    cooldownRef.current = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(cooldownRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  // ✅ Ahora startCooldown ya existe cuando este useEffect se define
  useEffect(() => {
    if (!user) return;

    const token = localStorage.getItem("token");
    const client = new Client({
      webSocketFactory: () => new SockJS("http://localhost:8080/ws"),
      connectHeaders: { Authorization: `Bearer ${token}` },
      reconnectDelay: 3000,

      onConnect: () => {
        setConnected(true);

        client.subscribe("/topic/lobby.chat", (frame) => {
          const msg = JSON.parse(frame.body);
          setMessages((prev) => [...prev.slice(-99), msg]);
        });

        client.subscribe(`/user/queue/chat.error`, (frame) => {
          const { remaining } = JSON.parse(frame.body);
          startCooldown(remaining);
        });
      },

      onDisconnect: () => setConnected(false),
    });

    client.activate();
    clientRef.current = client;

    return () => client.deactivate();
  }, [user, startCooldown]);

  const sendMessage = useCallback(
    (content) => {
      const client = clientRef.current;
      if (!client?.connected || cooldown > 0 || !content.trim()) return;
      client.publish({
        destination: "/app/chat.send",
        body: JSON.stringify({ content }),
      });
      startCooldown(COOLDOWN_SECONDS);
    },
    [cooldown, startCooldown]
  );

  return { messages, sendMessage, cooldown, connected };
}