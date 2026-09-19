package com.pharmacy.pms.controller;

import com.pharmacy.pms.dto.request.PosCheckoutRequest;
import com.pharmacy.pms.dto.response.ApiResponse;
import com.pharmacy.pms.dto.response.PosReceiptResponse;
import com.pharmacy.pms.security.PmsUserPrincipal;
import com.pharmacy.pms.service.PosService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/pos")
public class PosController {

    private final PosService posService;

    public PosController(PosService posService) {
        this.posService = posService;
    }

    @PostMapping("/checkout")
    @PreAuthorize("hasAuthority('ROLE_OWNER') or hasAuthority('ROLE_PHARMACIST') or hasAuthority('ROLE_CASHIER_ACCOUNTANT') or hasAuthority('POS_CHECKOUT')")
    public ResponseEntity<ApiResponse<PosReceiptResponse>> checkout(
            @Valid @RequestBody PosCheckoutRequest request,
            @AuthenticationPrincipal PmsUserPrincipal principal) {
        PosReceiptResponse receipt = posService.processCheckout(request, principal.getId());
        return ResponseEntity.ok(ApiResponse.success(receipt, "Checkout completed successfully"));
    }

    @GetMapping("/receipt/{invoiceNumber}")
    public ResponseEntity<ApiResponse<PosReceiptResponse>> getReceipt(@PathVariable String invoiceNumber) {
        return ResponseEntity.ok(ApiResponse.success(posService.getReceiptByInvoice(invoiceNumber)));
    }
}
