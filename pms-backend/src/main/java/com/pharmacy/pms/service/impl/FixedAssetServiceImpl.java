package com.pharmacy.pms.service.impl;

import com.lowagie.text.Document;
import com.lowagie.text.Element;
import com.lowagie.text.Font;
import com.lowagie.text.FontFactory;
import com.lowagie.text.PageSize;
import com.lowagie.text.Paragraph;
import com.lowagie.text.Phrase;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import com.pharmacy.pms.dto.request.*;
import com.pharmacy.pms.dto.response.*;
import com.pharmacy.pms.exception.BadRequestException;
import com.pharmacy.pms.exception.ReportGenerationException;
import com.pharmacy.pms.exception.ResourceNotFoundException;
import com.pharmacy.pms.model.entity.*;
import com.pharmacy.pms.model.enums.AssetCategory;
import com.pharmacy.pms.model.enums.AssetStatus;
import com.pharmacy.pms.model.enums.DepreciationMethod;
import com.pharmacy.pms.model.enums.NotificationType;
import com.pharmacy.pms.repository.*;
import com.pharmacy.pms.service.FixedAssetService;
import com.pharmacy.pms.service.NotificationService;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Service
public class FixedAssetServiceImpl implements FixedAssetService {

    private final FixedAssetRepository assetRepository;
    private final AssetDepreciationRepository depreciationRepository;
    private final AssetMaintenanceRepository maintenanceRepository;
    private final AssetDisposalRepository disposalRepository;
    private final SupplierRepository supplierRepository;
    private final UserRepository userRepository;
    private final AuditLogRepository auditLogRepository;
    private final NotificationService notificationService;

    public FixedAssetServiceImpl(FixedAssetRepository assetRepository,
                                 AssetDepreciationRepository depreciationRepository,
                                 AssetMaintenanceRepository maintenanceRepository,
                                 AssetDisposalRepository disposalRepository,
                                 SupplierRepository supplierRepository,
                                 UserRepository userRepository,
                                 AuditLogRepository auditLogRepository,
                                 NotificationService notificationService) {
        this.assetRepository = assetRepository;
        this.depreciationRepository = depreciationRepository;
        this.maintenanceRepository = maintenanceRepository;
        this.disposalRepository = disposalRepository;
        this.supplierRepository = supplierRepository;
        this.userRepository = userRepository;
        this.auditLogRepository = auditLogRepository;
        this.notificationService = notificationService;
    }

    private String generateAssetCode(AssetCategory category) {
        long count = assetRepository.countByCategory(category) + 1;
        String prefix = category != null ? category.getCodePrefix() : "AST";
        String code = String.format("AST-%s-%04d", prefix, count);
        while (assetRepository.existsByAssetCode(code)) {
            count++;
            code = String.format("AST-%s-%04d", prefix, count);
        }
        return code;
    }

    private void recordAudit(User user, String action, String entityId, String details) {
        String username = user != null ? user.getUsername() : "SYSTEM";
        auditLogRepository.save(new AuditLog(user, username, action, "FixedAsset", entityId, details, "127.0.0.1"));
    }

    @Override
    @Transactional
    public AssetResponse createAsset(AssetCreateRequest request, Long userId) {
        User creator = userId != null ? userRepository.findById(userId).orElse(null) : null;

        FixedAsset asset = new FixedAsset();
        asset.setAssetCode(generateAssetCode(request.getCategory()));
        asset.setName(request.getName());
        asset.setCategory(request.getCategory());
        asset.setDescription(request.getDescription());
        asset.setPurchaseDate(request.getPurchaseDate());
        asset.setPurchaseCost(request.getPurchaseCost());

        if (request.getSupplierId() != null) {
            Supplier supplier = supplierRepository.findById(request.getSupplierId()).orElse(null);
            asset.setSupplier(supplier);
        }

        asset.setLocation(request.getLocation());
        asset.setSerialNumber(request.getSerialNumber());
        asset.setWarrantyExpiry(request.getWarrantyExpiry());
        asset.setUsefulLifeYears(request.getUsefulLifeYears());
        asset.setSalvageValue(request.getSalvageValue() != null ? request.getSalvageValue() : BigDecimal.ZERO);
        asset.setDepreciationMethod(request.getDepreciationMethod() != null ? request.getDepreciationMethod() : DepreciationMethod.STRAIGHT_LINE);
        asset.setCurrentBookValue(request.getPurchaseCost()); // Initially equal to purchase cost
        asset.setStatus(AssetStatus.ACTIVE);
        asset.setCreatedBy(creator);

        FixedAsset saved = assetRepository.save(asset);
        recordAudit(creator, "ASSET_CREATE", String.valueOf(saved.getId()), "Created asset " + saved.getAssetCode() + " - " + saved.getName());

        return new AssetResponse(saved);
    }

