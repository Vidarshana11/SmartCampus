package com.smartcampus.api.resource;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ResourceRepository extends JpaRepository<Resource, Long>, JpaSpecificationExecutor<Resource> {

    List<Resource> findByStatus(ResourceStatus status);

    List<Resource> findByType(ResourceType type);

    List<Resource> findByTypeAndStatus(ResourceType type, ResourceStatus status);

    boolean existsByName(String name);

    @org.springframework.data.jpa.repository.Query("SELECT r FROM Resource r WHERE " +
            "(:type IS NULL OR r.type = :type) AND " +
            "(:capacity IS NULL OR r.capacity >= :capacity) AND " +
            "(:location IS NULL OR LOWER(r.location) LIKE LOWER(CONCAT('%', :location, '%')))")
    List<Resource> filterResources(
            @org.springframework.data.repository.query.Param("type") ResourceType type,
            @org.springframework.data.repository.query.Param("capacity") Integer capacity,
            @org.springframework.data.repository.query.Param("location") String location
    );
}
