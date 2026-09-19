package com.pharmacy.pms.service.impl;

import com.pharmacy.pms.dto.request.PosCartItemRequest;
import com.pharmacy.pms.dto.request.PosCheckoutRequest;
import com.pharmacy.pms.dto.response.PosReceiptResponse;
import com.pharmacy.pms.exception.BadRequestException;
import com.pharmacy.pms.exception.InsufficientStockException;
import com.pharmacy.pms.exception.ResourceNotFoundException;
import com.pharmacy.pms.model.entity.*;
import com.pharmacy.pms.model.enums.CustomerType;
import com.pharmacy.pms.model.enums.MovementType;
import com.pharmacy.pms.model.enums.PaymentMethod;
import com.pharmacy.pms.repository.*;
import com.pharmacy.pms.service.InventoryService;
import com.pharmacy.pms.service.PosService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
public class PosServiceImpl implements PosService {

    private final SaleRepository saleRepository;
    private final SaleItemRepository saleItemRepository;
    private final DrugRepository drugRepository;
    private final DrugBatchRepository batchRepository;
    private final CustomerRepository customerRepository;
    private final UserRepository userRepository;
    private final InventoryService inventoryService;

    public PosServiceImpl(SaleRepository saleRepository, SaleItemRepository saleItemRepository,
                          DrugRepository drugRepository, DrugBatchRepository batchRepository,
                          CustomerRepository customerRepository, UserRepository userRepository,
                          InventoryService inventoryService) {
        this.saleRepository = saleRepository;
        this.saleItemRepository = saleItemRepository;
        this.drugRepository = drugRepository;
        this.batchRepository = batchRepository;
        this.customerRepository = customerRepository;
        this.userRepository = userRepository;
        this.inventoryService = inventoryService;
    }

    @Override
    @Transactional
    public PosReceiptResponse processCheckout(PosCheckoutRequest request, Long cashierId) {
        User cashier = userRepository.findById(cashierId)
                .orElseThrow(() -> new ResourceNotFoundException("Cashier not found with ID: " + cashierId));

        Customer customer = resolveCustomer(request.getCustomerId());
        String invoiceNumber = generateInvoiceNumber();

        Sale sale = new Sale();
        sale.setInvoiceNumber(invoiceNumber);
        sale.setCustomer(customer);
        sale.setBranch(cashier.getBranch());
        sale.setCashier(cashier);
        sale.setSaleType(request.getSaleType() != null ? request.getSaleType() : CustomerType.RETAIL);
        sale.setPaymentMethod(request.getPaymentMethod());
        sale.setPrescriptionNumber(request.getPrescriptionNumber());
        sale.setDoctorName(request.getDoctorName());

        List<SaleItem> saleItems = new ArrayList<>();
        BigDecimal[] totals = processAllCartItems(request, invoiceNumber, cashierId, sale, saleItems);
        BigDecimal subtotal = totals[0];
        BigDecimal totalItemDiscount = totals[1];

        BigDecimal overallDiscount = request.getOverallDiscount() != null ? request.getOverallDiscount() : BigDecimal.ZERO;
        BigDecimal grandDiscount = totalItemDiscount.add(overallDiscount);
        BigDecimal grandTotal = subtotal.subtract(grandDiscount).max(BigDecimal.ZERO);

        BigDecimal paid = request.getPaidAmount() != null ? request.getPaidAmount() : grandTotal;
        BigDecimal change = handleCustomerCredit(request.getPaymentMethod(), customer, grandTotal, paid);

        sale.setSubtotal(subtotal);
        sale.setDiscountAmount(grandDiscount);
        sale.setTaxAmount(BigDecimal.ZERO);
        sale.setGrandTotal(grandTotal);
        sale.setPaidAmount(paid);
        sale.setChangeAmount(change);
        sale.setItems(saleItems);

        Sale savedSale = saleRepository.save(sale);
        for (SaleItem item : saleItems) {
            item.setSale(savedSale);
            saleItemRepository.save(item);
        }

        return new PosReceiptResponse(savedSale);
    }

    private BigDecimal[] processAllCartItems(PosCheckoutRequest request, String invoiceNumber, Long cashierId, Sale sale, List<SaleItem> saleItems) {
        BigDecimal subtotal = BigDecimal.ZERO;
        BigDecimal totalItemDiscount = BigDecimal.ZERO;

        for (PosCartItemRequest itemReq : request.getItems()) {
            BigDecimal[] itemTotals = processSingleCartItem(itemReq, request.getSaleType(), invoiceNumber, cashierId, sale, saleItems);
            subtotal = subtotal.add(itemTotals[0]);
            totalItemDiscount = totalItemDiscount.add(itemTotals[1]);
        }
        return new BigDecimal[]{subtotal, totalItemDiscount};
    }