    @Override
    @Transactional
    public AssetResponse updateAsset(Long id, AssetUpdateRequest request, Long userId) {
        FixedAsset asset = assetRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Asset not found with ID: " + id));

        User user = userId != null ? userRepository.findById(userId).orElse(null) : null;

        asset.setName(request.getName());
        asset.setCategory(request.getCategory());
        asset.setDescription(request.getDescription());
        asset.setPurchaseDate(request.getPurchaseDate());
        asset.setPurchaseCost(request.getPurchaseCost());

        if (request.getSupplierId() != null) {
            Supplier supplier = supplierRepository.findById(request.getSupplierId()).orElse(null);
            asset.setSupplier(supplier);
        } else {
            asset.setSupplier(null);
        }

        asset.setLocation(request.getLocation());
        asset.setSerialNumber(request.getSerialNumber());
        asset.setWarrantyExpiry(request.getWarrantyExpiry());
        asset.setUsefulLifeYears(request.getUsefulLifeYears());
        asset.setSalvageValue(request.getSalvageValue() != null ? request.getSalvageValue() : BigDecimal.ZERO);
        asset.setDepreciationMethod(request.getDepreciationMethod() != null ? request.getDepreciationMethod() : DepreciationMethod.STRAIGHT_LINE);

        if (request.getStatus() != null && asset.getStatus() != AssetStatus.DISPOSED && asset.getStatus() != AssetStatus.SOLD) {
            asset.setStatus(request.getStatus());
        }

        FixedAsset updated = assetRepository.save(asset);
        recordAudit(user, "ASSET_UPDATE", String.valueOf(updated.getId()), "Updated asset " + updated.getAssetCode());

        return new AssetResponse(updated);
    }

    @Override
    @Transactional
    public void deleteAsset(Long id, Long userId) {
        FixedAsset asset = assetRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Asset not found with ID: " + id));

        if (!asset.getDepreciations().isEmpty() || asset.getDisposal() != null) {
            throw new BadRequestException("Cannot delete asset with existing depreciation schedule or disposal records. Use disposal workflow instead.");
        }

        User user = userId != null ? userRepository.findById(userId).orElse(null) : null;
        recordAudit(user, "ASSET_DELETE", id.toString(), "Deleted asset " + asset.getAssetCode() + " - " + asset.getName());

        assetRepository.delete(asset);
    }

    @Override
    @Transactional(readOnly = true)
    public AssetResponse getAssetById(Long id) {
        FixedAsset asset = assetRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Asset not found with ID: " + id));
        return new AssetResponse(asset);
    }

    @Override
    @Transactional(readOnly = true)
    public List<AssetResponse> searchAssets(String query, AssetCategory category, AssetStatus status, String location) {
        Specification<FixedAsset> spec = (root, q, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (query != null && !query.trim().isEmpty()) {
                String pattern = "%" + query.trim().toLowerCase() + "%";
                Predicate nameMatch = cb.like(cb.lower(root.get("name")), pattern);
                Predicate codeMatch = cb.like(cb.lower(root.get("assetCode")), pattern);
                Predicate serialMatch = cb.like(cb.lower(cb.coalesce(root.get("serialNumber"), "")), pattern);
                predicates.add(cb.or(nameMatch, codeMatch, serialMatch));
            }

            if (category != null) {
                predicates.add(cb.equal(root.get("category"), category));
            }

            if (status != null) {
                predicates.add(cb.equal(root.get("status"), status));
            }

            if (location != null && !location.trim().isEmpty()) {
                predicates.add(cb.like(cb.lower(root.get("location")), "%" + location.trim().toLowerCase() + "%"));
            }

            if (q != null) {
                q.orderBy(cb.desc(root.get("createdAt")));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        return assetRepository.findAll(spec).stream()
                .map(AssetResponse::new)
                .toList();
    }

    @Override
    @Transactional
    public AssetResponse assignAsset(Long id, AssetAssignRequest request, Long userId) {
        FixedAsset asset = assetRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Asset not found with ID: " + id));

        if (asset.getStatus() == AssetStatus.DISPOSED || asset.getStatus() == AssetStatus.SOLD || asset.getStatus() == AssetStatus.LOST) {
            throw new BadRequestException("Cannot assign disposed, sold, or lost asset.");
        }

        User assignee = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + request.getUserId()));

        User actor = userId != null ? userRepository.findById(userId).orElse(null) : null;

        asset.setAssignedTo(assignee);
        asset.setAssignedDate(request.getAssignedDate() != null ? request.getAssignedDate() : LocalDate.now());
        asset.setAssignmentNotes(request.getNotes());

        FixedAsset saved = assetRepository.save(asset);

        // Notify assigned staff user
        String msg = String.format("Asset %s (%s) has been assigned to you by %s.",
                saved.getName(), saved.getAssetCode(), actor != null ? actor.getFullName() : "Admin");
        notificationService.createAnnouncement("Asset Assignment: " + saved.getName(), msg, NotificationType.BROADCAST, "MEDIUM");

        recordAudit(actor, "ASSET_ASSIGN", String.valueOf(saved.getId()), "Assigned " + saved.getAssetCode() + " to " + assignee.getUsername());

        return new AssetResponse(saved);
    }

