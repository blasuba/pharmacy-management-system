package com.pharmacy.pms.service.impl;

import com.lowagie.text.*;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import com.pharmacy.pms.dto.response.DashboardSummaryResponse;
import com.pharmacy.pms.exception.ReportGenerationException;
import com.pharmacy.pms.model.entity.Drug;
import com.pharmacy.pms.model.entity.DrugBatch;
import com.pharmacy.pms.model.entity.Sale;
import com.pharmacy.pms.model.entity.SaleItem;
import com.pharmacy.pms.repository.DrugBatchRepository;
import com.pharmacy.pms.repository.DrugRepository;
import com.pharmacy.pms.repository.SaleItemRepository;
import com.pharmacy.pms.repository.SaleRepository;
import com.pharmacy.pms.service.ReportService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class ReportServiceImpl implements ReportService {

    private final SaleRepository saleRepository;
    private final SaleItemRepository saleItemRepository;
    private final DrugBatchRepository batchRepository;
    private final DrugRepository drugRepository;

    public ReportServiceImpl(SaleRepository saleRepository, SaleItemRepository saleItemRepository, DrugBatchRepository batchRepository, DrugRepository drugRepository) {
        this.saleRepository = saleRepository;
        this.saleItemRepository = saleItemRepository;
        this.batchRepository = batchRepository;
        this.drugRepository = drugRepository;
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
