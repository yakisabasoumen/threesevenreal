package com.threesevenreal.threesevenreal.dto;

import lombok.Data;
import lombok.Builder;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FriendshipStatusDTO {
    private String status; // NONE, PENDING_SENT, PENDING_RECEIVED, FRIENDS
    private String friendshipId; // si existe
}