package com.pharmacy.pms.controller;

import com.pharmacy.pms.dto.request.CashTransactionRequest;
import com.pharmacy.pms.dto.request.CloseShiftRequest;
import com.pharmacy.pms.dto.request.OpenShiftRequest;
import com.pharmacy.pms.dto.response.ApiResponse;
import com.pharmacy.pms.dto.response.CashShiftResponse;
import com.pharmacy.pms.model.entity.CashTransaction;
import com.pharmacy.pms.security.PmsUserPrincipal;
import com.pharmacy.pms.service.CashManagementService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/cash/shifts")
public class CashManagementController {

    private final CashManagementService cashService;

    public CashManagementController(CashManagementService cashService) {
        this.cashService = cashService;
    }

    @PostMapping("/open")
    public ResponseEntity<ApiResponse<CashShiftResponse>> openShift(
            @Valid @RequestBody OpenShiftRequest request,
            @AuthenticationPrincipal PmsUserPrincipal principal) {
        CashShiftResponse response = cashService.openShift(request, principal.getId());
        return ResponseEntity.ok(ApiResponse.success(response, "Register shift opened successfully"));
    }

    @GetMapping("/current")
    public ResponseEntity<ApiResponse<CashShiftResponse>> getCurrentShift(
            @AuthenticationPrincipal PmsUserPrincipal principal) {
        CashShiftResponse response = cashService.getCurrentShift(principal.getId());
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping("/transaction")
    public ResponseEntity<ApiResponse<CashShiftResponse>> recordCashTransaction(
            @Valid @RequestBody CashTransactionRequest request,
            @AuthenticationPrincipal PmsUserPrincipal principal) {
        CashShiftResponse response = cashService.recordCashTransaction(request, principal.getId());
        return ResponseEntity.ok(ApiResponse.success(response, "Cash transaction recorded successfully"));
    }

    @PostMapping("/close")
    public ResponseEntity<ApiResponse<CashShiftResponse>> closeShift(
            @Valid @RequestBody CloseShiftRequest request,
            @AuthenticationPrincipal PmsUserPrincipal principal) {
        CashShiftResponse response = cashService.closeShift(request, principal.getId());
        return ResponseEntity.ok(ApiResponse.success(response, "Register shift closed and reconciled"));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<CashShiftResponse>>> getAllShifts() {
        return ResponseEntity.ok(ApiResponse.success(cashService.getAllShifts()));
    }

    @GetMapping("/{shiftId}/transactions")
    public ResponseEntity<ApiResponse<List<CashTransaction>>> getShiftTransactions(@PathVariable Long shiftId) {
        return ResponseEntity.ok(ApiResponse.success(cashService.getShiftTransactions(shiftId)));
    }
}
