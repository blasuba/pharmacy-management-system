package com.pharmacy.pms.service;

import com.pharmacy.pms.dto.request.CustomerPaymentRequest;
import com.pharmacy.pms.model.entity.Customer;
import java.util.List;

public interface CustomerService {
    List<Customer> getAllCustomers(String query);
    Customer createCustomer(Customer customer);
    Customer getCustomerById(Long id);
    Customer updateCustomer(Long id, Customer customer);
    void deleteCustomer(Long id);
    Customer settleCreditPayment(Long customerId, CustomerPaymentRequest request, Long cashierId);
}
