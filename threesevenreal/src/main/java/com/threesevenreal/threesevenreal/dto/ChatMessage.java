package com.threesevenreal.threesevenreal.dto;

import lombok.Data;
import java.time.Instant;

@Data
public class ChatMessage {
    private String type;    
    private String sender;
    private String content;
    private Instant timestamp;
    private String messageId;
}