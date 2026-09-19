package com.pharmacy.pms.service;

import com.pharmacy.pms.dto.request.UserCreateRequest;
import com.pharmacy.pms.dto.request.UserUpdateRequest;
import com.pharmacy.pms.dto.response.PageResponse;
import com.pharmacy.pms.dto.response.RoleResponse;
import com.pharmacy.pms.dto.response.UserResponse;
import com.pharmacy.pms.model.entity.Branch;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface UserService {
    PageResponse<UserResponse> getAllUsers(String query, Pageable pageable);
    UserResponse getUserById(Long id);
    UserResponse createUser(UserCreateRequest request);
    UserResponse updateUser(Long id, UserUpdateRequest request);
    void deleteUser(Long id);
    UserResponse toggleUserStatus(Long id);
    List<RoleResponse> getAllRoles();
    List<Branch> getAllBranches();
}
