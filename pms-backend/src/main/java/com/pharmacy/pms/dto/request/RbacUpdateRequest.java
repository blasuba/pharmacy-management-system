package com.pharmacy.pms.dto.request;

import jakarta.validation.constraints.NotNull;
import java.util.List;
import java.util.Map;

public class RbacUpdateRequest {

    @NotNull(message = "Role permissions map cannot be null")
    private Map<String, List<String>> rolePermissions;

    public RbacUpdateRequest() {}

    public Map<String, List<String>> getRolePermissions() { return rolePermissions; }
    public void setRolePermissions(Map<String, List<String>> rolePermissions) { this.rolePermissions = rolePermissions; }
}
