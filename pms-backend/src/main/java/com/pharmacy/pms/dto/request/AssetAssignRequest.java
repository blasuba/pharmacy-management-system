package com.pharmacy.pms.dto.request;

import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;

public class AssetAssignRequest {

    @NotNull(message = "User ID to assign to is required")
    private Long userId;

    private LocalDate assignedDate;

    private String notes;

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }

    public LocalDate getAssignedDate() { return assignedDate; }
    public void setAssignedDate(LocalDate assignedDate) { this.assignedDate = assignedDate; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
}
