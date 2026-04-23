package com.smartcampus.api;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class SmartCampusApiApplication {

    public static void main(String[] args) {
        SpringApplication.run(SmartCampusApiApplication.class, args);
    }
}