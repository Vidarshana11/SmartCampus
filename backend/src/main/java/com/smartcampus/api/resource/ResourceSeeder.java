package com.smartcampus.api.resource;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

import java.time.LocalTime;
import java.util.List;

@Component
@ConditionalOnProperty(prefix = "app.seed.resources", name = "enabled", havingValue = "true", matchIfMissing = true)
public class ResourceSeeder implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(ResourceSeeder.class);

    private final ResourceRepository resourceRepository;

    public ResourceSeeder(ResourceRepository resourceRepository) {
        this.resourceRepository = resourceRepository;
    }

    @Override
    public void run(String... args) {
        try {
            if (hasAnySeededResource()) {
                log.info("Resource seeding skipped: resources already exist.");
                return;
            }

            List<Resource> resources = List.of(
                    createResource("Lecture Hall A101", ResourceType.ROOM,
                            "Large lecture hall with projector and audio system, seats 150 students",
                            150, "Building A, Floor 1", LocalTime.of(8, 0), LocalTime.of(18, 0),
                            "Projector, Audio System, Whiteboard, Wi-Fi"),
                    createResource("Lecture Hall A102", ResourceType.ROOM,
                            "Medium lecture hall with smart board, seats 100 students",
                            100, "Building A, Floor 1", LocalTime.of(8, 0), LocalTime.of(18, 0),
                            "Smart Board, Projector, Wi-Fi, Air Conditioning"),
                    createResource("Seminar Room B205", ResourceType.ROOM,
                            "Intimate seminar room for group discussions, seats 30",
                            30, "Building B, Floor 2", LocalTime.of(9, 0), LocalTime.of(17, 0),
                            "Whiteboard, Conference Table, Wi-Fi"),
                    createResource("Seminar Room B206", ResourceType.ROOM,
                            "Small meeting room for interviews and 1-on-1 sessions, seats 6",
                            6, "Building B, Floor 2", LocalTime.of(8, 0), LocalTime.of(17, 0),
                            "Round Table, Wi-Fi, Video Conferencing"),
                    createResource("Auditorium C301", ResourceType.ROOM,
                            "Large auditorium for events and presentations, seats 400",
                            400, "Building C, Floor 3", LocalTime.of(8, 0), LocalTime.of(20, 0),
                            "Stage, Projector, Sound System, Seating"),
                    createResource("Computer Lab D101", ResourceType.LAB,
                            "Well-equipped computer lab with 50 workstations and Linux systems",
                            50, "Building D, Floor 1", LocalTime.of(8, 0), LocalTime.of(18, 0),
                            "50 PCs, Linux OS, Java, Python, IDE Software"),
                    createResource("Physics Lab E102", ResourceType.LAB,
                            "Physics laboratory with experimental apparatus and measurement tools",
                            40, "Building E, Floor 1", LocalTime.of(9, 0), LocalTime.of(17, 0),
                            "Oscilloscope, Multimeter, Power Supplies, Sensors"),
                    createResource("Chemistry Lab E201", ResourceType.LAB,
                            "Chemistry laboratory with fume hoods and safety equipment",
                            35, "Building E, Floor 2", LocalTime.of(8, 0), LocalTime.of(17, 0),
                            "Fume Hoods, Burners, Lab Tables, Safety Equipment"),
                    createResource("Biology Lab F103", ResourceType.LAB,
                            "Modern biology lab with microscopes and specimen samples",
                            30, "Building F, Floor 1", LocalTime.of(8, 0), LocalTime.of(18, 0),
                            "Microscopes, Incubators, Centrifuges, Specimen Storage"),
                    createResource("Network Lab D102", ResourceType.LAB,
                            "Network and cybersecurity lab with routing equipment",
                            25, "Building D, Floor 1", LocalTime.of(8, 0), LocalTime.of(18, 0),
                            "Routers, Switches, Security Tools, Workstations"),
                    createResource("Projector Set A", ResourceType.EQUIPMENT,
                            "Portable projector with HDMI and VGA connectivity",
                            1, "Equipment Room A", LocalTime.of(8, 0), LocalTime.of(18, 0),
                            "HDMI, VGA, Wireless, 3000 Lumens"),
                    createResource("Sound System B", ResourceType.EQUIPMENT,
                            "Professional sound system with microphone and speakers",
                            1, "Equipment Room B", LocalTime.of(8, 0), LocalTime.of(20, 0),
                            "Wireless Microphone, Speakers, Mixer"),
                    createResource("Video Camera Set", ResourceType.EQUIPMENT,
                            "Professional video camera with tripod and lighting kit",
                            1, "Media Lab", LocalTime.of(9, 0), LocalTime.of(17, 0),
                            "4K Camera, Tripod, Lights, Microphone"),
                    createResource("Interactive Whiteboard C", ResourceType.EQUIPMENT,
                            "Digital interactive whiteboard for collaborative teaching",
                            1, "Equipment Room C", LocalTime.of(8, 0), LocalTime.of(18, 0),
                            "Touch Screen, Wireless, Annotation Software"),
                    createResource("Laptop Cart D", ResourceType.EQUIPMENT,
                            "Mobile cart with 20 laptops for classroom use",
                            20, "Equipment Room D", LocalTime.of(8, 0), LocalTime.of(18, 0),
                            "20 Laptops, Chargers, Wi-Fi Enabled"),
                    createResource("VR Headset Set", ResourceType.EQUIPMENT,
                            "Virtual Reality headsets for immersive learning experiences",
                            10, "Innovation Lab", LocalTime.of(9, 0), LocalTime.of(17, 0),
                            "10 VR Headsets, Controllers, Educational Software"),
                    createResource("3D Printer", ResourceType.EQUIPMENT,
                            "Industrial 3D printer for design and engineering projects",
                            1, "Makerspace", LocalTime.of(9, 0), LocalTime.of(17, 0),
                            "FDM Technology, Multiple Materials, 300x300x300mm Build"),
                    createResource("Microscope Bundle", ResourceType.EQUIPMENT,
                            "High-powered microscopes with digital imaging capability",
                            5, "Science Building", LocalTime.of(8, 0), LocalTime.of(18, 0),
                            "1000x Magnification, Digital Camera, LED Lighting"),
                    createResource("Recording Studio E", ResourceType.EQUIPMENT,
                            "Professional audio recording studio with soundproof booth",
                            4, "Media Center Floor 2", LocalTime.of(10, 0), LocalTime.of(18, 0),
                            "Soundproof Booth, Mixing Console, Microphones, Monitors")
            );

            resourceRepository.saveAll(resources);
            log.info("Successfully seeded {} resources.", resources.size());
        } catch (Exception ex) {
            // Seeder failures should not block API startup.
            log.error("Resource seeding failed; backend startup will continue.", ex);
        }
    }

    private boolean hasAnySeededResource() {
        return resourceRepository.existsByName("Lecture Hall A101")
                || resourceRepository.existsByName("Computer Lab D101")
                || resourceRepository.existsByName("Projector Set A");
    }

    private Resource createResource(
            String name,
            ResourceType type,
            String description,
            int capacity,
            String location,
            LocalTime availableFrom,
            LocalTime availableTo,
            String amenities
    ) {
        return Resource.builder()
                .name(name)
                .type(type)
                .description(description)
                .capacity(capacity)
                .location(location)
                .availableFrom(availableFrom)
                .availableTo(availableTo)
                .status(ResourceStatus.ACTIVE)
                .amenities(amenities)
                .build();
    }
}
