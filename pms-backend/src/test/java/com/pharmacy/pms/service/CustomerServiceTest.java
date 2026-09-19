package com.pharmacy.pms.service;

import com.pharmacy.pms.exception.ResourceNotFoundException;
import com.pharmacy.pms.model.entity.Customer;
import com.pharmacy.pms.model.enums.CustomerType;
import com.pharmacy.pms.repository.CustomerRepository;
import com.pharmacy.pms.service.impl.CustomerServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CustomerServiceTest {

    @Mock
    private CustomerRepository customerRepository;

    @InjectMocks
    private CustomerServiceImpl customerService;

    private Customer sampleCustomer;

    @BeforeEach
    void setUp() {
        sampleCustomer = new Customer();
        sampleCustomer.setName("Alpha Clinic");
        sampleCustomer.setPhone("+251-911-111111");
        sampleCustomer.setEmail("alpha@clinic.et");
        sampleCustomer.setCustomerType(CustomerType.WHOLESALE);
        sampleCustomer.setCreditLimit(BigDecimal.valueOf(10000));
        sampleCustomer.setCurrentBalance(BigDecimal.ZERO);
    }

    @Test
    void testGetAllCustomers_NoQuery() {
        when(customerRepository.findAll()).thenReturn(List.of(sampleCustomer));
        List<Customer> list = customerService.getAllCustomers(null);
        assertEquals(1, list.size());
        verify(customerRepository, times(1)).findAll();
    }

    @Test
    void testGetAllCustomers_WithQuery() {
        when(customerRepository.searchCustomers("Alpha")).thenReturn(List.of(sampleCustomer));
        List<Customer> list = customerService.getAllCustomers("Alpha");
        assertEquals(1, list.size());
        verify(customerRepository, times(1)).searchCustomers("Alpha");
    }

    @Test
    void testGetCustomerById_Found() {
        when(customerRepository.findById(1L)).thenReturn(Optional.of(sampleCustomer));
        Customer found = customerService.getCustomerById(1L);
        assertNotNull(found);
        assertEquals("Alpha Clinic", found.getName());
    }

    @Test
    void testGetCustomerById_NotFound() {
        when(customerRepository.findById(99L)).thenReturn(Optional.empty());
        assertThrows(ResourceNotFoundException.class, () -> customerService.getCustomerById(99L));
    }

    @Test
    void testCreateCustomer() {
        when(customerRepository.save(any(Customer.class))).thenReturn(sampleCustomer);
        Customer created = customerService.createCustomer(sampleCustomer);
        assertNotNull(created);
        assertEquals("Alpha Clinic", created.getName());
    }

    @Test
    void testUpdateCustomer_Success() {
        when(customerRepository.findById(1L)).thenReturn(Optional.of(sampleCustomer));
        when(customerRepository.save(any(Customer.class))).thenReturn(sampleCustomer);

        Customer update = new Customer();
        update.setName("Alpha Clinic Updated");
        update.setPhone("+251-922-222222");
        update.setEmail("updated@clinic.et");
        update.setCustomerType(CustomerType.DISTRIBUTOR);
        update.setCreditLimit(BigDecimal.valueOf(25000));

        Customer result = customerService.updateCustomer(1L, update);
        assertNotNull(result);
        assertEquals("Alpha Clinic Updated", result.getName());
    }

    @Test
    void testDeleteCustomer_Success() {
        when(customerRepository.findById(1L)).thenReturn(Optional.of(sampleCustomer));
        doNothing().when(customerRepository).delete(sampleCustomer);

        assertDoesNotThrow(() -> customerService.deleteCustomer(1L));
        verify(customerRepository, times(1)).delete(sampleCustomer);
    }
}
