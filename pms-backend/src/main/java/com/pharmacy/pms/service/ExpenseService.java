package com.pharmacy.pms.service;

import com.pharmacy.pms.dto.request.ExpenseCreateRequest;
import com.pharmacy.pms.model.entity.Expense;
import com.pharmacy.pms.model.enums.ExpenseCategory;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

public interface ExpenseService {
    List<Expense> getAllExpenses(LocalDate startDate, LocalDate endDate, ExpenseCategory category);
    Expense getExpenseById(Long id);
    Expense createExpense(ExpenseCreateRequest request, Long userId);
    Expense updateExpense(Long id, ExpenseCreateRequest request, Long userId);
    void deleteExpense(Long id, Long userId);
    Map<String, Object> getExpenseSummary(LocalDate startDate, LocalDate endDate);
}
