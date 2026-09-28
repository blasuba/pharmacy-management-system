package com.pharmacy.pms.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;

public class PharmacyProfileRequest {

    @NotBlank(message = "Pharmacy Name is mandatory")
    private String name;

    @NotBlank(message = "Legal Name is mandatory")
    private String legalName;

    private String logoPath;

    @NotBlank(message = "Address is mandatory")
    private String address;

    @NotBlank(message = "Phone number is mandatory")
    private String phone;

    @NotBlank(message = "Email is mandatory")
    @Email(message = "Email must be a valid email address")
    private String email;

    @NotBlank(message = "TIN is mandatory")
    private String tin;

    @NotBlank(message = "License Number is mandatory")
    private String licenseNumber;

    @NotNull(message = "License Expiry date is mandatory")
    @Future(message = "License Expiry date must be in the future")
    private LocalDate licenseExpiry;

    private String website;

    public PharmacyProfileRequest() {}

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
}
