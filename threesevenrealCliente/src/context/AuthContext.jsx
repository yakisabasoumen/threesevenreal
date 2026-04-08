import { useState, useEffect, useRef } from 'react';
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";

import { AuthContext } from './AuthContextImpl.js';
const PERSISTED_KEYS = ['token', 'username', 'playerId', 'avatarSymbol'];

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const token = localStorage.getItem('token');
    if (!token) return null;

    return PERSISTED_KEYS.reduce((acc, key) => {
      const val = localStorage.getItem(key);
      if (val) acc[key] = val;
      return acc;
    }, {});
  });

  const clientRef = useRef(null);

  // 🔥 WEBSOCKET GLOBAL — PRESENCIA GLOBAL
  useEffect(() => {
    if (!user) {
      // Si no hay usuario, desconectar si existe
      if (clientRef.current?.connected) {
        clientRef.current.publish({
          destination: "/app/app.disconnect",
          body: user?.username || ''
        });
        clientRef.current.deactivate();
        clientRef.current = null;
        window.globalStompClient = null;
      }
      return;
    }

    const token = localStorage.getItem("token");

    const client = new Client({
      webSocketFactory: () => new SockJS("http://localhost:8080/ws"),
      connectHeaders: { Authorization: `Bearer ${token}` },
      reconnectDelay: 3000,

      onConnect: () => {
        // Registrar presencia global
        client.publish({
          destination: "/app/app.connect",
          body: user.username
        });
      },

      onDisconnect: () => {
        window.globalStompClient = null;
      }
    });

    window.globalStompClient = client;
    client.activate();
    clientRef.current = client;

    // NO cleanup aquí — la conexión global permanece hasta logout
  }, [user]);

  const login = (data) => {
    const next = { ...user, ...data };
    PERSISTED_KEYS.forEach(key => {
      if (next[key] != null) localStorage.setItem(key, next[key]);
    });
    setUser(next);
  };

  const logout = () => {
    // Desconectar WebSocket global
    if (clientRef.current?.connected) {
      clientRef.current.publish({
        destination: "/app/app.disconnect",
        body: user?.username || ''
      });
      clientRef.current.deactivate();
      clientRef.current = null;
      window.globalStompClient = null;
    }

    localStorage.clear();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
