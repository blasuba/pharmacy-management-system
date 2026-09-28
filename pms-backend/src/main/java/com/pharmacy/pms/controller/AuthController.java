package com.pharmacy.pms.controller;

import com.pharmacy.pms.dto.request.LoginRequest;
import com.pharmacy.pms.dto.response.ApiResponse;
import com.pharmacy.pms.dto.response.LoginResponse;
import com.pharmacy.pms.security.PmsUserPrincipal;
import com.pharmacy.pms.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<LoginResponse>> login(@Valid @RequestBody LoginRequest request) {
        LoginResponse response = authService.login(request);
        return ResponseEntity.ok(ApiResponse.success(response, "Login successful"));
    }

    @PostMapping("/refresh")
    public ResponseEntity<ApiResponse<LoginResponse>> refreshToken(@AuthenticationPrincipal PmsUserPrincipal principal) {
        LoginResponse response = authService.refreshToken(principal);
        return ResponseEntity.ok(ApiResponse.success(response, "Session token refreshed"));
    }
}
