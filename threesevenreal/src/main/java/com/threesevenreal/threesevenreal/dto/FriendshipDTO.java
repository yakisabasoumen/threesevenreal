package com.threesevenreal.threesevenreal.dto;

import lombok.Data;
import lombok.Builder;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FriendshipDTO {
    private String id;
    private String senderId;
    private String senderUsername;
    private String receiverId;
    private String receiverUsername;
    private String status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}