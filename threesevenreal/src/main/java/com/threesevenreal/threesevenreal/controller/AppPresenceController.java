package com.threesevenreal.threesevenreal.controller;

import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.stereotype.Controller;

import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

@Controller
public class AppPresenceController {

    private static final Set<String> onlineUsers = ConcurrentHashMap.newKeySet();

    @MessageMapping("/app.connect")
    @SendTo("/topic/app.online")
    public Set<String> connect(@Payload String username) {
        onlineUsers.add(username);
        return onlineUsers;
    }

    @MessageMapping("/app.disconnect")
    @SendTo("/topic/app.online")
    public Set<String> disconnect(@Payload String username) {
        onlineUsers.remove(username);
        return onlineUsers;
    }
}
