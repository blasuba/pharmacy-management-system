package com.pharmacy.pms.service.impl;

import com.pharmacy.pms.dto.request.UserCreateRequest;
import com.pharmacy.pms.dto.request.UserUpdateRequest;
import com.pharmacy.pms.dto.response.PageResponse;
import com.pharmacy.pms.dto.response.RoleResponse;
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
import com.pharmacy.pms.service.UserService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class UserServiceImpl implements UserService {

    private static final String USER_NOT_FOUND = "User not found with id: ";

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final BranchRepository branchRepository;
    private final PasswordEncoder passwordEncoder;

    public UserServiceImpl(UserRepository userRepository, RoleRepository roleRepository,
                           BranchRepository branchRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.branchRepository = branchRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<UserResponse> getAllUsers(String query, Pageable pageable) {
        Page<User> page = userRepository.searchUsers(query, pageable);
        List<UserResponse> content = page.getContent().stream()
                .map(this::mapToResponse)
                .toList();

        return new PageResponse<>(
                content,
                page.getNumber(),
                page.getSize(),
                page.getTotalElements(),
                page.getTotalPages(),
                page.isLast()
        );
    }

    @Override
    @Transactional(readOnly = true)
    public UserResponse getUserById(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(USER_NOT_FOUND + id));
        return mapToResponse(user);
    }

    @Override
    @Transactional
    public UserResponse createUser(UserCreateRequest request) {
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new BadRequestException("Username is already taken: " + request.getUsername());
        }
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new BadRequestException("Email is already in use: " + request.getEmail());
        }

        User user = new User();
        user.setUsername(request.getUsername().trim());
        user.setEmail(request.getEmail().trim().toLowerCase());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setFirstName(request.getFirstName().trim());
        user.setLastName(request.getLastName().trim());
        user.setPhone(request.getPhone());
        user.setActive(true);

        if (request.getBranchId() != null) {
            Branch branch = branchRepository.findById(request.getBranchId())
                    .orElseThrow(() -> new ResourceNotFoundException("Branch not found with id: " + request.getBranchId()));
            user.setBranch(branch);
        } else {
            // Default to first available branch if any exists
            List<Branch> branches = branchRepository.findAll();
            if (!branches.isEmpty()) {
                user.setBranch(branches.get(0));
            }
        }

        Set<Role> roles = resolveRoles(request.getRoles());
        user.setRoles(roles);

        User savedUser = userRepository.save(user);
        return mapToResponse(savedUser);
    }

    @Override
    @Transactional
    public UserResponse updateUser(Long id, UserUpdateRequest request) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(USER_NOT_FOUND + id));

        if (!user.getEmail().equalsIgnoreCase(request.getEmail()) && userRepository.existsByEmail(request.getEmail())) {
            throw new BadRequestException("Email is already in use by another account: " + request.getEmail());
        }

        user.setEmail(request.getEmail().trim().toLowerCase());
        user.setFirstName(request.getFirstName().trim());
        user.setLastName(request.getLastName().trim());
        user.setPhone(request.getPhone());

        if (request.getActive() != null) {
            user.setActive(request.getActive());
        }

        if (request.getPassword() != null && !request.getPassword().trim().isEmpty()) {
            if (request.getPassword().trim().length() < 6) {
                throw new BadRequestException("Password must be at least 6 characters");
            }
            user.setPassword(passwordEncoder.encode(request.getPassword().trim()));
        }

        if (request.getBranchId() != null) {
            Branch branch = branchRepository.findById(request.getBranchId())
                    .orElseThrow(() -> new ResourceNotFoundException("Branch not found with id: " + request.getBranchId()));
            user.setBranch(branch);
        }

        if (request.getRoles() != null && !request.getRoles().isEmpty()) {
            Set<Role> roles = resolveRoles(request.getRoles());
            user.setRoles(roles);
        }

        User updatedUser = userRepository.save(user);
        return mapToResponse(updatedUser);
    }

    @Override
    @Transactional
    public void deleteUser(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(USER_NOT_FOUND + id));

        // Prevent deleting the last active admin
        if ("admin".equalsIgnoreCase(user.getUsername())) {
            throw new BadRequestException("The primary administrator account cannot be deleted.");
        }

        userRepository.delete(user);
    }

    @Override
    @Transactional
    public UserResponse toggleUserStatus(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(USER_NOT_FOUND + id));

        if ("admin".equalsIgnoreCase(user.getUsername()) && user.isActive()) {
            throw new BadRequestException("The primary administrator account cannot be deactivated.");
        }

        user.setActive(!user.isActive());
        return mapToResponse(userRepository.save(user));
    }

    @Override
    @Transactional(readOnly = true)
    public List<RoleResponse> getAllRoles() {
        return roleRepository.findAll().stream()
                .map(r -> new RoleResponse(r.getId(), r.getName().name(), r.getDescription()))
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<Branch> getAllBranches() {
        return branchRepository.findAll();
    }

    private Set<Role> resolveRoles(Set<String> roleNames) {
        Set<Role> roles = new HashSet<>();
        for (String roleName : roleNames) {
            try {
                UserRole enumRole = UserRole.valueOf(roleName.toUpperCase().trim());
                Role role = roleRepository.findByName(enumRole)
                        .orElseThrow(() -> new ResourceNotFoundException("Role not found: " + roleName));
                roles.add(role);
            } catch (IllegalArgumentException e) {
                throw new BadRequestException("Invalid role identifier: " + roleName);
            }
        }
        return roles;
    }

    private UserResponse mapToResponse(User user) {
        UserResponse res = new UserResponse();
        res.setId(user.getId());
        res.setUsername(user.getUsername());
        res.setEmail(user.getEmail());
        res.setFirstName(user.getFirstName());
        res.setLastName(user.getLastName());
        res.setFullName(user.getFullName());
        res.setPhone(user.getPhone());
        res.setActive(user.isActive());
        res.setCreatedAt(user.getCreatedAt());
        res.setUpdatedAt(user.getUpdatedAt());

        if (user.getBranch() != null) {
            res.setBranchId(user.getBranch().getId());
            res.setBranchName(user.getBranch().getName());
        }

        if (user.getRoles() != null) {
            res.setRoles(user.getRoles().stream()
                    .map(r -> r.getName().name())
                    .collect(Collectors.toSet()));
        }

        return res;
    }
}
