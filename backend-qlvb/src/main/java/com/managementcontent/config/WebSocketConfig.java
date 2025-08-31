package com.managementcontent.config;

import com.managementcontent.security.JwtTokenUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

@Configuration
@EnableWebSocketMessageBroker
@RequiredArgsConstructor
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    private final JwtTokenUtil jwtTokenUtil;
    private final UserDetailsService userDetailsService;
    private final CorsProperties corsProperties;

    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        // Enable simple broker for both /topic and /queue destinations
        registry.enableSimpleBroker("/topic", "/queue");
        registry.setApplicationDestinationPrefixes("/app");
        // Be explicit about user destination prefix for clarity
        registry.setUserDestinationPrefix("/user");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        // Native WebSocket STOMP endpoint (no SockJS)
        var wsNative = registry.addEndpoint("/ws");

        // Prefer explicit origins to ensure Access-Control-Allow-Origin echoes the
        // exact Origin when credentials are included (SockJS XHR uses withCredentials)
        if (corsProperties.getAllowedOrigins() != null && !corsProperties.getAllowedOrigins().isEmpty()) {
            wsNative.setAllowedOrigins(corsProperties.getAllowedOrigins().toArray(new String[0]));
        } else if (corsProperties.getAllowedOriginPatterns() != null
                && !corsProperties.getAllowedOriginPatterns().isEmpty()) {
            wsNative.setAllowedOriginPatterns(corsProperties.getAllowedOriginPatterns().toArray(new String[0]));
        } else {
            // Dev fallback; restrict in production
            wsNative.setAllowedOriginPatterns("*");
        }

        // SockJS fallback endpoint for legacy/bad-network environments
        var wsSockJs = registry.addEndpoint("/ws-sockjs");
        if (corsProperties.getAllowedOrigins() != null && !corsProperties.getAllowedOrigins().isEmpty()) {
            wsSockJs.setAllowedOrigins(corsProperties.getAllowedOrigins().toArray(new String[0]));
        } else if (corsProperties.getAllowedOriginPatterns() != null
                && !corsProperties.getAllowedOriginPatterns().isEmpty()) {
            wsSockJs.setAllowedOriginPatterns(corsProperties.getAllowedOriginPatterns().toArray(new String[0]));
        } else {
            wsSockJs.setAllowedOriginPatterns("*");
        }
        wsSockJs.withSockJS();

    }

    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {
        registration.interceptors(new ChannelInterceptor() {
            @Override
            public Message<?> preSend(Message<?> message, MessageChannel channel) {
                StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);

                if (StompCommand.CONNECT.equals(accessor.getCommand())) {
                    // Extract JWT token from Authorization header
                    String authHeader = accessor.getFirstNativeHeader("Authorization");

                    if (authHeader != null && authHeader.startsWith("Bearer ")) {
                        String token = authHeader.substring(7);

                        try {
                            String username = jwtTokenUtil.extractUsername(token);

                            if (username != null && jwtTokenUtil.isTokenValid(token,
                                    userDetailsService.loadUserByUsername(username))) {
                                UserDetails userDetails = userDetailsService.loadUserByUsername(username);

                                UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                                        userDetails, null, userDetails.getAuthorities());

                                SecurityContextHolder.getContext().setAuthentication(authToken);
                                accessor.setUser(authToken);
                            }
                        } catch (Exception e) {
                            // Handle JWT processing errors silently
                        }
                    }
                }

                return message;
            }
        });
    }
}
