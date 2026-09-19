package com.pharmacy.pms.service;

import com.pharmacy.pms.dto.request.PosCheckoutRequest;
import com.pharmacy.pms.dto.response.PosReceiptResponse;

public interface PosService {
    PosReceiptResponse processCheckout(PosCheckoutRequest request, Long cashierId);
    PosReceiptResponse getReceiptByInvoice(String invoiceNumber);
}
