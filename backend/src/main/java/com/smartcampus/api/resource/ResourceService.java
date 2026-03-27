package com.smartcampus.api.resource;

import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ResourceService {

    private final ResourceRepository resourceRepository;

    @Transactional(readOnly = true)
    public List<Resource> getAllResources() {
        return resourceRepository.findAll();
    }

    @Transactional(readOnly = true)
    public Resource getResourceById(Long id) {
        return resourceRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Resource not found with id: " + id));
    }

    @Transactional
    public Resource createResource(ResourceDTO dto) {
        Resource resource = Resource.builder()
                .name(dto.getName())
                .type(dto.getType())
                .description(dto.getDescription())
                .capacity(dto.getCapacity())
                .location(dto.getLocation())
                .availabilityStartHour(dto.getAvailabilityStartHour())
                .availabilityEndHour(dto.getAvailabilityEndHour())
                .status(dto.getStatus())
                .amenities(dto.getAmenities())
                .build();
        return resourceRepository.save(resource);
    }

    @Transactional
    public Resource updateResource(Long id, ResourceDTO dto) {
        Resource resource = getResourceById(id);
        resource.setName(dto.getName());
        resource.setType(dto.getType());
        resource.setDescription(dto.getDescription());
        resource.setCapacity(dto.getCapacity());
        resource.setLocation(dto.getLocation());
        resource.setAvailabilityStartHour(dto.getAvailabilityStartHour());
        resource.setAvailabilityEndHour(dto.getAvailabilityEndHour());
        resource.setStatus(dto.getStatus());
        resource.setAmenities(dto.getAmenities());
        return resourceRepository.save(resource);
    }

    @Transactional
    public void deleteResource(Long id) {
        if (!resourceRepository.existsById(id)) {
            throw new RuntimeException("Resource not found with id: " + id);
        }
        resourceRepository.deleteById(id);
    }

    @Transactional(readOnly = true)
    public List<Resource> getAvailableResources() {
        return resourceRepository.findByStatus(ResourceStatus.ACTIVE);
    }

    @Transactional(readOnly = true)
    public List<Resource> searchResources(ResourceType type, String location, Integer minCapacity) {
        Specification<Resource> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            // Always filter for ACTIVE resources for booking
            predicates.add(cb.equal(root.get("status"), ResourceStatus.ACTIVE));

            if (type != null) {
                predicates.add(cb.equal(root.get("type"), type));
            }

            if (location != null && !location.isEmpty()) {
                predicates.add(cb.like(cb.lower(root.get("location")), "%" + location.toLowerCase() + "%"));
            }

            if (minCapacity != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("capacity"), minCapacity));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        return resourceRepository.findAll(spec);
    }
}
