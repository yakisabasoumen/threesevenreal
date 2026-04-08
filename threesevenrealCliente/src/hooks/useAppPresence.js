import { useEffect, useState } from "react";

export function useAppPresence() {
  const [onlineUsers, setOnlineUsers] = useState([]);

  useEffect(() => {
    let subscription = null;
    let pollInterval = null;

    const subscribeToPresence = () => {
      const client = window.globalStompClient;
      if (!client || !client.connected) return false;

      subscription = client.subscribe("/topic/app.online", (frame) => {
        try {
          const list = JSON.parse(frame.body);
          setOnlineUsers(list);
        } catch (e) {
          console.error("Error parsing app.online:", e);
        }
      });

      const username = localStorage.getItem('username');
      if (username) {
        client.publish({
          destination: "/app/app.connect",
          body: username,
        });
      }

      return true;
    };

    if (!subscribeToPresence()) {
      pollInterval = window.setInterval(() => {
        if (subscribeToPresence()) {
          window.clearInterval(pollInterval);
          pollInterval = null;
        }
      }, 200);
    }

    return () => {
      if (pollInterval) window.clearInterval(pollInterval);
      if (subscription) {
        try {
          subscription.unsubscribe();
        } catch (error) {
          console.warn("Failed to unsubscribe app.online", error);
        }
      }
    };
  }, []);

  return { onlineUsers };
}