    @Override
    @Transactional
    public AssetResponse returnAsset(Long id, Long userId) {
        FixedAsset asset = assetRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Asset not found with ID: " + id));

        User actor = userId != null ? userRepository.findById(userId).orElse(null) : null;
        String prevAssignee = asset.getAssignedTo() != null ? asset.getAssignedTo().getUsername() : "N/A";

        asset.setAssignedTo(null);
        asset.setAssignedDate(null);
        asset.setAssignmentNotes(null);

        FixedAsset saved = assetRepository.save(asset);
        recordAudit(actor, "ASSET_RETURN", String.valueOf(saved.getId()), "Returned asset " + saved.getAssetCode() + " (previously assigned to " + prevAssignee + ")");

        return new AssetResponse(saved);
    }

    @Override
    @Transactional
    public AssetMaintenanceResponse addMaintenanceRecord(Long id, AssetMaintenanceRequest request, Long userId) {
        FixedAsset asset = assetRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Asset not found with ID: " + id));

        User creator = userId != null ? userRepository.findById(userId).orElse(null) : null;

        AssetMaintenance maintenance = new AssetMaintenance(
                asset,
                request.getMaintenanceDate(),
                request.getDescription(),
                request.getCost(),
                request.getPerformedBy(),
                request.getNextMaintenanceDate(),
                creator
        );

        AssetMaintenance saved = maintenanceRepository.save(maintenance);

        // Check if cumulative maintenance cost > 50% of current book value
        BigDecimal totalMaintCost = maintenanceRepository.getTotalMaintenanceCostByAssetId(asset.getId());
        if (asset.getCurrentBookValue() != null && asset.getCurrentBookValue().compareTo(BigDecimal.ZERO) > 0) {
            BigDecimal halfValue = asset.getCurrentBookValue().multiply(BigDecimal.valueOf(0.5));
            if (totalMaintCost.compareTo(halfValue) > 0) {
                String alert = String.format("Asset %s (%s) total maintenance (ETB %s) exceeds 50%% of its book value (ETB %s). Replacement recommended.",
                        asset.getName(), asset.getAssetCode(), totalMaintCost, asset.getCurrentBookValue());
                notificationService.createAnnouncement("Asset Replacement Alert", alert, NotificationType.BROADCAST, "HIGH");
            }
        }

        recordAudit(creator, "ASSET_MAINTENANCE_ADD", String.valueOf(asset.getId()),
                "Maintenance logged for " + asset.getAssetCode() + ": " + request.getDescription() + " (Cost: " + request.getCost() + ")");

        return new AssetMaintenanceResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public List<AssetMaintenanceResponse> getMaintenanceHistory(Long assetId) {
        return maintenanceRepository.findByFixedAssetIdOrderByMaintenanceDateDesc(assetId).stream()
                .map(AssetMaintenanceResponse::new)
                .toList();
    }

    @Override
    @Transactional
    public AssetDisposalResponse disposeAsset(Long id, AssetDisposalRequest request, Long userId) {
        FixedAsset asset = assetRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Asset not found with ID: " + id));

        if (asset.getAssignedTo() != null) {
            throw new BadRequestException("Cannot dispose asset while it is assigned to a user (" +
                    asset.getAssignedTo().getFullName() + "). Please return the asset first.");
        }

        if (asset.getStatus() == AssetStatus.DISPOSED || asset.getStatus() == AssetStatus.SOLD) {
            throw new BadRequestException("Asset is already marked as " + asset.getStatus());
        }

        User approver = userId != null ? userRepository.findById(userId).orElse(null) : null;

        BigDecimal bookValueAtDisposal = asset.getCurrentBookValue() != null ? asset.getCurrentBookValue() : BigDecimal.ZERO;
        BigDecimal salePrice = request.getSalePrice() != null ? request.getSalePrice() : BigDecimal.ZERO;
        BigDecimal gainLoss = salePrice.subtract(bookValueAtDisposal);

        AssetDisposal disposal = new AssetDisposal(
                asset,
                request.getDisposalDate(),
                request.getDisposalType(),
                salePrice,
                bookValueAtDisposal,
                gainLoss,
                request.getReason(),
                approver
        );

        AssetDisposal saved = disposalRepository.save(disposal);

        // Update asset state
        if (request.getDisposalType() == com.pharmacy.pms.model.enums.DisposalType.SOLD) {
            asset.setStatus(AssetStatus.SOLD);
        } else if (request.getDisposalType() == com.pharmacy.pms.model.enums.DisposalType.LOST) {
            asset.setStatus(AssetStatus.LOST);
        } else {
            asset.setStatus(AssetStatus.DISPOSED);
        }
        asset.setCurrentBookValue(BigDecimal.ZERO);
        asset.setDisposal(saved);
        assetRepository.save(asset);

        recordAudit(approver, "ASSET_DISPOSE", String.valueOf(asset.getId()),
                String.format("Disposed %s via %s. Sale Price: %s, Book Value: %s, Gain/Loss: %s",
                        asset.getAssetCode(), request.getDisposalType(), salePrice, bookValueAtDisposal, gainLoss));

        return new AssetDisposalResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public List<AssetDepreciationResponse> getDepreciationSchedule(Long assetId) {
        return depreciationRepository.findByFixedAssetIdOrderByFiscalYearAsc(assetId).stream()
                .map(AssetDepreciationResponse::new)
                .toList();
    }

    @Override
    @Transactional
    public List<AssetDepreciationResponse> runDepreciation(DepreciationRunRequest request, Long userId) {
        int fiscalYear = request.getFiscalYear();
        User actor = userId != null ? userRepository.findById(userId).orElse(null) : null;

        List<FixedAsset> activeAssets = assetRepository.findActiveAssetsForDepreciation();

        for (FixedAsset asset : activeAssets) {
            boolean alreadyLocked = depreciationRepository.existsByFixedAssetIdAndFiscalYearAndIsLockedTrue(asset.getId(), fiscalYear);
            if (alreadyLocked && !request.isOverwriteExisting()) {
                continue; // Skip already locked fiscal year calculation
            }

            BigDecimal cost = asset.getPurchaseCost();
            BigDecimal salvage = asset.getSalvageValue() != null ? asset.getSalvageValue() : BigDecimal.ZERO;
            int usefulYears = Math.max(asset.getUsefulLifeYears(), 1);

            // Straight line depreciation per year = (Purchase Cost - Salvage Value) / Useful Life
            BigDecimal depreciableBase = cost.subtract(salvage).max(BigDecimal.ZERO);
            BigDecimal annualDepreciation = depreciableBase.divide(BigDecimal.valueOf(usefulYears), 2, RoundingMode.HALF_UP);

            BigDecimal openingValue = asset.getCurrentBookValue() != null ? asset.getCurrentBookValue() : cost;

            // Depreciation cannot reduce book value below salvage value
            BigDecimal maxAllowableDeprec = openingValue.subtract(salvage).max(BigDecimal.ZERO);
            BigDecimal depreciationAmount = annualDepreciation.min(maxAllowableDeprec);
            BigDecimal closingValue = openingValue.subtract(depreciationAmount);

            AssetDepreciation depRecord = depreciationRepository.findByFixedAssetIdAndFiscalYear(asset.getId(), fiscalYear)
                    .orElse(new AssetDepreciation());

            depRecord.setFixedAsset(asset);
            depRecord.setFiscalYear(fiscalYear);
            depRecord.setOpeningValue(openingValue);
            depRecord.setDepreciationAmount(depreciationAmount);
            depRecord.setClosingValue(closingValue);
            depRecord.setLocked(true);

            depreciationRepository.save(depRecord);

            // Update asset current book value
            asset.setCurrentBookValue(closingValue);
            assetRepository.save(asset);
        }

        recordAudit(actor, "ASSET_DEPRECIATION_RUN", String.valueOf(fiscalYear),
                "Executed annual straight-line depreciation for fiscal year " + fiscalYear);

        return depreciationRepository.findByFiscalYear(fiscalYear).stream()
                .map(AssetDepreciationResponse::new)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public AssetDashboardResponse getDashboardMetrics() {
        List<FixedAsset> allAssets = assetRepository.findAll();
        LocalDate now = LocalDate.now();

        AssetDashboardResponse resp = new AssetDashboardResponse();
        resp.setTotalAssetsCount(allAssets.size());

        BigDecimal totalCost = BigDecimal.ZERO;
        BigDecimal totalBookValue = BigDecimal.ZERO;
        long active = 0;
        long underMaint = 0;
        long disposed = 0;

        for (FixedAsset a : allAssets) {
            if (a.getStatus() == AssetStatus.ACTIVE || a.getStatus() == AssetStatus.UNDER_MAINTENANCE) {
                totalCost = totalCost.add(a.getPurchaseCost() != null ? a.getPurchaseCost() : BigDecimal.ZERO);
                totalBookValue = totalBookValue.add(a.getCurrentBookValue() != null ? a.getCurrentBookValue() : BigDecimal.ZERO);
                if (a.getStatus() == AssetStatus.ACTIVE) active++;
                else underMaint++;
            } else {
                disposed++;
            }
        }

        resp.setTotalPurchaseValue(totalCost);
        resp.setTotalCurrentBookValue(totalBookValue);
        resp.setActiveAssetsCount(active);
        resp.setAssetsUnderMaintenanceCount(underMaint);
        resp.setDisposedAssetsCount(disposed);

        int currentYear = now.getYear();
        resp.setTotalDepreciationThisYear(depreciationRepository.getTotalDepreciationForFiscalYear(currentYear));

        // Warranty alerts (< 30 days)
        List<FixedAsset> warrantyExpiring = assetRepository.findAssetsWithWarrantyExpiringBetween(now, now.plusDays(30));
        resp.setWarrantyAlertsCount(warrantyExpiring.size());
        resp.setExpiringWarrantyAssets(warrantyExpiring.stream().map(AssetResponse::new).toList());

        // Replacement alerts (near useful life end or >50% maint cost)
        List<AssetResponse> replacementDue = allAssets.stream()
                .map(AssetResponse::new)
                .filter(a -> a.isNearEndOfLife() || a.isReplacementSuggested())
                .toList();
        resp.setReplacementAlertsCount(replacementDue.size());
        resp.setReplacementDueAssets(replacementDue);

        // Recent maintenances
        resp.setRecentMaintenances(maintenanceRepository.findTop20ByOrderByCreatedAtDesc().stream()
                .map(AssetMaintenanceResponse::new)
                .toList());

        return resp;
    }

    @Override
    @Transactional(readOnly = true)
    public List<AssetDisposalResponse> getDisposalHistory() {
        return disposalRepository.findAllByOrderByDisposalDateDesc().stream()
                .map(AssetDisposalResponse::new)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public byte[] exportAssetsExcel() {
        try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("Fixed Assets Register");

            // Header Style
            org.apache.poi.ss.usermodel.Font headerFont = workbook.createFont();
            headerFont.setBold(true);
            headerFont.setColor(IndexedColors.WHITE.getIndex());

            CellStyle headerStyle = workbook.createCellStyle();
            headerStyle.setFont(headerFont);
            headerStyle.setFillForegroundColor(IndexedColors.DARK_BLUE.getIndex());
            headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            headerStyle.setAlignment(HorizontalAlignment.CENTER);

            String[] columns = {"Asset Code", "Name", "Category", "Location", "Serial Number", "Purchase Date", "Cost (ETB)", "Salvage (ETB)", "Book Value (ETB)", "Status", "Assigned To"};
            Row headerRow = sheet.createRow(0);
            for (int i = 0; i < columns.length; i++) {
                org.apache.poi.ss.usermodel.Cell cell = headerRow.createCell(i);
                cell.setCellValue(columns[i]);
                cell.setCellStyle(headerStyle);
            }

            List<FixedAsset> assets = assetRepository.findAll();
            int rowIdx = 1;
            for (FixedAsset a : assets) {
                Row row = sheet.createRow(rowIdx++);
                row.createCell(0).setCellValue(a.getAssetCode());
                row.createCell(1).setCellValue(a.getName());
                row.createCell(2).setCellValue(a.getCategory() != null ? a.getCategory().name() : "");
                row.createCell(3).setCellValue(a.getLocation() != null ? a.getLocation() : "");
                row.createCell(4).setCellValue(a.getSerialNumber() != null ? a.getSerialNumber() : "");
                row.createCell(5).setCellValue(a.getPurchaseDate() != null ? a.getPurchaseDate().toString() : "");
                row.createCell(6).setCellValue(a.getPurchaseCost() != null ? a.getPurchaseCost().doubleValue() : 0.0);
                row.createCell(7).setCellValue(a.getSalvageValue() != null ? a.getSalvageValue().doubleValue() : 0.0);
                row.createCell(8).setCellValue(a.getCurrentBookValue() != null ? a.getCurrentBookValue().doubleValue() : 0.0);
                row.createCell(9).setCellValue(a.getStatus() != null ? a.getStatus().name() : "");
                row.createCell(10).setCellValue(a.getAssignedTo() != null ? a.getAssignedTo().getFullName() : "Unassigned");
            }

            for (int i = 0; i < columns.length; i++) {
                sheet.autoSizeColumn(i);
            }

            workbook.write(out);
            return out.toByteArray();
        } catch (Exception e) {
            throw new ReportGenerationException("Failed to generate Fixed Assets Excel report: " + e.getMessage());
        }
    }

    @Override
    @Transactional(readOnly = true)
    public byte[] exportAssetsPdf() {
        try (ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Document document = new Document(PageSize.A4.rotate(), 20, 20, 30, 30);
            PdfWriter.getInstance(document, out);
            document.open();

            // Title
            Font titleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 16, Color.DARK_GRAY);
            Paragraph title = new Paragraph("Apex Pharmacy - Fixed Assets Register Report", titleFont);
            title.setAlignment(Element.ALIGN_CENTER);
            title.setSpacingAfter(15);
            document.add(title);

            // Table
            PdfPTable table = new PdfPTable(8);
            table.setWidthPercentage(100);
            table.setWidths(new float[]{1.5f, 2.5f, 1.5f, 1.5f, 1.5f, 1.5f, 1.2f, 1.8f});

            String[] headers = {"Asset Code", "Name", "Category", "Purchase Date", "Cost (ETB)", "Book Value", "Status", "Assigned To"};
            for (String h : headers) {
                PdfPCell cell = new PdfPCell(new Phrase(h, FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10, Color.WHITE)));
                cell.setBackgroundColor(new Color(15, 23, 42));
                cell.setPadding(6);
                cell.setHorizontalAlignment(Element.ALIGN_CENTER);
                table.addCell(cell);
            }

            List<FixedAsset> assets = assetRepository.findAll();
            Font dataFont = FontFactory.getFont(FontFactory.HELVETICA, 9);
            for (FixedAsset a : assets) {
                table.addCell(new Phrase(a.getAssetCode(), dataFont));
                table.addCell(new Phrase(a.getName(), dataFont));
                table.addCell(new Phrase(a.getCategory() != null ? a.getCategory().name() : "", dataFont));
                table.addCell(new Phrase(a.getPurchaseDate() != null ? a.getPurchaseDate().toString() : "", dataFont));
                table.addCell(new Phrase(a.getPurchaseCost() != null ? a.getPurchaseCost().toString() : "0.00", dataFont));
                table.addCell(new Phrase(a.getCurrentBookValue() != null ? a.getCurrentBookValue().toString() : "0.00", dataFont));
                table.addCell(new Phrase(a.getStatus() != null ? a.getStatus().name() : "", dataFont));
                table.addCell(new Phrase(a.getAssignedTo() != null ? a.getAssignedTo().getFullName() : "Unassigned", dataFont));
            }

            document.add(table);
            document.close();
            return out.toByteArray();
        } catch (Exception e) {
            throw new ReportGenerationException("Failed to generate Fixed Assets PDF report: " + e.getMessage());
        }
    }
}
