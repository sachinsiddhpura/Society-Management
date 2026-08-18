package com.society.management.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;

@Configuration
public class AwsConfig {

    @Value("${app.upload.s3.region}")
    private String region;

    /**
     * No credentials are configured explicitly - the SDK's default provider
     * chain picks up the app EC2 instance's IAM role automatically in AWS,
     * or a local AWS CLI profile/env vars for local development.
     */
    @Bean
    public S3Client s3Client() {
        return S3Client.builder()
                .region(Region.of(region))
                .build();
    }
}
