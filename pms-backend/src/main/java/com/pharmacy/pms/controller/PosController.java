package com.pharmacy.pms.controller;

import com.pharmacy.pms.dto.request.PosCheckoutRequest;
import com.pharmacy.pms.dto.request.SaleRefundRequest;
import com.pharmacy.pms.dto.response.ApiResponse;
import com.pharmacy.pms.dto.response.PosReceiptResponse;
import com.pharmacy.pms.model.entity.Sale;
import com.pharmacy.pms.model.enums.PaymentMethod;
import com.pharmacy.pms.security.PmsUserPrincipal;
import com.pharmacy.pms.service.PosService;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

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

    @GetMapping("/sales")
    public ResponseEntity<ApiResponse<List<Sale>>> getAllSales(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(required = false) PaymentMethod paymentMethod) {
        List<Sale> sales = posService.getAllSales(startDate, endDate, paymentMethod);
        return ResponseEntity.ok(ApiResponse.success(sales));
    }

    @PostMapping("/refund")
    @PreAuthorize("hasAuthority('ROLE_OWNER') or hasAuthority('ROLE_PHARMACIST') or hasAuthority('ROLE_CASHIER_ACCOUNTANT')")
    public ResponseEntity<ApiResponse<PosReceiptResponse>> processRefund(
            @Valid @RequestBody SaleRefundRequest request,
            @AuthenticationPrincipal PmsUserPrincipal principal) {
        PosReceiptResponse receipt = posService.processRefund(request, principal.getId());
        return ResponseEntity.ok(ApiResponse.success(receipt, "Item refund processed successfully"));
    }
}
