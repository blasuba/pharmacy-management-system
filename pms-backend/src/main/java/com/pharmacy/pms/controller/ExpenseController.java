package com.pharmacy.pms.controller;

import com.pharmacy.pms.dto.request.ExpenseCreateRequest;
import com.pharmacy.pms.dto.response.ApiResponse;
import com.pharmacy.pms.model.entity.Expense;
import com.pharmacy.pms.model.enums.ExpenseCategory;
import com.pharmacy.pms.security.PmsUserPrincipal;
import com.pharmacy.pms.service.ExpenseService;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/expenses")
public class ExpenseController {

    private final ExpenseService expenseService;

    public ExpenseController(ExpenseService expenseService) {
        this.expenseService = expenseService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<Expense>>> getAllExpenses(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(required = false) ExpenseCategory category) {
        return ResponseEntity.ok(ApiResponse.success(expenseService.getAllExpenses(startDate, endDate, category)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Expense>> getExpenseById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(expenseService.getExpenseById(id)));
    }

    @GetMapping("/summary")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getExpenseSummary(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        return ResponseEntity.ok(ApiResponse.success(expenseService.getExpenseSummary(startDate, endDate)));
    }

    @PostMapping
    @PreAuthorize("hasAuthority('ROLE_OWNER') or hasAuthority('ROLE_PHARMACIST') or hasAuthority('ROLE_CASHIER') or hasAuthority('REPORT_PROFIT_VIEW')")
    public ResponseEntity<ApiResponse<Expense>> createExpense(
            @Valid @RequestBody ExpenseCreateRequest request,
            @AuthenticationPrincipal PmsUserPrincipal principal) {
        Expense created = expenseService.createExpense(request, principal != null ? principal.getId() : null);
        return ResponseEntity.ok(ApiResponse.success(created, "Expense recorded successfully"));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('ROLE_OWNER') or hasAuthority('ROLE_PHARMACIST') or hasAuthority('REPORT_PROFIT_VIEW')")
    public ResponseEntity<ApiResponse<Expense>> updateExpense(
            @PathVariable Long id,
            @Valid @RequestBody ExpenseCreateRequest request,
            @AuthenticationPrincipal PmsUserPrincipal principal) {
        Expense updated = expenseService.updateExpense(id, request, principal != null ? principal.getId() : null);
        return ResponseEntity.ok(ApiResponse.success(updated, "Expense updated successfully"));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('ROLE_OWNER') or hasAuthority('REPORT_PROFIT_VIEW')")
    public ResponseEntity<ApiResponse<Void>> deleteExpense(
            @PathVariable Long id,
            @AuthenticationPrincipal PmsUserPrincipal principal) {
        expenseService.deleteExpense(id, principal != null ? principal.getId() : null);
        return ResponseEntity.ok(ApiResponse.success(null, "Expense deleted successfully"));
    }
}
