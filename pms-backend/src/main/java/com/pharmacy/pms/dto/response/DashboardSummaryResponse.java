package com.pharmacy.pms.dto.response;

import java.math.BigDecimal;

public class DashboardSummaryResponse {
    private BigDecimal todayRevenue;
    private BigDecimal todayProfit;
    private int todaySalesCount;
    private int lowStockItemsCount;
    private int expiringSoonBatchesCount;
    private int expiredBatchesCount;
    private int totalDrugsCount;

    public DashboardSummaryResponse() {}

    public DashboardSummaryResponse(BigDecimal todayRevenue, BigDecimal todayProfit, int todaySalesCount, int lowStockItemsCount, int expiringSoonBatchesCount, int expiredBatchesCount, int totalDrugsCount) {
        this.todayRevenue = todayRevenue;
        this.todayProfit = todayProfit;
        this.todaySalesCount = todaySalesCount;
        this.lowStockItemsCount = lowStockItemsCount;
        this.expiringSoonBatchesCount = expiringSoonBatchesCount;
        this.expiredBatchesCount = expiredBatchesCount;
        this.totalDrugsCount = totalDrugsCount;
    }

    public BigDecimal getTodayRevenue() { return todayRevenue; }
    public BigDecimal getTodayProfit() { return todayProfit; }
    public int getTodaySalesCount() { return todaySalesCount; }
    public int getLowStockItemsCount() { return lowStockItemsCount; }
    public int getExpiringSoonBatchesCount() { return expiringSoonBatchesCount; }
    public int getExpiredBatchesCount() { return expiredBatchesCount; }
    public int getTotalDrugsCount() { return totalDrugsCount; }
}
