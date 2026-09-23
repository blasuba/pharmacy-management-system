package com.pharmacy.pms.service;

import com.pharmacy.pms.dto.request.CashTransactionRequest;
import com.pharmacy.pms.dto.request.CloseShiftRequest;
import com.pharmacy.pms.dto.request.OpenShiftRequest;
import com.pharmacy.pms.dto.response.CashShiftResponse;
import com.pharmacy.pms.model.entity.CashTransaction;
import com.pharmacy.pms.model.enums.PaymentMethod;

import java.math.BigDecimal;
import java.util.List;

public interface CashManagementService {

    CashShiftResponse openShift(OpenShiftRequest request, Long cashierId);

    CashShiftResponse getCurrentShift(Long cashierId);

    CashShiftResponse recordCashTransaction(CashTransactionRequest request, Long cashierId);

    CashShiftResponse closeShift(CloseShiftRequest request, Long cashierId);

    List<CashShiftResponse> getAllShifts();

    List<CashTransaction> getShiftTransactions(Long shiftId);

    void recordSaleInShift(Long cashierId, BigDecimal amount, PaymentMethod paymentMethod);
}
