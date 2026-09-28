package com.pharmacy.pms.security;

import com.pharmacy.pms.model.entity.User;
import com.pharmacy.pms.model.enums.UserRole;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.HashSet;
import java.util.Set;

public class PmsUserPrincipal implements UserDetails {

    private final Long id;
    private final String username;
    private final String email;
    private final String password;
    private final String fullName;
    private final String branchName;
    private final boolean active;
    private final Collection<? extends GrantedAuthority> authorities;

    public static Builder builder() {
        return new Builder();
    }

    private PmsUserPrincipal(Builder builder) {
        this.id = builder.id;
        this.username = builder.username;
        this.email = builder.email;
        this.password = builder.password;
        this.fullName = builder.fullName;
        this.branchName = builder.branchName;
        this.active = builder.active;
        this.authorities = builder.authorities;
    }

    public static class Builder {
        private Long id;
        private String username;
        private String email;
        private String password;
        private String fullName;
        private String branchName;
        private boolean active;
        private Collection<? extends GrantedAuthority> authorities;

        public Builder id(Long id) { this.id = id; return this; }
        public Builder username(String username) { this.username = username; return this; }
        public Builder email(String email) { this.email = email; return this; }
        public Builder password(String password) { this.password = password; return this; }
        public Builder fullName(String fullName) { this.fullName = fullName; return this; }
        public Builder branchName(String branchName) { this.branchName = branchName; return this; }
        public Builder active(boolean active) { this.active = active; return this; }
        public Builder authorities(Collection<? extends GrantedAuthority> authorities) { this.authorities = authorities; return this; }

        public PmsUserPrincipal build() {
            return new PmsUserPrincipal(this);
        }
    }

    public static PmsUserPrincipal create(User user) {
        Set<GrantedAuthority> authorities = new HashSet<>();
        if (user.getRoles() != null) {
            user.getRoles().forEach(role -> {
                authorities.add(new SimpleGrantedAuthority(role.getName().name()));
                if (role.getName() == UserRole.ROLE_OWNER) {
                    authorities.add(new SimpleGrantedAuthority("ROLE_SUPER_ADMIN"));
                    authorities.add(new SimpleGrantedAuthority("SUPER_ADMIN"));
                    authorities.add(new SimpleGrantedAuthority("SETTINGS_MANAGE"));
                    authorities.add(new SimpleGrantedAuthority("USER_MANAGE"));
                }
                if (role.getPermissions() != null) {
                    role.getPermissions().forEach(permission ->
                        authorities.add(new SimpleGrantedAuthority(permission.getCode()))
                    );
                }
            });
        }

        String branchName = user.getBranch() != null ? user.getBranch().getName() : "Central Branch";

        return PmsUserPrincipal.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .password(user.getPassword())
                .fullName(user.getFullName())
                .branchName(branchName)
                .active(user.isActive())
                .authorities(authorities)
                .build();
    }

    public Long getId() { return id; }
    public String getEmail() { return email; }
    public String getFullName() { return fullName; }
    public String getBranchName() { return branchName; }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() { return authorities; }

    @Override
    public String getPassword() { return password; }

    @Override
    public String getUsername() { return username; }

    @Override
    public boolean isAccountNonExpired() { return true; }

    @Override
    public boolean isAccountNonLocked() { return true; }

    @Override
    public boolean isCredentialsNonExpired() { return true; }

    @Override
    public boolean isEnabled() { return active; }
}
