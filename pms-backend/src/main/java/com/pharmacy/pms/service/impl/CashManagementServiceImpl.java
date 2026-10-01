package com.pharmacy.pms.service.impl;

import com.pharmacy.pms.dto.request.CashTransactionRequest;
import com.pharmacy.pms.dto.request.CloseShiftRequest;
import com.pharmacy.pms.dto.request.OpenShiftRequest;
import com.pharmacy.pms.dto.response.CashShiftResponse;
import com.pharmacy.pms.exception.BadRequestException;
import com.pharmacy.pms.exception.ResourceNotFoundException;
import com.pharmacy.pms.model.entity.CashShift;
import com.pharmacy.pms.model.entity.CashTransaction;
import com.pharmacy.pms.model.entity.User;
import com.pharmacy.pms.model.enums.CashTransactionType;
import com.pharmacy.pms.model.enums.PaymentMethod;
import com.pharmacy.pms.model.enums.ShiftStatus;
import com.pharmacy.pms.repository.CashShiftRepository;
import com.pharmacy.pms.repository.CashTransactionRepository;
import com.pharmacy.pms.repository.UserRepository;
import com.pharmacy.pms.service.CashManagementService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.UUID;

@Service
public class CashManagementServiceImpl implements CashManagementService {

    private static final String USER_NOT_FOUND = "User not found with ID: ";
    private static final String NO_ACTIVE_SHIFT = "No active shift found for this cashier. Please open a register shift first.";

    private final CashShiftRepository shiftRepository;
    private final CashTransactionRepository transactionRepository;
    private final UserRepository userRepository;

    public CashManagementServiceImpl(CashShiftRepository shiftRepository,
                                     CashTransactionRepository transactionRepository,
                                     UserRepository userRepository) {
        this.shiftRepository = shiftRepository;
        this.transactionRepository = transactionRepository;
        this.userRepository = userRepository;
    }

