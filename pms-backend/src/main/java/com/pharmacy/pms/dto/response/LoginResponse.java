package com.pharmacy.pms.dto.response;

import java.util.List;

public class LoginResponse {
    private String token;
    private String type = "Bearer";
    private Long id;
    private String username;
    private String email;
    private String fullName;
    private String branchName;
    private List<String> roles;
    private List<String> permissions;

    public LoginResponse() {
        // Default constructor
    }

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private final LoginResponse response = new LoginResponse();

        public Builder token(String token) { response.token = token; return this; }
        public Builder type(String type) { response.type = type; return this; }
        public Builder id(Long id) { response.id = id; return this; }
        public Builder username(String username) { response.username = username; return this; }
        public Builder email(String email) { response.email = email; return this; }
        public Builder fullName(String fullName) { response.fullName = fullName; return this; }
        public Builder branchName(String branchName) { response.branchName = branchName; return this; }
        public Builder roles(List<String> roles) { response.roles = roles; return this; }
        public Builder permissions(List<String> permissions) { response.permissions = permissions; return this; }

        public LoginResponse build() {
            return response;
        }
    }

    public String getToken() { return token; }
    public String getType() { return type; }
    public Long getId() { return id; }
    public String getUsername() { return username; }
    public String getEmail() { return email; }
    public String getFullName() { return fullName; }
    public String getBranchName() { return branchName; }
    public List<String> getRoles() { return roles; }
    public List<String> getPermissions() { return permissions; }
}
