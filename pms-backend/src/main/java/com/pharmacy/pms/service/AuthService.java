package com.pharmacy.pms.service;

import com.pharmacy.pms.dto.request.LoginRequest;
import com.pharmacy.pms.dto.response.LoginResponse;
import com.pharmacy.pms.security.PmsUserPrincipal;

public interface AuthService {
    LoginResponse login(LoginRequest request);
    LoginResponse refreshToken(PmsUserPrincipal principal);
}
