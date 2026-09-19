package com.pharmacy.pms.controller;

import com.pharmacy.pms.dto.response.ApiResponse;
import com.pharmacy.pms.model.entity.PurchaseOrder;
import com.pharmacy.pms.security.PmsUserPrincipal;
import com.pharmacy.pms.service.PurchaseService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/purchases")
public class PurchaseController {

    private final PurchaseService purchaseService;

    public PurchaseController(PurchaseService purchaseService) {
        this.purchaseService = purchaseService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<PurchaseOrder>>> getAllPurchaseOrders() {
        return ResponseEntity.ok(ApiResponse.success(purchaseService.getAllPurchaseOrders()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<PurchaseOrder>> getPurchaseOrderById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(purchaseService.getPurchaseOrderById(id)));
    }

    @PostMapping("/{id}/receive")
    @PreAuthorize("hasAuthority('ROLE_OWNER') or hasAuthority('ROLE_PHARMACIST') or hasAuthority('PURCHASE_RECEIVE')")
    public ResponseEntity<ApiResponse<PurchaseOrder>> receiveGoods(
            @PathVariable Long id,
            @AuthenticationPrincipal PmsUserPrincipal principal) {
        return ResponseEntity.ok(ApiResponse.success(purchaseService.receiveGoods(id, principal.getId()), "Goods received and batches created"));
    }
}
