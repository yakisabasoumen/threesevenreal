package com.threesevenreal.threesevenreal.service;

import com.threesevenreal.threesevenreal.dto.ChatMessage;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;

@Service
public class ChatService {

    private final List<ChatMessage> messages = new CopyOnWriteArrayList<>();
    private final Map<String, Instant> userCooldowns = new ConcurrentHashMap<>();

    private static final long MESSAGE_TTL_SECONDS = 120;  // Mensajes duran 2 minutos
    private static final long COOLDOWN_SECONDS    = 3;    // 3s entre mensajes

    public boolean isOnCooldown(String username) {
        Instant last = userCooldowns.get(username);
        if (last == null) return false;
        return Instant.now().isBefore(last.plusSeconds(COOLDOWN_SECONDS));
    }

    public long getRemainingCooldown(String username) {
        Instant last = userCooldowns.get(username);
        if (last == null) return 0;
        long remaining = COOLDOWN_SECONDS -
            (Instant.now().getEpochSecond() - last.getEpochSecond());
        return Math.max(0, remaining);
    }

    public ChatMessage saveMessage(String sender, String content) {
        ChatMessage msg = new ChatMessage();
        msg.setType("CHAT");
        msg.setSender(sender);
        msg.setContent(content);
        msg.setTimestamp(Instant.now());
        msg.setMessageId(UUID.randomUUID().toString());
        messages.add(msg);
        userCooldowns.put(sender, Instant.now());
        return msg;
    }

    public List<ChatMessage> getRecentMessages() {
        Instant cutoff = Instant.now().minusSeconds(MESSAGE_TTL_SECONDS);
        return messages.stream()
                .filter(m -> m.getTimestamp().isAfter(cutoff))
                .toList();
    }

    // Borra mensajes expirados cada 60 segundos
    @Scheduled(fixedDelay = 60_000)
    public void purgeExpiredMessages() {
        Instant cutoff = Instant.now().minusSeconds(MESSAGE_TTL_SECONDS);
        messages.removeIf(m -> m.getTimestamp().isBefore(cutoff));
    }
}