    @Override
    @Transactional
    public CashShiftResponse openShift(OpenShiftRequest request, Long cashierId) {
        User cashier = userRepository.findById(cashierId)
                .orElseThrow(() -> new ResourceNotFoundException(USER_NOT_FOUND + cashierId));

        if (shiftRepository.findByCashierIdAndStatus(cashierId, ShiftStatus.OPEN).isPresent()) {
            throw new BadRequestException("You already have an active open shift. Close the existing shift before opening a new one.");
        }

        String shiftNumber = "SFT-" + DateTimeFormatter.ofPattern("yyyyMMdd").format(LocalDateTime.now()) + "-" + UUID.randomUUID().toString().substring(0, 4).toUpperCase();

        CashShift shift = new CashShift();
        shift.setShiftNumber(shiftNumber);
        shift.setCashier(cashier);
        shift.setBranch(cashier.getBranch());
        shift.setStatus(ShiftStatus.OPEN);
        shift.setOpenedAt(LocalDateTime.now());
        shift.setOpeningBalance(request.getOpeningBalance());
        shift.setExpectedCash(request.getOpeningBalance());
        shift.setNotes(request.getNotes());

        CashShift saved = shiftRepository.save(shift);

        if (request.getOpeningBalance().compareTo(BigDecimal.ZERO) > 0) {
            CashTransaction openingTx = new CashTransaction();
            openingTx.setShift(saved);
            openingTx.setTransactionType(CashTransactionType.CASH_IN);
            openingTx.setAmount(request.getOpeningBalance());
            openingTx.setCategory("OPENING_FLOAT");
            openingTx.setReason("Starting register drawer float");
            openingTx.setPerformedBy(cashier);
            transactionRepository.save(openingTx);
        }

        return new CashShiftResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public CashShiftResponse getCurrentShift(Long cashierId) {
        CashShift shift = shiftRepository.findByCashierIdAndStatus(cashierId, ShiftStatus.OPEN)
                .orElse(null);
        if (shift == null) {
            return null;
        }
        computeExpectedCash(shift);
        return new CashShiftResponse(shift);
    }

    @Override
    @Transactional
    public CashShiftResponse recordCashTransaction(CashTransactionRequest request, Long cashierId) {
        User user = userRepository.findById(cashierId)
                .orElseThrow(() -> new ResourceNotFoundException(USER_NOT_FOUND + cashierId));

        CashShift shift = shiftRepository.findByCashierIdAndStatus(cashierId, ShiftStatus.OPEN)
                .orElseThrow(() -> new BadRequestException(NO_ACTIVE_SHIFT));

        CashTransaction tx = new CashTransaction();
        tx.setShift(shift);
        tx.setTransactionType(request.getType());
        tx.setAmount(request.getAmount());
        tx.setCategory(request.getCategory());
        tx.setReason(request.getReason());
        tx.setPerformedBy(user);
        transactionRepository.save(tx);

        if (request.getType() == CashTransactionType.CASH_IN) {
            shift.setCashInTotal(shift.getCashInTotal().add(request.getAmount()));
        } else {
            shift.setCashOutTotal(shift.getCashOutTotal().add(request.getAmount()));
        }

        computeExpectedCash(shift);
        CashShift updated = shiftRepository.save(shift);
        return new CashShiftResponse(updated);
    }

    @Override
    @Transactional
    public CashShiftResponse closeShift(CloseShiftRequest request, Long cashierId) {
        CashShift shift = shiftRepository.findByCashierIdAndStatus(cashierId, ShiftStatus.OPEN)
                .orElseThrow(() -> new BadRequestException(NO_ACTIVE_SHIFT));

        computeExpectedCash(shift);

        BigDecimal actual = request.getClosingActualCash();
        BigDecimal expected = shift.getExpectedCash();
        BigDecimal discrepancy = actual.subtract(expected);

        shift.setClosingActualCash(actual);
        shift.setDiscrepancy(discrepancy);
        shift.setStatus(ShiftStatus.CLOSED);
        shift.setClosedAt(LocalDateTime.now());
        if (request.getNotes() != null && !request.getNotes().trim().isEmpty()) {
            String combinedNotes = (shift.getNotes() != null ? shift.getNotes() + "\n" : "") + "Closing Notes: " + request.getNotes().trim();
            shift.setNotes(combinedNotes);
        }

        CashShift saved = shiftRepository.save(shift);
        return new CashShiftResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public List<CashShiftResponse> getAllShifts() {
        return shiftRepository.findByOrderByOpenedAtDesc().stream()
                .map(s -> {
                    if (s.getStatus() == ShiftStatus.OPEN) {
                        computeExpectedCash(s);
                    }
                    return new CashShiftResponse(s);
                })
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<CashTransaction> getShiftTransactions(Long shiftId) {
        return transactionRepository.findByShiftIdOrderByCreatedAtDesc(shiftId);
    }

    @Override
    @Transactional
    public void recordSaleInShift(Long cashierId, BigDecimal amount, PaymentMethod paymentMethod) {
        // Credit sales are accounts receivable — no money collected, don't touch the drawer
        if (paymentMethod == PaymentMethod.CREDIT_ACCOUNT) {
            return;
        }

        CashShift shift = shiftRepository.findByCashierIdAndStatus(cashierId, ShiftStatus.OPEN)
                .orElse(null);
        if (shift == null) {
            return;
        }

        if (paymentMethod == PaymentMethod.CASH) {
            shift.setCashSalesTotal(shift.getCashSalesTotal().add(amount));
        } else {
            // MOBILE_MONEY, CARD, etc. — tracked for reporting, does NOT affect expected drawer cash
            shift.setDigitalSalesTotal(shift.getDigitalSalesTotal().add(amount));
        }

        computeExpectedCash(shift);
        shiftRepository.save(shift);
    }

    private void computeExpectedCash(CashShift shift) {
        // Expected Cash in Drawer = Opening Balance + Cash Sales + Cash In - Cash Out
        BigDecimal opening = shift.getOpeningBalance() != null ? shift.getOpeningBalance() : BigDecimal.ZERO;
        BigDecimal cashSales = shift.getCashSalesTotal() != null ? shift.getCashSalesTotal() : BigDecimal.ZERO;
        BigDecimal cashIn = shift.getCashInTotal() != null ? shift.getCashInTotal() : BigDecimal.ZERO;
        BigDecimal cashOut = shift.getCashOutTotal() != null ? shift.getCashOutTotal() : BigDecimal.ZERO;

        BigDecimal expected = opening.add(cashSales).add(cashIn).subtract(cashOut);
        shift.setExpectedCash(expected);
    }
}
