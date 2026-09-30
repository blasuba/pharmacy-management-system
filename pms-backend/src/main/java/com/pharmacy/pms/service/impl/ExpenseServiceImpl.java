package com.pharmacy.pms.service.impl;

import com.pharmacy.pms.dto.request.ExpenseCreateRequest;
import com.pharmacy.pms.exception.ResourceNotFoundException;
import com.pharmacy.pms.model.entity.Branch;
import com.pharmacy.pms.model.entity.Expense;
import com.pharmacy.pms.model.entity.User;
import com.pharmacy.pms.model.enums.ExpenseCategory;
import com.pharmacy.pms.repository.BranchRepository;
import com.pharmacy.pms.repository.ExpenseRepository;
import com.pharmacy.pms.repository.UserRepository;
import com.pharmacy.pms.service.ExpenseService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;

@Service
public class ExpenseServiceImpl implements ExpenseService {

    private final ExpenseRepository expenseRepository;
    private final UserRepository userRepository;
    private final BranchRepository branchRepository;

    public ExpenseServiceImpl(ExpenseRepository expenseRepository,
                              UserRepository userRepository,
                              BranchRepository branchRepository) {
        this.expenseRepository = expenseRepository;
        this.userRepository = userRepository;
        this.branchRepository = branchRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public List<Expense> getAllExpenses(LocalDate startDate, LocalDate endDate, ExpenseCategory category) {
        if (startDate != null && endDate != null) {
            if (category != null) {
                return expenseRepository.findByCategoryAndExpenseDateBetween(category, startDate, endDate);
            }
            return expenseRepository.findExpensesBetweenDates(startDate, endDate);
        }
        return expenseRepository.findByOrderByExpenseDateDescCreatedAtDesc();
    }

    @Override
    @Transactional(readOnly = true)
    public Expense getExpenseById(Long id) {
        return expenseRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Expense not found with ID: " + id));
    }

    @Override
    @Transactional
    public Expense createExpense(ExpenseCreateRequest request, Long userId) {
        Expense expense = new Expense();
        populateExpenseData(expense, request);

        if (userId != null) {
            User user = userRepository.findById(userId).orElse(null);
            expense.setRecordedBy(user);
        }

        if (request.getBranchId() != null) {
            Branch branch = branchRepository.findById(request.getBranchId()).orElse(null);
            expense.setBranch(branch);
        } else {
            List<Branch> branches = branchRepository.findAll();
            if (!branches.isEmpty()) {
                expense.setBranch(branches.get(0));
            }
        }

        return expenseRepository.save(expense);
    }

    @Override
    @Transactional
    public Expense updateExpense(Long id, ExpenseCreateRequest request, Long userId) {
        Expense expense = getExpenseById(id);
        populateExpenseData(expense, request);

        if (request.getBranchId() != null) {
            Branch branch = branchRepository.findById(request.getBranchId()).orElse(null);
            expense.setBranch(branch);
        }

        return expenseRepository.save(expense);
    }

    @Override
    @Transactional
    public void deleteExpense(Long id, Long userId) {
        Expense expense = getExpenseById(id);
        expenseRepository.delete(expense);
    }

    @Override
    @Transactional(readOnly = true)
    public Map<String, Object> getExpenseSummary(LocalDate startDate, LocalDate endDate) {
        LocalDate start = startDate != null ? startDate : LocalDate.now().withDayOfMonth(1);
        LocalDate end = endDate != null ? endDate : LocalDate.now();

        List<Expense> expenses = expenseRepository.findExpensesBetweenDates(start, end);

        BigDecimal totalAmount = BigDecimal.ZERO;
        Map<String, BigDecimal> byCategory = new LinkedHashMap<>();
        Map<String, BigDecimal> byPaymentMethod = new LinkedHashMap<>();

        for (ExpenseCategory cat : ExpenseCategory.values()) {
            byCategory.put(cat.name(), BigDecimal.ZERO);
        }

        for (Expense e : expenses) {
            totalAmount = totalAmount.add(e.getAmount());

            String catKey = e.getCategory().name();
            byCategory.put(catKey, byCategory.getOrDefault(catKey, BigDecimal.ZERO).add(e.getAmount()));

            String pmKey = e.getPaymentMethod().name();
            byPaymentMethod.put(pmKey, byPaymentMethod.getOrDefault(pmKey, BigDecimal.ZERO).add(e.getAmount()));
        }

        Map<String, Object> res = new HashMap<>();
        res.put("startDate", start);
        res.put("endDate", end);
        res.put("totalExpenses", totalAmount);
        res.put("count", expenses.size());
        res.put("byCategory", byCategory);
        res.put("byPaymentMethod", byPaymentMethod);
        return res;
    }

    private void populateExpenseData(Expense expense, ExpenseCreateRequest req) {
        expense.setTitle(req.getTitle().trim());
        expense.setCategory(req.getCategory());
        expense.setAmount(req.getAmount());
        expense.setExpenseDate(req.getExpenseDate() != null ? req.getExpenseDate() : LocalDate.now());
        expense.setPaymentMethod(req.getPaymentMethod());
        expense.setReceiptNumber(req.getReceiptNumber());
        expense.setVendorOrPayee(req.getVendorOrPayee());
        expense.setNotes(req.getNotes());
    }
}
