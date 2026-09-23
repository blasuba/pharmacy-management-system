package com.pharmacy.pms.service;

import com.pharmacy.pms.dto.request.PosCheckoutRequest;
import com.pharmacy.pms.dto.request.SaleRefundRequest;
import com.pharmacy.pms.dto.response.PosReceiptResponse;
import com.pharmacy.pms.model.entity.Sale;
import com.pharmacy.pms.model.enums.PaymentMethod;

import java.time.LocalDate;
import java.util.List;

public interface PosService {
    PosReceiptResponse processCheckout(PosCheckoutRequest request, Long cashierId);
    PosReceiptResponse getReceiptByInvoice(String invoiceNumber);
    List<Sale> getAllSales(LocalDate startDate, LocalDate endDate, PaymentMethod paymentMethod);
    PosReceiptResponse processRefund(SaleRefundRequest request, Long cashierId);
}
