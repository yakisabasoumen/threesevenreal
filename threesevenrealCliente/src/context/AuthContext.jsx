import { useState, useEffect, useRef } from 'react';
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { AuthContext } from './AuthContextImpl.js';

const PERSISTED_KEYS = ['token', 'username', 'playerId', 'avatarSymbol'];

// ✅ Helper para verificar si el token está expirado
const isTokenExpired = (token) => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp * 1000 < Date.now();
  } catch {
    return true;
  }
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const token = localStorage.getItem('token');
    if (!token) return null;

    // ✅ Si el token está expirado, limpiar localStorage y no cargar el usuario
    if (isTokenExpired(token)) {
      localStorage.clear();
      return null;
    }

    return PERSISTED_KEYS.reduce((acc, key) => {
      const val = localStorage.getItem(key);
      if (val) acc[key] = val;
      return acc;
    }, {});
  });

  const clientRef = useRef(null);

  useEffect(() => {
    if (!user) {
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

    // ✅ Doble check antes de conectar el WebSocket
    if (isTokenExpired(token)) {
      localStorage.clear();
      setUser(null);
      return;
    }

    const client = new Client({
      webSocketFactory: () => new SockJS("http://localhost:8080/ws"),
      connectHeaders: { Authorization: `Bearer ${token}` },
      reconnectDelay: 3000,
      onConnect: () => {
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
  }, [user]);

  const login = (data) => {
    
    localStorage.clear();
    const next = { ...data };
    PERSISTED_KEYS.forEach(key => {
      if (next[key] != null) localStorage.setItem(key, next[key]);
    });
    setUser(next);
  };

  const logout = () => {
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