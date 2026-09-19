package com.pharmacy.pms.service;

import com.pharmacy.pms.dto.response.DashboardSummaryResponse;
import java.time.LocalDate;
import java.util.Map;

public interface ReportService {
    DashboardSummaryResponse getDashboardSummary();
    Map<String, Object> getProfitAndLossReport(LocalDate startDate, LocalDate endDate);
    Map<String, Object> getInventoryValuationReport();
    Map<String, Object> getExpiryRiskReport();
    Map<String, Object> getCashierShiftSummary(Long cashierId);
    byte[] generateSalesPdfReport(LocalDate startDate, LocalDate endDate);
}
