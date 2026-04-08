package com.smartcampus.api.resource.dto;

import com.smartcampus.api.resource.ResourceStatus;
import com.smartcampus.api.resource.ResourceType;
import lombok.Data;

import java.time.LocalDateTime;
import java.time.LocalTime;

@Data
public class ResourceResponse {
    private Long id;
    private String name;
    private ResourceType type;
    private Integer capacity;
    private String location;
    private String description;
    private LocalTime availableFrom;
    private LocalTime availableTo;
    private ResourceStatus status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
