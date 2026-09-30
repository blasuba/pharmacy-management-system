package com.pharmacy.pms.controller;

import com.pharmacy.pms.dto.response.ApiResponse;
import com.pharmacy.pms.dto.response.DashboardSummaryResponse;
import com.pharmacy.pms.service.ReportService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.Map;

@RestController
@RequestMapping("/reports")
public class ReportController {

    private final ReportService reportService;

    public ReportController(ReportService reportService) {
        this.reportService = reportService;
    }

    @GetMapping("/dashboard")
    public ResponseEntity<ApiResponse<DashboardSummaryResponse>> getDashboardSummary() {
        return ResponseEntity.ok(ApiResponse.success(reportService.getDashboardSummary()));
    }

    @GetMapping("/profit-loss")
    @PreAuthorize("hasAuthority('ROLE_OWNER') or hasAuthority('REPORT_PROFIT_VIEW')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getProfitAndLoss(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        return ResponseEntity.ok(ApiResponse.success(reportService.getProfitAndLossReport(startDate, endDate)));
    }

    @GetMapping("/financial-statement")
    @PreAuthorize("hasAuthority('ROLE_OWNER') or hasAuthority('REPORT_PROFIT_VIEW')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getFinancialStatement(
            @RequestParam(required = false, defaultValue = "MONTHLY") String periodType,
            @RequestParam(required = false) Integer year,
            @RequestParam(required = false) Integer quarter,
            @RequestParam(required = false) Integer month,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        return ResponseEntity.ok(ApiResponse.success(reportService.getComprehensiveFinancialStatement(periodType, year, quarter, month, startDate, endDate)));
    }

    @GetMapping("/inventory-valuation")
    @PreAuthorize("hasAuthority('ROLE_OWNER') or hasAuthority('REPORT_PROFIT_VIEW')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getInventoryValuation() {
        return ResponseEntity.ok(ApiResponse.success(reportService.getInventoryValuationReport()));
    }

    @GetMapping("/expiry-risk")
    @PreAuthorize("hasAuthority('ROLE_OWNER') or hasAuthority('ROLE_PHARMACIST') or hasAuthority('REPORT_PROFIT_VIEW')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getExpiryRisk() {
        return ResponseEntity.ok(ApiResponse.success(reportService.getExpiryRiskReport()));
    }

    @GetMapping("/cashier-shift")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getCashierShift(
            @RequestParam(required = false) Long cashierId) {
        return ResponseEntity.ok(ApiResponse.success(reportService.getCashierShiftSummary(cashierId)));
    }

    @GetMapping("/sales/pdf")
    public ResponseEntity<byte[]> downloadSalesPdf(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        LocalDate start = startDate != null ? startDate : LocalDate.now().minusDays(30);
        LocalDate end = endDate != null ? endDate : LocalDate.now();

        byte[] pdfBytes = reportService.generateSalesPdfReport(start, end);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=sales_report.pdf")
                .contentType(MediaType.APPLICATION_PDF)
                .body(pdfBytes);
    }
}
