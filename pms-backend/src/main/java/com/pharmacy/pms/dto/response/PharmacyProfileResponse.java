package com.pharmacy.pms.dto.response;

import com.pharmacy.pms.model.entity.PharmacyProfile;
import java.time.LocalDate;
import java.time.LocalDateTime;

public class PharmacyProfileResponse {
    private Long id;
    private String name;
    private String legalName;
    private String logoPath;
    private String address;
    private String phone;
    private String email;
    private String tin;
    private String licenseNumber;
    private LocalDate licenseExpiry;
    private String website;
    private LocalDateTime updatedAt;

    public PharmacyProfileResponse() {}

    public PharmacyProfileResponse(PharmacyProfile entity) {
        if (entity != null) {
            this.id = entity.getId();
            this.name = entity.getName();
            this.legalName = entity.getLegalName();
            this.logoPath = entity.getLogoPath();
            this.address = entity.getAddress();
            this.phone = entity.getPhone();
            this.email = entity.getEmail();
            this.tin = entity.getTin();
            this.licenseNumber = entity.getLicenseNumber();
            this.licenseExpiry = entity.getLicenseExpiry();
            this.website = entity.getWebsite();
            this.updatedAt = entity.getUpdatedAt() != null ? entity.getUpdatedAt() : entity.getCreatedAt();
        }
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getLegalName() { return legalName; }
    public void setLegalName(String legalName) { this.legalName = legalName; }
    public String getLogoPath() { return logoPath; }
    public void setLogoPath(String logoPath) { this.logoPath = logoPath; }
    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }
    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getTin() { return tin; }
    public void setTin(String tin) { this.tin = tin; }
    public String getLicenseNumber() { return licenseNumber; }
    public void setLicenseNumber(String licenseNumber) { this.licenseNumber = licenseNumber; }
    public LocalDate getLicenseExpiry() { return licenseExpiry; }
    public void setLicenseExpiry(LocalDate licenseExpiry) { this.licenseExpiry = licenseExpiry; }
    public String getWebsite() { return website; }
    public void setWebsite(String website) { this.website = website; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
