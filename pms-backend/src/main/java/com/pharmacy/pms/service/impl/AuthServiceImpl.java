package com.pharmacy.pms.service.impl;

import com.pharmacy.pms.dto.request.LoginRequest;
import com.pharmacy.pms.dto.response.LoginResponse;
import com.pharmacy.pms.model.entity.User;
import com.pharmacy.pms.repository.UserRepository;
import com.pharmacy.pms.security.JwtTokenProvider;
import com.pharmacy.pms.security.PmsUserPrincipal;
import com.pharmacy.pms.service.AuthService;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class AuthServiceImpl implements AuthService {

    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider tokenProvider;
    private final UserRepository userRepository;

    public AuthServiceImpl(AuthenticationManager authenticationManager, JwtTokenProvider tokenProvider, UserRepository userRepository) {
        this.authenticationManager = authenticationManager;
        this.tokenProvider = tokenProvider;
        this.userRepository = userRepository;
    }

    @Override
    public LoginResponse login(LoginRequest request) {
        User userRecord = userRepository.findByUsername(request.getUsername())
                .or(() -> userRepository.findByEmail(request.getUsername()))
                .orElse(null);

        if (userRecord != null && !userRecord.isActive()) {
            throw new DisabledException("Your staff account has been deactivated or suspended by the administrator. Please contact pharmacy management.");
        }

        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getUsername(), request.getPassword())
        );

        SecurityContextHolder.getContext().setAuthentication(authentication);
        String jwt = tokenProvider.generateToken(authentication);

        PmsUserPrincipal principal = (PmsUserPrincipal) authentication.getPrincipal();
        User user = userRepository.findById(principal.getId()).orElseThrow();

        List<String> roles = user.getRoles().stream()
                .map(r -> r.getName().name())
                .toList();

        List<String> permissions = principal.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .filter(auth -> !auth.startsWith("ROLE_"))
                .toList();

        return LoginResponse.builder()
                .token(jwt)
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .branchName(principal.getBranchName())
                .roles(roles)
                .permissions(permissions)
                .build();
    }

    @Override
    public LoginResponse refreshToken(PmsUserPrincipal principal) {
        if (principal == null) {
            throw new RuntimeException("Unauthenticated session cannot be refreshed");
        }
        User user = userRepository.findById(principal.getId())
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (!user.isActive()) {
            throw new RuntimeException("User account is inactive or deactivated");
        }

        UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                principal, null, principal.getAuthorities()
        );
        String jwt = tokenProvider.generateToken(authentication);

        List<String> roles = user.getRoles().stream()
                .map(r -> r.getName().name())
                .toList();

        List<String> permissions = principal.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .filter(auth -> !auth.startsWith("ROLE_"))
                .toList();

        return LoginResponse.builder()
                .token(jwt)
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .branchName(principal.getBranchName())
                .roles(roles)
                .permissions(permissions)
                .build();
    }
}
