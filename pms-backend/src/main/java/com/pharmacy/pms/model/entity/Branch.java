package com.pharmacy.pms.model.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;

@Entity
@Table(name = "branches")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Branch extends BaseEntity {

    @Column(name = "name", nullable = false, length = 100)
    private String name;

    @Column(name = "code", nullable = false, unique = true, length = 30)
    private String code;

    @Column(name = "address", columnDefinition = "TEXT")
    private String address;

    @Column(name = "phone", length = 30)
    private String phone;

    @Column(name = "license_number", length = 50)
    private String licenseNumber;

    @Column(name = "is_main_warehouse", nullable = false)
    private boolean isMainWarehouse = false;

    public Branch() {}

    public Branch(String name, String code, String address, String phone, String licenseNumber, boolean isMainWarehouse) {
        this.name = name;
        this.code = code;
        this.address = address;
        this.phone = phone;
        this.licenseNumber = licenseNumber;
        this.isMainWarehouse = isMainWarehouse;
    }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }

    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public String getLicenseNumber() { return licenseNumber; }
    public void setLicenseNumber(String licenseNumber) { this.licenseNumber = licenseNumber; }

    public boolean isMainWarehouse() { return isMainWarehouse; }
    public void setMainWarehouse(boolean mainWarehouse) { isMainWarehouse = mainWarehouse; }
}
