package com.smartcampus.api.resource;

import com.smartcampus.api.resource.dto.CreateResourceRequest;
import com.smartcampus.api.resource.dto.ResourceResponse;
import com.smartcampus.api.resource.dto.UpdateResourceRequest;
import com.smartcampus.api.resource.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ResourceService {

    private final ResourceRepository resourceRepository;

    @Transactional
    public ResourceResponse createResource(CreateResourceRequest req) {
        Resource resource = Resource.builder()
                .name(req.getName())
                .type(req.getType())
                .description(req.getDescription())
                .capacity(req.getCapacity())
                .location(req.getLocation())
                .availableFrom(req.getAvailableFrom() != null ? req.getAvailableFrom() : java.time.LocalTime.of(8, 0))
                .availableTo(req.getAvailableTo() != null ? req.getAvailableTo() : java.time.LocalTime.of(18, 0))
                .status(ResourceStatus.ACTIVE)
                .build();
        Resource saved = resourceRepository.save(resource);
        if (saved == null) {
            throw new RuntimeException("Failed to save resource");
        }
        return mapToResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<ResourceResponse> getAllResources(ResourceType type, Integer capacity, String location) {
        List<Resource> resources = resourceRepository.filterResources(type, capacity, location);
        return resources.stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public ResourceResponse getResourceById(Long id) {
        if (id == null) {
            throw new IllegalArgumentException("ID cannot be null");
        }
        Resource resource = resourceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Resource not found with id: " + id));
        return mapToResponse(resource);
    }

    @Transactional
    public ResourceResponse updateResource(Long id, UpdateResourceRequest req) {
        Resource resource = resourceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Resource not found with id: " + id));

        if (req.getName() != null) resource.setName(req.getName());
        if (req.getType() != null) resource.setType(req.getType());
        if (req.getDescription() != null) resource.setDescription(req.getDescription());
        if (req.getCapacity() != null) resource.setCapacity(req.getCapacity());
        if (req.getLocation() != null) resource.setLocation(req.getLocation());
        if (req.getAvailableFrom() != null) resource.setAvailableFrom(req.getAvailableFrom());
        if (req.getAvailableTo() != null) resource.setAvailableTo(req.getAvailableTo());
        if (req.getStatus() != null) resource.setStatus(req.getStatus());

        Resource updated = resourceRepository.save(resource);
        if (updated == null) {
             throw new RuntimeException("Failed to update resource");
        }
        return mapToResponse(updated);
    }

    @Transactional
    public void deleteResource(Long id) {
        if (!resourceRepository.existsById(id)) {
            throw new ResourceNotFoundException("Resource not found with id: " + id);
        }
        resourceRepository.deleteById(id);
    }

    private ResourceResponse mapToResponse(Resource resource) {
        ResourceResponse res = new ResourceResponse();
        res.setId(resource.getId());
        res.setName(resource.getName());
        res.setType(resource.getType());
        res.setCapacity(resource.getCapacity());
        res.setLocation(resource.getLocation());
        res.setDescription(resource.getDescription());
        res.setAvailableFrom(resource.getAvailableFrom());
        res.setAvailableTo(resource.getAvailableTo());
        res.setStatus(resource.getStatus());
        res.setCreatedAt(resource.getCreatedAt());
        res.setUpdatedAt(resource.getUpdatedAt());
        return res;
    }
}
