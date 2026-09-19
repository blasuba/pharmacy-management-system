package com.pharmacy.pms.service;

import com.pharmacy.pms.dto.request.LoginRequest;
import com.pharmacy.pms.dto.response.LoginResponse;

public interface AuthService {
    LoginResponse login(LoginRequest request);
}
