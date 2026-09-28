package com.pharmacy.pms.dto.response;

import java.util.List;
import java.util.Map;

public class RbacMatrixResponse {
    private List<PermissionDto> permissions;
    private List<RoleDto> roles;
    private Map<String, List<String>> rolePermissions;

    public RbacMatrixResponse() {}

    public RbacMatrixResponse(List<PermissionDto> permissions, List<RoleDto> roles, Map<String, List<String>> rolePermissions) {
        this.permissions = permissions;
        this.roles = roles;
        this.rolePermissions = rolePermissions;
    }

    public static class PermissionDto {
        private String code;
        private String description;
        private String module;

        public PermissionDto() {}
        public PermissionDto(String code, String description, String module) {
            this.code = code;
            this.description = description;
            this.module = module;
        }

        public String getCode() { return code; }
        public void setCode(String code) { this.code = code; }
        public String getDescription() { return description; }
        public void setDescription(String description) { this.description = description; }
        public String getModule() { return module; }
        public void setModule(String module) { this.module = module; }
    }

    public static class RoleDto {
        private String name;
        private String displayName;
        private String description;

        public RoleDto() {}
        public RoleDto(String name, String displayName, String description) {
            this.name = name;
            this.displayName = displayName;
            this.description = description;
        }

        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
        public String getDisplayName() { return displayName; }
        public void setDisplayName(String displayName) { this.displayName = displayName; }
        public String getDescription() { return description; }
        public void setDescription(String description) { this.description = description; }
    }

    public List<PermissionDto> getPermissions() { return permissions; }
    public void setPermissions(List<PermissionDto> permissions) { this.permissions = permissions; }
    public List<RoleDto> getRoles() { return roles; }
    public void setRoles(List<RoleDto> roles) { this.roles = roles; }
    public Map<String, List<String>> getRolePermissions() { return rolePermissions; }
    public void setRolePermissions(Map<String, List<String>> rolePermissions) { this.rolePermissions = rolePermissions; }
}
