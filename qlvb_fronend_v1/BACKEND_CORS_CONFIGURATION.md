# Backend CORS Configuration cho WebSocket

## Spring Boot WebSocket CORS Configuration

### 1. WebSocket Configuration Class

```java
@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        config.enableSimpleBroker("/queue", "/topic");
        config.setApplicationDestinationPrefixes("/app");
        config.setUserDestinationPrefix("/user");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns("*")  // ✅ Allow all origins for testing
                // .setAllowedOrigins("http://localhost:3000", "http://localhost:3001") // ✅ Production: specific origins
                .withSockJS()
                .setClientLibraryUrl("https://cdn.jsdelivr.net/npm/sockjs-client@1.6.1/dist/sockjs.min.js");
    }
}
```

### 2. Global CORS Configuration

```java
@Configuration
public class CorsConfig implements WebMvcConfigurer {

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/**")
                .allowedOriginPatterns("*")  // ✅ Allow all origins for testing
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                .allowedHeaders("*")
                .allowCredentials(true)
                .maxAge(3600);
        
        // ✅ Specific mapping for WebSocket endpoints
        registry.addMapping("/ws/**")
                .allowedOriginPatterns("*")
                .allowedMethods("GET", "POST", "OPTIONS")
                .allowedHeaders("*")
                .allowCredentials(true);
    }
}
```

### 3. Security Configuration for WebSocket

```java
@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .csrf(csrf -> csrf.disable())
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/ws/**").permitAll()  // ✅ Allow WebSocket endpoints
                .requestMatchers("/ws/info/**").permitAll()  // ✅ Allow SockJS info endpoint
                // ... other configurations
            );
        
        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOriginPatterns(List.of("*"));  // ✅ Allow all origins for testing
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("*"));
        configuration.setAllowCredentials(true);
        
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
```

## Quick Fix cho Development

Nếu chỉ cần test nhanh, thêm annotation này vào Controller hoặc thêm global config:

```java
@CrossOrigin(origins = "*", allowedHeaders = "*")
@RestController
public class WebSocketController {
    // ... existing code
}
```

## Production Notes

⚠️ **Lưu ý**: `allowedOriginPatterns("*")` chỉ dùng cho development. 
Production nên specify chính xác origins:

```java
.setAllowedOrigins(
    "http://localhost:3000",  // Development
    "https://yourdomain.com"  // Production
)
```
