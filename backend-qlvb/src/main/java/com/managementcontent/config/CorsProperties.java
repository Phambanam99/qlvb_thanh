package com.managementcontent.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;
import lombok.Data;

import java.util.List;

/**
 * Configuration properties for CORS settings.
 * Externalized CORS configuration to avoid hardcoding origins in
 * SecurityConfig.
 */
@Component
@ConfigurationProperties(prefix = "app.cors")
@Data
public class CorsProperties {

        /**
         * List of allowed origins for CORS requests.
         * Default values for development environment.
         */
        private List<String> allowedOrigins = List.of(
                        "https://33e3b94c413f.ngrok-free.app",
                        "https://dd25f4a95291.ngrok-free.app",
                        "https://73afa06bb84b.ngrok-free.app",
                        "http://localhost:8080",
                        "http://localhost:3000",
                        "http://localhost:3002",
                        "http://localhost:3003",
                        "http://192.168.88.130:3000",
                        "http://192.168.0.103:3000",
                        "http://127.0.0.1:3000");

        /**
         * Optional list of origin patterns, e.g. for ngrok subdomains.
         * When provided, these will be used instead of exact origins.
         */
        private List<String> allowedOriginPatterns = List.of(
                        "https://*.ngrok-free.app",
                        "http://localhost:8080",
                        "http://localhost:3000",
                        // Also allow HTTPS dev origins when using HTTPS tunneling or reverse proxies
                        "http://localhost:3000",
                        "http://localhost:3002",
                        "http://127.0.0.1:3000");

        /**
         * List of allowed HTTP methods for CORS requests.
         */
        private List<String> allowedMethods = List.of(
                        "GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS");

        /**
         * List of allowed headers for CORS requests.
         */
        private List<String> allowedHeaders = List.of(
                        "Authorization",
                        "Content-Type",
                        "Accept",
                        "Origin",
                        "Access-Control-Request-Method",
                        "Access-Control-Request-Headers",
                        "ngrok-skip-browser-warning",
                        "X-Requested-With");

        /**
         * Whether credentials are allowed in CORS requests.
         */
        private boolean allowCredentials = true;
}
