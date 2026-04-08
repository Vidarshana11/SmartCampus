package com.smartcampus.api.resource;

import com.smartcampus.api.resource.dto.CreateResourceRequest;
import com.smartcampus.api.resource.dto.ResourceResponse;
import com.smartcampus.api.resource.dto.UpdateResourceRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/resources")
@RequiredArgsConstructor
public class ResourceController {

    private final ResourceService resourceService;

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ResourceResponse> createResource(@Valid @RequestBody CreateResourceRequest request) {
        ResourceResponse response = resourceService.createResource(request);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @GetMapping
    public ResponseEntity<List<ResourceResponse>> getAllResources(
            @RequestParam(required = false) ResourceType type,
            @RequestParam(required = false) Integer capacity,
            @RequestParam(required = false) String location) {
        List<ResourceResponse> resources = resourceService.getAllResources(type, capacity, location);
        return ResponseEntity.ok(resources);
    }

    @GetMapping("/{id}")
    public ResponseEntity<ResourceResponse> getResourceById(@PathVariable Long id) {
        ResourceResponse response = resourceService.getResourceById(id);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ResourceResponse> updateResource(
            @PathVariable Long id,
            @Valid @RequestBody UpdateResourceRequest request) {
        ResourceResponse response = resourceService.updateResource(id, request);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteResource(@PathVariable Long id) {
        resourceService.deleteResource(id);
        return ResponseEntity.noContent().build();
    }
}
