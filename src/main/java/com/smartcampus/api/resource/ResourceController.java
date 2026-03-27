package com.smartcampus.api.resource;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/resources")
@RequiredArgsConstructor
public class ResourceController {

    private final ResourceService resourceService;

    // GET all resources (any authenticated user)
    @GetMapping
    public ResponseEntity<List<Resource>> getAllResources() {
        return ResponseEntity.ok(resourceService.getAllResources());
    }

    // GET resource by ID
    @GetMapping("/{id}")
    public ResponseEntity<Resource> getResourceById(@PathVariable Long id) {
        return ResponseEntity.ok(resourceService.getResourceById(id));
    }

    // POST create resource (ADMIN or MANAGER only)
    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<Resource> createResource(@Valid @RequestBody ResourceDTO dto) {
        return ResponseEntity.ok(resourceService.createResource(dto));
    }

    // PUT update resource (ADMIN or MANAGER only)
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<Resource> updateResource(@PathVariable Long id, @Valid @RequestBody ResourceDTO dto) {
        return ResponseEntity.ok(resourceService.updateResource(id, dto));
    }

    // DELETE resource (ADMIN only)
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, String>> deleteResource(@PathVariable Long id) {
        resourceService.deleteResource(id);
        Map<String, String> response = new HashMap<>();
        response.put("message", "Resource deleted successfully");
        return ResponseEntity.ok(response);
    }

    // GET available resources
    @GetMapping("/available")
    public ResponseEntity<List<Resource>> getAvailableResources() {
        return ResponseEntity.ok(resourceService.getAvailableResources());
    }

    // GET search resources with filters
    @GetMapping("/search")
    public ResponseEntity<List<Resource>> searchResources(
            @RequestParam(required = false) ResourceType type,
            @RequestParam(required = false) String location,
            @RequestParam(required = false) Integer minCapacity) {
        return ResponseEntity.ok(resourceService.searchResources(type, location, minCapacity));
    }
}
