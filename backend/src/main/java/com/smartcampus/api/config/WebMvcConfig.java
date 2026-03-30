package com.smartcampus.api.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.io.File;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

/**
 * Web MVC Configuration
 * Configures static resource handlers for serving uploaded files
 */
@Configuration
public class WebMvcConfig implements WebMvcConfigurer {

    @Value("${upload.dir:uploads/}")
    private String uploadDir;

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // Serve uploaded files from the uploads directory
        try {
            Path uploadPath = Paths.get(uploadDir).toAbsolutePath();

            // Ensure directory exists
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }

            // Convert to file URI - Spring expects file:/// for absolute paths
            String fileUri = new File(uploadPath.toString()).toURI().toString();

            // Ensure trailing slash for resource location
            if (!fileUri.endsWith("/")) {
                fileUri += "/";
            }

            System.out.println("Serving uploads from: " + fileUri);
            registry.addResourceHandler("/uploads/**")
                    .addResourceLocations(fileUri)
                    .setCachePeriod(3600);
        } catch (Exception e) {
            System.err.println("Error configuring upload directory: " + e.getMessage());
            e.printStackTrace();
        }
    }
}
