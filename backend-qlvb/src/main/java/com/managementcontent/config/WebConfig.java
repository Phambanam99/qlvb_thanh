package com.managementcontent.config;

import com.managementcontent.config.converter.StringToUserRoleConverter;
import com.managementcontent.config.converter.StringToUserStatusConverter;
import org.springframework.context.annotation.Configuration;
import org.springframework.format.FormatterRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * Configuration for web-specific settings including converters for request parameters
 */
@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Override
    public void addFormatters(FormatterRegistry registry) {
        registry.addConverter(new StringToUserRoleConverter());
        registry.addConverter(new StringToUserStatusConverter());
    }
}