package com.pharmacy.pms.service.impl;

import com.pharmacy.pms.dto.request.CashTransactionRequest;
import com.pharmacy.pms.dto.request.CustomerPaymentRequest;
import com.pharmacy.pms.exception.ResourceNotFoundException;
import com.pharmacy.pms.model.entity.Customer;
import com.pharmacy.pms.model.enums.CashTransactionType;
import com.pharmacy.pms.repository.CustomerRepository;
import com.pharmacy.pms.service.CashManagementService;
import com.pharmacy.pms.service.CustomerService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
public class CustomerServiceImpl implements CustomerService {

    private static final String CUSTOMER_NOT_FOUND = "Customer not found with ID: ";

    private final CustomerRepository customerRepository;
    private final CashManagementService cashManagementService;

    public CustomerServiceImpl(CustomerRepository customerRepository, CashManagementService cashManagementService) {
        this.customerRepository = customerRepository;
        this.cashManagementService = cashManagementService;
    }

    @Override
    @Transactional(readOnly = true)
    public List<Customer> getAllCustomers(String query) {
        if (query != null && !query.trim().isEmpty()) {
            return customerRepository.searchCustomers(query.trim());
        }
        return customerRepository.findAll();
    }

    @Override
    @Transactional
    public Customer createCustomer(Customer customer) {
        return customerRepository.save(customer);
    }

    @Override
    @Transactional(readOnly = true)
    public Customer getCustomerById(Long id) {
        return customerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(CUSTOMER_NOT_FOUND + id));
    }

    @Override
    @Transactional
    public Customer updateCustomer(Long id, Customer customer) {
        Customer existing = customerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(CUSTOMER_NOT_FOUND + id));

        existing.setName(customer.getName());
        existing.setPhone(customer.getPhone());
        existing.setEmail(customer.getEmail());
        existing.setTaxNumber(customer.getTaxNumber());
        existing.setAddress(customer.getAddress());
        if (customer.getCustomerType() != null) {
            existing.setCustomerType(customer.getCustomerType());
        }
        if (customer.getCreditLimit() != null) {
            existing.setCreditLimit(customer.getCreditLimit());
        }

        return customerRepository.save(existing);
    }

    @Override
    @Transactional
    public void deleteCustomer(Long id) {
        Customer existing = customerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(CUSTOMER_NOT_FOUND + id));
        customerRepository.delete(existing);
    }

    @Override
    @Transactional
    public Customer settleCreditPayment(Long customerId, CustomerPaymentRequest request, Long cashierId) {
        Customer customer = customerRepository.findById(customerId)
                .orElseThrow(() -> new ResourceNotFoundException(CUSTOMER_NOT_FOUND + customerId));

        BigDecimal current = customer.getCurrentBalance() != null ? customer.getCurrentBalance() : BigDecimal.ZERO;
        customer.setCurrentBalance(current.subtract(request.getAmount()).max(BigDecimal.ZERO));
        Customer saved = customerRepository.save(customer);

        // Record Cash-In into active cashier shift drawer
        CashTransactionRequest txReq = new CashTransactionRequest();
        txReq.setType(CashTransactionType.CASH_IN);
        txReq.setAmount(request.getAmount());
        txReq.setCategory("CUSTOMER_CREDIT_SETTLEMENT");
        txReq.setReason("Account settlement for " + customer.getName() + (request.getNotes() != null ? " - " + request.getNotes() : ""));
        try {
            cashManagementService.recordCashTransaction(txReq, cashierId);
        } catch (Exception ignored) {
            // Shift might not be open if performed by back-office admin
        }

        return saved;
    }
}
