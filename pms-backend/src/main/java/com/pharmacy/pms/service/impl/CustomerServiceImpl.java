package com.pharmacy.pms.service.impl;

import com.pharmacy.pms.exception.ResourceNotFoundException;
import com.pharmacy.pms.model.entity.Customer;
import com.pharmacy.pms.repository.CustomerRepository;
import com.pharmacy.pms.service.CustomerService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class CustomerServiceImpl implements CustomerService {

    private static final String CUSTOMER_NOT_FOUND = "Customer not found with ID: ";

    private final CustomerRepository customerRepository;

    public CustomerServiceImpl(CustomerRepository customerRepository) {
        this.customerRepository = customerRepository;
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
}
