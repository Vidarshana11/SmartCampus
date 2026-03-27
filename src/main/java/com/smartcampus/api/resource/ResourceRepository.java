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
}