    private BigDecimal[] processSingleCartItem(PosCartItemRequest itemReq, CustomerType saleType, String invoiceNumber, Long cashierId, Sale sale, List<SaleItem> saleItems) {
        Drug drug = drugRepository.findById(itemReq.getDrugId())
                .orElseThrow(() -> new ResourceNotFoundException("Drug not found with ID: " + itemReq.getDrugId()));

        int neededQuantity = itemReq.getQuantity();
        List<DrugBatch> batches = fetchBatchesForCartItem(itemReq, drug);

        int totalAvailable = batches.stream().mapToInt(DrugBatch::getQuantityOnHand).sum();
        if (totalAvailable < neededQuantity) {
            throw new InsufficientStockException("Insufficient stock for " + drug.getName() + " (" + drug.getGenericName() + "). Requested: " + neededQuantity + ", Available: " + totalAvailable);
        }

        BigDecimal itemSubtotal = BigDecimal.ZERO;
        BigDecimal itemDiscount = BigDecimal.ZERO;

        for (DrugBatch batch : batches) {
            if (neededQuantity <= 0) break;

            int deductQty = Math.min(batch.getQuantityOnHand(), neededQuantity);
            batch.setQuantityOnHand(batch.getQuantityOnHand() - deductQty);
            batchRepository.save(batch);

            inventoryService.recordMovement(batch, cashierId, MovementType.SALE, -deductQty, "SALE", null, "POS Sale Invoice: " + invoiceNumber);

            BigDecimal unitPrice = resolveUnitPrice(itemReq, saleType, batch);
            BigDecimal lineSubtotal = unitPrice.multiply(BigDecimal.valueOf(deductQty));
            BigDecimal lineDiscount = itemReq.getDiscountAmount() != null ? itemReq.getDiscountAmount() : BigDecimal.ZERO;
            BigDecimal lineTotal = lineSubtotal.subtract(lineDiscount);

            SaleItem saleItem = new SaleItem();
            saleItem.setSale(sale);
            saleItem.setDrugBatch(batch);
            saleItem.setQuantity(deductQty);
            saleItem.setUnitPrice(unitPrice);
            saleItem.setCostPriceAtSale(batch.getBuyingPrice());
            saleItem.setDiscountAmount(lineDiscount);
            saleItem.setSubtotal(lineTotal);

            itemSubtotal = itemSubtotal.add(lineSubtotal);
            itemDiscount = itemDiscount.add(lineDiscount);
            saleItems.add(saleItem);

            neededQuantity -= deductQty;
        }

        return new BigDecimal[]{itemSubtotal, itemDiscount};
    }

    private List<DrugBatch> fetchBatchesForCartItem(PosCartItemRequest itemReq, Drug drug) {
        if (itemReq.getBatchId() != null) {
            DrugBatch specificBatch = batchRepository.findById(itemReq.getBatchId())
                    .orElseThrow(() -> new ResourceNotFoundException("Batch not found with ID: " + itemReq.getBatchId()));
            return List.of(specificBatch);
        }
        return batchRepository.findActiveBatchesByDrugFefo(drug.getId(), LocalDate.now());
    }

    private BigDecimal resolveUnitPrice(PosCartItemRequest itemReq, CustomerType saleType, DrugBatch batch) {
        if (itemReq.getCustomUnitPrice() != null && itemReq.getCustomUnitPrice().compareTo(BigDecimal.ZERO) > 0) {
            return itemReq.getCustomUnitPrice();
        }
        if (saleType == CustomerType.WHOLESALE && batch.getWholesalePrice() != null && batch.getWholesalePrice().compareTo(BigDecimal.ZERO) > 0) {
            return batch.getWholesalePrice();
        }
        if (saleType == CustomerType.DISTRIBUTOR && batch.getDistributorPrice() != null && batch.getDistributorPrice().compareTo(BigDecimal.ZERO) > 0) {
            return batch.getDistributorPrice();
        }
        return batch.getRetailPrice();
    }

    private BigDecimal handleCustomerCredit(PaymentMethod paymentMethod, Customer customer, BigDecimal grandTotal, BigDecimal paid) {
        if (paymentMethod == PaymentMethod.CREDIT_ACCOUNT) {
            if (customer == null) {
                throw new BadRequestException("Credit / On-Account sale requires a registered customer");
            }
            customer.setCurrentBalance(customer.getCurrentBalance().add(grandTotal.subtract(paid)));
            customerRepository.save(customer);
            return BigDecimal.ZERO;
        }
        return paid.compareTo(grandTotal) > 0 ? paid.subtract(grandTotal) : BigDecimal.ZERO;
    }

    private Customer resolveCustomer(Long customerId) {
        if (customerId == null) {
            return null;
        }
        return customerRepository.findById(customerId)
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found with ID: " + customerId));
    }

    private String generateInvoiceNumber() {
        return "INV-" + DateTimeFormatter.ofPattern("yyyyMMdd").format(LocalDateTime.now()) + "-" + UUID.randomUUID().toString().substring(0, 6).toUpperCase();
    }

    @Override
    @Transactional(readOnly = true)
    public PosReceiptResponse getReceiptByInvoice(String invoiceNumber) {
        Sale sale = saleRepository.findByInvoiceNumber(invoiceNumber)
                .orElseThrow(() -> new ResourceNotFoundException("Invoice not found: " + invoiceNumber));
        return new PosReceiptResponse(sale);
    }
}
