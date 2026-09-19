package com.pharmacy.pms.model.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "permissions")
public class Permission extends BaseEntity {

    @Column(name = "code", nullable = false, unique = true, length = 100)
    private String code;

    @Column(name = "description", length = 255)
    private String description;

    @Column(name = "module", length = 50)
    private String module;

    public Permission() {}

    public Permission(String code, String description, String module) {
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
