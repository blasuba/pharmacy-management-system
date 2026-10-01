package com.pharmacy.pms.controller;

import com.pharmacy.pms.dto.request.LoginRequest;
import com.pharmacy.pms.dto.response.ApiResponse;
import com.pharmacy.pms.dto.response.LoginResponse;
import com.pharmacy.pms.model.entity.PharmacyProfile;
import com.pharmacy.pms.repository.PharmacyProfileRepository;
import com.pharmacy.pms.security.PmsUserPrincipal;
import com.pharmacy.pms.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/auth")
public class AuthController {

    private final AuthService authService;
    private final PharmacyProfileRepository profileRepository;

    public AuthController(AuthService authService, PharmacyProfileRepository profileRepository) {
        this.authService = authService;
        this.profileRepository = profileRepository;
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

    /**
     * Public endpoint — no authentication required.
     * Returns minimal pharmacy branding info (name + logo) for the login page.
     */
    @GetMapping("/branding")
    public ResponseEntity<ApiResponse<Map<String, String>>> getPublicBranding() {
        Optional<PharmacyProfile> profileOpt = profileRepository.findFirstByOrderByIdAsc();
        if (profileOpt.isPresent()) {
            PharmacyProfile p = profileOpt.get();
            return ResponseEntity.ok(ApiResponse.success(Map.of(
                "name", p.getName() != null ? p.getName() : "Pharmacy Management System",
                "logoPath", p.getLogoPath() != null ? p.getLogoPath() : ""
            )));
        }
        return ResponseEntity.ok(ApiResponse.success(Map.of(
            "name", "Pharmacy Management System",
            "logoPath", ""
        )));
    }
}
