package com.smartcampus.api.resource.dto;

import com.smartcampus.api.resource.ResourceStatus;
import com.smartcampus.api.resource.ResourceType;
import jakarta.validation.constraints.Min;
import lombok.Data;

import java.time.LocalTime;

@Data
public class UpdateResourceRequest {
    private String name;

    private ResourceType type;

    @Min(value = 1, message = "Capacity must be at least 1")
    private Integer capacity;

    private String location;
    
    private String description;

    private LocalTime availableFrom;

    private LocalTime availableTo;
    
    private ResourceStatus status;
}
