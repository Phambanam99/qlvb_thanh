package com.managementcontent.security;

import com.managementcontent.model.User;
import com.managementcontent.model.enums.UserStatus;
import com.managementcontent.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;

import org.springframework.stereotype.Service;

import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserDetailsServiceImpl implements UserDetailsService {

    private final UserRepository userRepository;

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        User user = userRepository.findByName(username)
                .orElseThrow(() -> new UsernameNotFoundException("User not found with username: " + username));

        // Check if user is pending approval
        if (user.getUserStatus() == UserStatus.PENDING_APPROVAL) {
            throw new DisabledException("Account is pending approval by an administrator");
        }

        // Access fields directly if getters are causing issues
        Set<SimpleGrantedAuthority> authorities = null;
        if (user.getRoles() != null) {
            authorities = user.getRoles().stream()
                    .map(role -> new SimpleGrantedAuthority(role.getName()))
                    .collect(Collectors.toSet());
        }

        return new org.springframework.security.core.userdetails.User(
                user.getName(), // Use getName() instead of getUsername()
                user.getPass(), // Use getPass() instead of getPassword()
                user.getStatus() != null && user.getStatus() == 1, // Check for null and then verify status
                true, // Account non-expired
                true, // Credentials non-expired
                true, // Account non-locked
                authorities != null ? authorities : Set.of());
    }
}