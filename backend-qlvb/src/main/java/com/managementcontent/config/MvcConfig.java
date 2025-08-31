package com.managementcontent.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class MvcConfig implements WebMvcConfigurer {

    @Value("${file.signature-upload-dir}")
    private String signatureUploadDir;

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        String resolvedPath = "file:" + signatureUploadDir;
        registry.addResourceHandler("/api/uploads/signatures/**")
                .addResourceLocations(resolvedPath);
    }
}