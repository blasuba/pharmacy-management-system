package com.pharmacy.pms.controller;

import com.pharmacy.pms.dto.request.StockAdjustmentRequest;
import com.pharmacy.pms.dto.response.ApiResponse;
import com.pharmacy.pms.model.entity.StockMovement;
import com.pharmacy.pms.security.PmsUserPrincipal;
import com.pharmacy.pms.service.InventoryService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/inventory")
public class InventoryController {

    private final InventoryService inventoryService;

    public InventoryController(InventoryService inventoryService) {
        this.inventoryService = inventoryService;
    }

    @PostMapping("/adjust")
    @PreAuthorize("hasAuthority('ROLE_OWNER') or hasAuthority('ROLE_PHARMACIST') or hasAuthority('INVENTORY_ADJUST')")
    public ResponseEntity<ApiResponse<StockMovement>> adjustStock(
            @Valid @RequestBody StockAdjustmentRequest request,
            @AuthenticationPrincipal PmsUserPrincipal principal) {
        StockMovement movement = inventoryService.adjustStock(request, principal.getId());
        return ResponseEntity.ok(ApiResponse.success(movement, "Stock adjusted and logged in ledger"));
    }

    @GetMapping("/movements")
    public ResponseEntity<ApiResponse<List<StockMovement>>> getRecentMovements() {
        return ResponseEntity.ok(ApiResponse.success(inventoryService.getRecentMovements()));
    }
}
