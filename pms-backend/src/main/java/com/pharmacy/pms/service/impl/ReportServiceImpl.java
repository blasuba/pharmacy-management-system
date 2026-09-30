package com.pharmacy.pms.service.impl;

import com.lowagie.text.Document;
import com.lowagie.text.Element;
import com.lowagie.text.Font;
import com.lowagie.text.FontFactory;
import com.lowagie.text.PageSize;
import com.lowagie.text.Paragraph;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import com.pharmacy.pms.dto.response.DashboardSummaryResponse;
import com.pharmacy.pms.exception.ReportGenerationException;
import com.pharmacy.pms.model.entity.*;
import com.pharmacy.pms.model.enums.*;
import com.pharmacy.pms.repository.*;
import com.pharmacy.pms.service.ReportService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.*;

@Service
public class ReportServiceImpl implements ReportService {

    private final SaleRepository saleRepository;
    private final SaleItemRepository saleItemRepository;
    private final DrugBatchRepository batchRepository;
    private final DrugRepository drugRepository;
    private final ExpenseRepository expenseRepository;
    private final PurchaseOrderRepository purchaseOrderRepository;

    public ReportServiceImpl(SaleRepository saleRepository,
                             SaleItemRepository saleItemRepository,
                             DrugBatchRepository batchRepository,
                             DrugRepository drugRepository,
                             ExpenseRepository expenseRepository,
                             PurchaseOrderRepository purchaseOrderRepository) {
        this.saleRepository = saleRepository;
        this.saleItemRepository = saleItemRepository;
        this.batchRepository = batchRepository;
        this.drugRepository = drugRepository;
        this.expenseRepository = expenseRepository;
        this.purchaseOrderRepository = purchaseOrderRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public DashboardSummaryResponse getDashboardSummary() {
        LocalDateTime startOfDay = LocalDateTime.of(LocalDate.now(), LocalTime.MIN);
        LocalDateTime endOfDay = LocalDateTime.of(LocalDate.now(), LocalTime.MAX);

        List<Sale> todaySales = saleRepository.findSalesBetweenDates(startOfDay, endOfDay);
        List<SaleItem> todayItems = saleItemRepository.findSaleItemsBetweenDates(startOfDay, endOfDay);

        BigDecimal todayRevenue = todaySales.stream()
                .map(Sale::getGrandTotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal todayCost = todayItems.stream()
                .map(item -> item.getCostPriceAtSale().multiply(BigDecimal.valueOf(item.getQuantity())))
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal todayProfit = todayRevenue.subtract(todayCost);
        if (todayProfit.compareTo(BigDecimal.ZERO) < 0) {
            todayProfit = BigDecimal.ZERO;
        }

        LocalDate today = LocalDate.now();
        List<Drug> allDrugs = drugRepository.findAll();
        int lowStockCount = 0;
        for (Drug d : allDrugs) {
            int stock = batchRepository.getTotalAvailableStockForDrug(d.getId(), today);
            if (stock <= d.getReorderThreshold()) {
                lowStockCount++;
            }
        }

        int expiringCount = batchRepository.findBatchesExpiringBetween(today, today.plusDays(90)).size();
        int expiredCount = batchRepository.findExpiredBatches(today).size();

        return new DashboardSummaryResponse(
                todayRevenue,
                todayProfit,
                todaySales.size(),
                lowStockCount,
                expiringCount,
                expiredCount,
                allDrugs.size()
        );
    }

    @Override
    @Transactional(readOnly = true)
    public Map<String, Object> getProfitAndLossReport(LocalDate startDate, LocalDate endDate) {
        LocalDateTime start = LocalDateTime.of(startDate != null ? startDate : LocalDate.now().minusDays(30), LocalTime.MIN);
        LocalDateTime end = LocalDateTime.of(endDate != null ? endDate : LocalDate.now(), LocalTime.MAX);

        List<Sale> sales = saleRepository.findSalesBetweenDates(start, end);
        List<SaleItem> items = saleItemRepository.findSaleItemsBetweenDates(start, end);

        BigDecimal totalRevenue = sales.stream().map(Sale::getGrandTotal).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal totalCost = items.stream().map(i -> i.getCostPriceAtSale().multiply(BigDecimal.valueOf(i.getQuantity()))).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal grossProfit = totalRevenue.subtract(totalCost);

        Map<String, Object> report = new HashMap<>();
        report.put("startDate", start.toLocalDate());
        report.put("endDate", end.toLocalDate());
        report.put("totalSalesCount", sales.size());
        report.put("totalRevenue", totalRevenue);
        report.put("totalCostOfGoodsSold", totalCost);
        report.put("grossProfit", grossProfit);
        report.put("profitMarginPercentage", totalRevenue.compareTo(BigDecimal.ZERO) > 0 ? grossProfit.divide(totalRevenue, 4, java.math.RoundingMode.HALF_UP).multiply(BigDecimal.valueOf(100)) : BigDecimal.ZERO);

        return report;
    }

    @Override
    @Transactional(readOnly = true)
    public Map<String, Object> getComprehensiveFinancialStatement(String periodType, Integer year, Integer quarter, Integer month, LocalDate customStart, LocalDate customEnd) {
        int curYear = (year != null && year > 2000) ? year : LocalDate.now().getYear();
        LocalDate start;
        LocalDate end;
        String periodLabel;

        String pType = (periodType != null ? periodType.toUpperCase().trim() : "MONTHLY");

        switch (pType) {
            case "DAILY" -> {
                start = LocalDate.now();
                end = LocalDate.now();
                periodLabel = "Daily Financial Statement (" + start + ")";
            }
            case "WEEKLY" -> {
                start = LocalDate.now().minusDays(6);
                end = LocalDate.now();
                periodLabel = "Past 7 Days (" + start + " to " + end + ")";
            }
            case "MONTHLY" -> {
                int m = (month != null && month >= 1 && month <= 12) ? month : LocalDate.now().getMonthValue();
                start = LocalDate.of(curYear, m, 1);
                end = start.withDayOfMonth(start.lengthOfMonth());
                periodLabel = start.getMonth().name() + " " + curYear + " Financial Statement";
            }
            case "QUARTERLY" -> {
                int q = (quarter != null && quarter >= 1 && quarter <= 4) ? quarter : ((LocalDate.now().getMonthValue() - 1) / 3 + 1);
                int startMonth = (q - 1) * 3 + 1;
                int endMonth = startMonth + 2;
                start = LocalDate.of(curYear, startMonth, 1);
                LocalDate endMonthDate = LocalDate.of(curYear, endMonth, 1);
                end = endMonthDate.withDayOfMonth(endMonthDate.lengthOfMonth());
                periodLabel = "Q" + q + " (" + curYear + ") Financial Statement";
            }
            case "YEARLY" -> {
                start = LocalDate.of(curYear, 1, 1);
                end = LocalDate.of(curYear, 12, 31);
                periodLabel = "Annual Financial Statement (" + curYear + ")";
            }
            case "CUSTOM" -> {
                start = customStart != null ? customStart : LocalDate.now().minusDays(30);
                end = customEnd != null ? customEnd : LocalDate.now();
                periodLabel = "Custom Statement: " + start + " to " + end;
            }
            default -> {
                start = LocalDate.now().withDayOfMonth(1);
                end = LocalDate.now();
                periodLabel = "Current Month Financial Statement";
            }
        }

        LocalDateTime startDateTime = LocalDateTime.of(start, LocalTime.MIN);
        LocalDateTime endDateTime = LocalDateTime.of(end, LocalTime.MAX);

        // 1. Sales & Revenue
        List<Sale> sales = saleRepository.findSalesBetweenDates(startDateTime, endDateTime);
        List<SaleItem> saleItems = saleItemRepository.findSaleItemsBetweenDates(startDateTime, endDateTime);

        BigDecimal grossRevenue = BigDecimal.ZERO;
        BigDecimal totalDiscounts = BigDecimal.ZERO;
        BigDecimal totalTaxCollected = BigDecimal.ZERO;
        Map<String, BigDecimal> salesByPayment = new LinkedHashMap<>();
        for (PaymentMethod pm : PaymentMethod.values()) {
            salesByPayment.put(pm.name(), BigDecimal.ZERO);
        }

        for (Sale s : sales) {
            grossRevenue = grossRevenue.add(s.getGrandTotal());
            if (s.getDiscountAmount() != null) totalDiscounts = totalDiscounts.add(s.getDiscountAmount());
            if (s.getTaxAmount() != null) totalTaxCollected = totalTaxCollected.add(s.getTaxAmount());
            if (s.getPaymentMethod() != null) {
                String pmName = s.getPaymentMethod().name();
                salesByPayment.put(pmName, salesByPayment.getOrDefault(pmName, BigDecimal.ZERO).add(s.getGrandTotal()));
            }
        }

        // 2. Cost of Goods Sold (COGS)
        BigDecimal totalCostOfGoodsSold = BigDecimal.ZERO;
        for (SaleItem item : saleItems) {
            if (item.getCostPriceAtSale() != null) {
                totalCostOfGoodsSold = totalCostOfGoodsSold.add(item.getCostPriceAtSale().multiply(BigDecimal.valueOf(item.getQuantity())));
            }
        }

        BigDecimal grossProfit = grossRevenue.subtract(totalCostOfGoodsSold);
        BigDecimal grossMarginPct = grossRevenue.compareTo(BigDecimal.ZERO) > 0
                ? grossProfit.divide(grossRevenue, 4, java.math.RoundingMode.HALF_UP).multiply(BigDecimal.valueOf(100))
                : BigDecimal.ZERO;

        // 3. Operating Expenses
        List<Expense> expenses = expenseRepository.findExpensesBetweenDates(start, end);
        BigDecimal totalOperatingExpenses = BigDecimal.ZERO;
        Map<String, BigDecimal> expensesByCategory = new LinkedHashMap<>();
        for (ExpenseCategory cat : ExpenseCategory.values()) {
            expensesByCategory.put(cat.name(), BigDecimal.ZERO);
        }

        for (Expense e : expenses) {
            totalOperatingExpenses = totalOperatingExpenses.add(e.getAmount());
            String catName = e.getCategory().name();
            expensesByCategory.put(catName, expensesByCategory.getOrDefault(catName, BigDecimal.ZERO).add(e.getAmount()));
        }

        // 4. Procurement Purchases (PO/GRN)
        List<PurchaseOrder> purchaseOrders = purchaseOrderRepository.findOrdersBetweenDates(start, end);
        BigDecimal totalPurchases = BigDecimal.ZERO;
        BigDecimal totalReceivedPurchases = BigDecimal.ZERO;
        for (PurchaseOrder po : purchaseOrders) {
            if (po.getTotalAmount() != null) {
                totalPurchases = totalPurchases.add(po.getTotalAmount());
                if (po.getStatus() == PurchaseStatus.RECEIVED) {
                    totalReceivedPurchases = totalReceivedPurchases.add(po.getTotalAmount());
                }
            }
        }

        // 5. Expiry Risk & Inventory Losses
        List<DrugBatch> expiredBatches = batchRepository.findExpiredBatches(LocalDate.now());
        BigDecimal totalExpiredLossValuation = BigDecimal.ZERO;
        for (DrugBatch b : expiredBatches) {
            if (b.getBuyingPrice() != null && b.getQuantityOnHand() > 0) {
                totalExpiredLossValuation = totalExpiredLossValuation.add(b.getBuyingPrice().multiply(BigDecimal.valueOf(b.getQuantityOnHand())));
            }
        }

        // 6. Net Profit (Bottom line: Gross Profit - OpEx)
        BigDecimal netOperatingProfit = grossProfit.subtract(totalOperatingExpenses);
        BigDecimal netMarginPct = grossRevenue.compareTo(BigDecimal.ZERO) > 0
                ? netOperatingProfit.divide(grossRevenue, 4, java.math.RoundingMode.HALF_UP).multiply(BigDecimal.valueOf(100))
                : BigDecimal.ZERO;

        // 7. Periodic Trend Series
        List<Map<String, Object>> trendSeries = new ArrayList<>();
        if (pType.equals("YEARLY")) {
            for (int m = 1; m <= 12; m++) {
                LocalDate mStart = LocalDate.of(curYear, m, 1);
                LocalDate mEnd = mStart.withDayOfMonth(mStart.lengthOfMonth());
                LocalDateTime mStartDT = LocalDateTime.of(mStart, LocalTime.MIN);
                LocalDateTime mEndDT = LocalDateTime.of(mEnd, LocalTime.MAX);

                BigDecimal mRev = saleRepository.findSalesBetweenDates(mStartDT, mEndDT).stream().map(Sale::getGrandTotal).reduce(BigDecimal.ZERO, BigDecimal::add);
                BigDecimal mCogs = saleItemRepository.findSaleItemsBetweenDates(mStartDT, mEndDT).stream().map(i -> (i.getCostPriceAtSale() != null ? i.getCostPriceAtSale() : BigDecimal.ZERO).multiply(BigDecimal.valueOf(i.getQuantity()))).reduce(BigDecimal.ZERO, BigDecimal::add);
                BigDecimal mExp = expenseRepository.sumExpensesBetweenDates(mStart, mEnd);
                if (mExp == null) mExp = BigDecimal.ZERO;
                BigDecimal mPurch = purchaseOrderRepository.sumTotalPurchasesBetweenDates(mStart, mEnd);
                if (mPurch == null) mPurch = BigDecimal.ZERO;
                BigDecimal mGross = mRev.subtract(mCogs);
                BigDecimal mNet = mGross.subtract(mExp);

                Map<String, Object> slot = new HashMap<>();
                slot.put("periodName", mStart.getMonth().name().substring(0, 3));
                slot.put("revenue", mRev);
                slot.put("cogs", mCogs);
                slot.put("grossProfit", mGross);
                slot.put("expenses", mExp);
                slot.put("purchases", mPurch);
                slot.put("netProfit", mNet);
                trendSeries.add(slot);
            }
        } else if (pType.equals("QUARTERLY")) {
            int q = (quarter != null && quarter >= 1 && quarter <= 4) ? quarter : ((LocalDate.now().getMonthValue() - 1) / 3 + 1);
            int startMonth = (q - 1) * 3 + 1;
            for (int m = startMonth; m <= startMonth + 2; m++) {
                LocalDate mStart = LocalDate.of(curYear, m, 1);
                LocalDate mEnd = mStart.withDayOfMonth(mStart.lengthOfMonth());
                LocalDateTime mStartDT = LocalDateTime.of(mStart, LocalTime.MIN);
                LocalDateTime mEndDT = LocalDateTime.of(mEnd, LocalTime.MAX);

                BigDecimal mRev = saleRepository.findSalesBetweenDates(mStartDT, mEndDT).stream().map(Sale::getGrandTotal).reduce(BigDecimal.ZERO, BigDecimal::add);
                BigDecimal mCogs = saleItemRepository.findSaleItemsBetweenDates(mStartDT, mEndDT).stream().map(i -> (i.getCostPriceAtSale() != null ? i.getCostPriceAtSale() : BigDecimal.ZERO).multiply(BigDecimal.valueOf(i.getQuantity()))).reduce(BigDecimal.ZERO, BigDecimal::add);
                BigDecimal mExp = expenseRepository.sumExpensesBetweenDates(mStart, mEnd);
                if (mExp == null) mExp = BigDecimal.ZERO;
                BigDecimal mGross = mRev.subtract(mCogs);
                BigDecimal mNet = mGross.subtract(mExp);

                Map<String, Object> slot = new HashMap<>();
                slot.put("periodName", mStart.getMonth().name());
                slot.put("revenue", mRev);
                slot.put("cogs", mCogs);
                slot.put("grossProfit", mGross);
                slot.put("expenses", mExp);
                slot.put("netProfit", mNet);
                trendSeries.add(slot);
            }
        } else {
            LocalDate ptr = start;
            while (!ptr.isAfter(end)) {
                LocalDateTime dStartDT = LocalDateTime.of(ptr, LocalTime.MIN);
                LocalDateTime dEndDT = LocalDateTime.of(ptr, LocalTime.MAX);

                BigDecimal dRev = saleRepository.findSalesBetweenDates(dStartDT, dEndDT).stream().map(Sale::getGrandTotal).reduce(BigDecimal.ZERO, BigDecimal::add);
                BigDecimal dCogs = saleItemRepository.findSaleItemsBetweenDates(dStartDT, dEndDT).stream().map(i -> (i.getCostPriceAtSale() != null ? i.getCostPriceAtSale() : BigDecimal.ZERO).multiply(BigDecimal.valueOf(i.getQuantity()))).reduce(BigDecimal.ZERO, BigDecimal::add);
                BigDecimal dExp = expenseRepository.sumExpensesBetweenDates(ptr, ptr);
                if (dExp == null) dExp = BigDecimal.ZERO;
                BigDecimal dGross = dRev.subtract(dCogs);
                BigDecimal dNet = dGross.subtract(dExp);

                Map<String, Object> slot = new HashMap<>();
                slot.put("periodName", ptr.getDayOfMonth() + " " + ptr.getMonth().name().substring(0, 3));
                slot.put("date", ptr.toString());
                slot.put("revenue", dRev);
                slot.put("cogs", dCogs);
                slot.put("grossProfit", dGross);
                slot.put("expenses", dExp);
                slot.put("netProfit", dNet);
                trendSeries.add(slot);

                ptr = ptr.plusDays(1);
            }
        }

        Map<String, Object> report = new LinkedHashMap<>();
        report.put("periodType", pType);
        report.put("periodLabel", periodLabel);
        report.put("startDate", start);
        report.put("endDate", end);
        report.put("year", curYear);

        // Revenue
        report.put("totalRevenue", grossRevenue);
        report.put("totalSalesCount", sales.size());
        report.put("totalDiscounts", totalDiscounts);
        report.put("totalTaxCollected", totalTaxCollected);
        report.put("salesByPaymentMethod", salesByPayment);

        // COGS & Gross Profit
        report.put("totalCostOfGoodsSold", totalCostOfGoodsSold);
        report.put("grossProfit", grossProfit);
        report.put("grossMarginPercentage", grossMarginPct);

        // Operating Expenses
        report.put("totalOperatingExpenses", totalOperatingExpenses);
        report.put("expensesCount", expenses.size());
        report.put("expensesByCategory", expensesByCategory);

        // Purchases / Procurement
        report.put("totalPurchases", totalPurchases);
        report.put("totalReceivedPurchases", totalReceivedPurchases);
        report.put("purchasesCount", purchaseOrders.size());

        // Losses
        report.put("expiredStockLoss", totalExpiredLossValuation);

        // Net Profit
        report.put("netOperatingProfit", netOperatingProfit);
        report.put("netProfitMarginPercentage", netMarginPct);

        // Periodic trends
        report.put("trendSeries", trendSeries);

        return report;
    }

    @Override
    @Transactional(readOnly = true)
    public Map<String, Object> getInventoryValuationReport() {
        LocalDate today = LocalDate.now();
        List<DrugBatch> batches = batchRepository.findAll();

        BigDecimal totalCostValuation = BigDecimal.ZERO;
        BigDecimal totalRetailValuation = BigDecimal.ZERO;
        int totalUnitsInStock = 0;
        int activeBatchesCount = 0;

        for (DrugBatch b : batches) {
            if (b.getQuantityOnHand() > 0 && (b.getExpiryDate() == null || b.getExpiryDate().isAfter(today))) {
                totalUnitsInStock += b.getQuantityOnHand();
                activeBatchesCount++;
                if (b.getBuyingPrice() != null) {
                    totalCostValuation = totalCostValuation.add(b.getBuyingPrice().multiply(BigDecimal.valueOf(b.getQuantityOnHand())));
                }
                if (b.getRetailPrice() != null) {
                    totalRetailValuation = totalRetailValuation.add(b.getRetailPrice().multiply(BigDecimal.valueOf(b.getQuantityOnHand())));
                }
            }
        }

        BigDecimal potentialProfit = totalRetailValuation.subtract(totalCostValuation);

        Map<String, Object> res = new HashMap<>();
        res.put("totalCostValuation", totalCostValuation);
        res.put("totalRetailValuation", totalRetailValuation);
        res.put("potentialGrossProfit", potentialProfit);
        res.put("totalUnitsInStock", totalUnitsInStock);
        res.put("activeBatchesCount", activeBatchesCount);
        res.put("totalCatalogDrugs", drugRepository.count());
        return res;
    }

    @Override
    @Transactional(readOnly = true)
    public Map<String, Object> getExpiryRiskReport() {
        LocalDate today = LocalDate.now();
        List<DrugBatch> expired = batchRepository.findExpiredBatches(today);
        List<DrugBatch> exp30 = batchRepository.findBatchesExpiringBetween(today, today.plusDays(30));
        List<DrugBatch> exp60 = batchRepository.findBatchesExpiringBetween(today.plusDays(31), today.plusDays(60));
        List<DrugBatch> exp90 = batchRepository.findBatchesExpiringBetween(today.plusDays(61), today.plusDays(90));

        BigDecimal expiredLossValuation = expired.stream()
                .map(b -> (b.getBuyingPrice() != null ? b.getBuyingPrice() : BigDecimal.ZERO).multiply(BigDecimal.valueOf(b.getQuantityOnHand())))
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal risk30Valuation = exp30.stream()
                .map(b -> (b.getBuyingPrice() != null ? b.getBuyingPrice() : BigDecimal.ZERO).multiply(BigDecimal.valueOf(b.getQuantityOnHand())))
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        Map<String, Object> res = new HashMap<>();
        res.put("expiredCount", expired.size());
        res.put("expiredLossValuation", expiredLossValuation);
        res.put("expiring30DaysCount", exp30.size());
        res.put("expiring30DaysValuation", risk30Valuation);
        res.put("expiring60DaysCount", exp60.size());
        res.put("expiring90DaysCount", exp90.size());
        return res;
    }

    @Override
    @Transactional(readOnly = true)
    public Map<String, Object> getCashierShiftSummary(Long cashierId) {
        LocalDateTime startOfDay = LocalDateTime.of(LocalDate.now(), LocalTime.MIN);
        LocalDateTime endOfDay = LocalDateTime.of(LocalDate.now(), LocalTime.MAX);

        List<Sale> sales = saleRepository.findSalesBetweenDates(startOfDay, endOfDay);
        if (cashierId != null) {
            sales = sales.stream().filter(s -> s.getCashier() != null && cashierId.equals(s.getCashier().getId())).toList();
        }

        BigDecimal totalSales = BigDecimal.ZERO;
        BigDecimal cashSales = BigDecimal.ZERO;
        BigDecimal digitalSales = BigDecimal.ZERO;
        BigDecimal cardSales = BigDecimal.ZERO;

        for (Sale s : sales) {
            totalSales = totalSales.add(s.getGrandTotal());
            if (s.getPaymentMethod() != null) {
                switch (s.getPaymentMethod()) {
                    case CASH -> cashSales = cashSales.add(s.getGrandTotal());
                    case MOBILE_MONEY -> digitalSales = digitalSales.add(s.getGrandTotal());
                    case CARD, BANK_TRANSFER -> cardSales = cardSales.add(s.getGrandTotal());
                    default -> cashSales = cashSales.add(s.getGrandTotal());
                }
            } else {
                cashSales = cashSales.add(s.getGrandTotal());
            }
        }

        Map<String, Object> res = new HashMap<>();
        res.put("totalSalesCount", sales.size());
        res.put("totalRevenue", totalSales);
        res.put("cashAmount", cashSales);
        res.put("digitalAmount", digitalSales);
        res.put("cardOrBankAmount", cardSales);
        return res;
    }

    @Override
    public byte[] generateSalesPdfReport(LocalDate startDate, LocalDate endDate) {
        try (ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Document document = new Document(PageSize.A4);
            PdfWriter.getInstance(document, out);
            document.open();

            Font titleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 18, java.awt.Color.DARK_GRAY);
            Paragraph title = new Paragraph("PHARMACY MANAGEMENT SYSTEM - SALES REPORT", titleFont);
            title.setAlignment(Element.ALIGN_CENTER);
            document.add(title);
            document.add(new Paragraph("Period: " + startDate + " to " + endDate));
            document.add(new Paragraph("Generated: " + LocalDateTime.now()));
            document.add(new Paragraph(" "));

            PdfPTable table = new PdfPTable(5);
            table.setWidthPercentage(100);
            table.addCell("Invoice #");
            table.addCell("Date");
            table.addCell("Type");
            table.addCell("Payment");
            table.addCell("Total (ETB)");

            LocalDateTime start = LocalDateTime.of(startDate, LocalTime.MIN);
            LocalDateTime end = LocalDateTime.of(endDate, LocalTime.MAX);
            List<Sale> sales = saleRepository.findSalesBetweenDates(start, end);

            for (Sale s : sales) {
                table.addCell(s.getInvoiceNumber());
                table.addCell(s.getCreatedAt().toLocalDate().toString());
                table.addCell(s.getSaleType().name());
                table.addCell(s.getPaymentMethod().name());
                table.addCell(s.getGrandTotal().toString());
            }

            document.add(table);
            document.close();
            return out.toByteArray();
        } catch (Exception e) {
            throw new ReportGenerationException("Error generating PDF: " + e.getMessage(), e);
        }
    }
}
