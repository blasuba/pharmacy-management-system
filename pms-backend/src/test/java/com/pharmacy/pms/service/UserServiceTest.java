package com.pharmacy.pms.service;

import com.pharmacy.pms.dto.request.UserCreateRequest;
import com.pharmacy.pms.dto.response.PageResponse;
import com.pharmacy.pms.dto.response.UserResponse;
import com.pharmacy.pms.exception.BadRequestException;
import com.pharmacy.pms.exception.ResourceNotFoundException;
import com.pharmacy.pms.model.entity.Branch;
import com.pharmacy.pms.model.entity.Role;
import com.pharmacy.pms.model.entity.User;
import com.pharmacy.pms.model.enums.UserRole;
import com.pharmacy.pms.repository.BranchRepository;
import com.pharmacy.pms.repository.RoleRepository;
import com.pharmacy.pms.repository.UserRepository;
import com.pharmacy.pms.service.impl.UserServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.List;
import java.util.Optional;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private RoleRepository roleRepository;

    @Mock
    private BranchRepository branchRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @InjectMocks
    private UserServiceImpl userService;

    private User sampleUser;
    private Role adminRole;
    private Branch branch;

    @BeforeEach
    void setUp() {
        branch = new Branch("Main Branch", "BR01", "Addis Ababa", "+251-911", "LIC123", true);
        adminRole = new Role(UserRole.ROLE_OWNER, "Owner", "Full access");

        sampleUser = new User();
        sampleUser.setUsername("testadmin");
        sampleUser.setEmail("admin@test.com");
        sampleUser.setPassword("encoded");
        sampleUser.setFirstName("Test");
        sampleUser.setLastName("Admin");
        sampleUser.setBranch(branch);
        sampleUser.setRoles(Set.of(adminRole));
        sampleUser.setActive(true);
    }

    @Test
    void testGetAllUsers() {
        Pageable pageable = PageRequest.of(0, 10);
        when(userRepository.searchUsers(null, pageable))
                .thenReturn(new PageImpl<>(List.of(sampleUser), pageable, 1));

        PageResponse<UserResponse> res = userService.getAllUsers(null, pageable);
        assertEquals(1, res.getTotalElements());
        assertEquals("testadmin", res.getContent().get(0).getUsername());
    }

    @Test
    void testGetUserById_Found() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(sampleUser));
        UserResponse res = userService.getUserById(1L);
        assertNotNull(res);
        assertEquals("testadmin", res.getUsername());
    }

    @Test
    void testGetUserById_NotFound() {
        when(userRepository.findById(99L)).thenReturn(Optional.empty());
        assertThrows(ResourceNotFoundException.class, () -> userService.getUserById(99L));
    }

    @Test
    void testCreateUser_UsernameExists() {
        UserCreateRequest req = new UserCreateRequest();
        req.setUsername("testadmin");
        when(userRepository.existsByUsername("testadmin")).thenReturn(true);

        assertThrows(BadRequestException.class, () -> userService.createUser(req));
    }

    @Test
    void testCreateUser_Success() {
        UserCreateRequest req = new UserCreateRequest();
        req.setUsername("newuser");
        req.setEmail("new@user.com");
        req.setPassword("Password@123");
        req.setFirstName("New");
        req.setLastName("User");
        req.setRoles(Set.of("ROLE_OWNER"));

        when(userRepository.existsByUsername("newuser")).thenReturn(false);
        when(userRepository.existsByEmail("new@user.com")).thenReturn(false);
        when(passwordEncoder.encode("Password@123")).thenReturn("encoded");
        when(roleRepository.findByName(UserRole.ROLE_OWNER)).thenReturn(Optional.of(adminRole));
        when(branchRepository.findAll()).thenReturn(List.of(branch));
        when(userRepository.save(any(User.class))).thenReturn(sampleUser);

        UserResponse res = userService.createUser(req);
        assertNotNull(res);
    }

    @Test
    void testDeleteUser_AdminThrowsError() {
        User rootAdmin = new User();
        rootAdmin.setUsername("admin");
        when(userRepository.findById(1L)).thenReturn(Optional.of(rootAdmin));

        assertThrows(BadRequestException.class, () -> userService.deleteUser(1L));
    }
}
