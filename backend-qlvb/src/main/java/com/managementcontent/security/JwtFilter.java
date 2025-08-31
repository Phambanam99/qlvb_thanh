package com.managementcontent.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.JwtException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.hibernate.validator.internal.util.stereotypes.Lazy;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Service;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

@Service
public class JwtFilter extends OncePerRequestFilter {

    private static final Logger logger = LoggerFactory.getLogger(JwtFilter.class);
    private final JwtTokenUtil jwtService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Lazy
    private final UserDetailsService userDetailsService;

    public JwtFilter(JwtTokenUtil jwtService, UserDetailsService userDetailsService) {
        this.jwtService = jwtService;
        this.userDetailsService = userDetailsService;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        // Skip JWT validation for WebSocket related endpoints
        String requestURI = request.getRequestURI();
        if (isWebSocketEndpoint(requestURI)) {
            logger.debug("Skipping JWT validation for WebSocket endpoint: {}", requestURI);
            filterChain.doFilter(request, response);
            return;
        }

        final String authHeader = request.getHeader("Authorization");
        final String jwt;
        final String username;

        // Debug logging for all requests
        logger.debug("Processing request: {} {}", request.getMethod(), request.getRequestURI());
        logger.debug("Authorization header: {}", authHeader);

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            logger.debug("No valid Authorization header found, skipping JWT validation");
            filterChain.doFilter(request, response);
            return;
        }

        jwt = authHeader.substring(7);

        // Debug logging to check token format
        logger.debug("Received Authorization header: {}", authHeader);
        logger.debug("Extracted JWT token (first 50 chars): {}",
                jwt.length() > 50 ? jwt.substring(0, 50) + "..." : jwt);
        logger.debug("JWT token length: {}", jwt.length());

        // Validate JWT format (should have 2 periods)
        int periodCount = jwt.length() - jwt.replace(".", "").length();
        if (periodCount != 2) {
            logger.error("Invalid JWT format - expected 2 periods, found: {}. Token: {}", periodCount,
                    jwt.length() > 100 ? jwt.substring(0, 100) + "..." : jwt);
            handleInvalidJwt(response, "Invalid JWT token format");
            return;
        }

        try {
            username = jwtService.extractUsername(jwt);

            if (username != null && SecurityContextHolder.getContext().getAuthentication() == null) {
                UserDetails userDetails = this.userDetailsService.loadUserByUsername(username);
                if (jwtService.isTokenValid(jwt, userDetails)) {
                    UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                            userDetails, null, userDetails.getAuthorities());
                    authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                    SecurityContextHolder.getContext().setAuthentication(authToken);
                }
            }

            filterChain.doFilter(request, response);
        } catch (ExpiredJwtException e) {
            logger.warn("JWT token expired: {}", e.getMessage());
            handleExpiredJwt(response, "JWT token has expired. Please login again.");
        } catch (JwtException e) {
            logger.error("JWT token is invalid: {}", e.getMessage());
            handleInvalidJwt(response, "Invalid JWT token. Please login again.");
        } catch (Exception e) {
            logger.error("Authentication error: {}", e.getMessage());
            handleAuthenticationError(response, "Authentication failed. Please login again.");
        }
    }

    /**
     * Check if the request URI is a WebSocket related endpoint that should skip JWT
     * validation
     */
    private boolean isWebSocketEndpoint(String requestURI) {
        return requestURI != null && (requestURI.startsWith("/ws/") || // WebSocket endpoint
                requestURI.equals("/ws") || // WebSocket base endpoint
                requestURI.contains("/ws/info") || // SockJS info endpoint
                requestURI.contains("/ws/websocket") || // SockJS WebSocket fallback
                requestURI.contains("/ws/xhr") || // SockJS XHR transport
                requestURI.contains("/ws/iframe") || // SockJS iframe transport
                requestURI.contains("/ws/htmlfile") || // SockJS htmlfile transport
                requestURI.contains("/ws/jsonp") || // SockJS JSONP transport
                requestURI.contains("/ws/eventsource") // SockJS EventSource transport
        );
    }

    /**
     * Handle expired JWT token
     */
    private void handleExpiredJwt(HttpServletResponse response, String message) throws IOException {
        Map<String, Object> errorResponse = new HashMap<>();
        errorResponse.put("error", "JWT_EXPIRED");
        errorResponse.put("message", message);
        errorResponse.put("timestamp", System.currentTimeMillis());
        errorResponse.put("status", 401);

        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setCharacterEncoding("UTF-8");
        response.getWriter().write(objectMapper.writeValueAsString(errorResponse));
    }

    /**
     * Handle invalid JWT token
     */
    private void handleInvalidJwt(HttpServletResponse response, String message) throws IOException {
        Map<String, Object> errorResponse = new HashMap<>();
        errorResponse.put("error", "JWT_INVALID");
        errorResponse.put("message", message);
        errorResponse.put("timestamp", System.currentTimeMillis());
        errorResponse.put("status", 401);

        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setCharacterEncoding("UTF-8");
        response.getWriter().write(objectMapper.writeValueAsString(errorResponse));
    }

    /**
     * Handle general authentication errors
     */
    private void handleAuthenticationError(HttpServletResponse response, String message) throws IOException {
        Map<String, Object> errorResponse = new HashMap<>();
        errorResponse.put("error", "AUTHENTICATION_ERROR");
        errorResponse.put("message", message);
        errorResponse.put("timestamp", System.currentTimeMillis());
        errorResponse.put("status", 401);

        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setCharacterEncoding("UTF-8");
        response.getWriter().write(objectMapper.writeValueAsString(errorResponse));
    }
}