package com.pharmacy.pms.service.impl;

import com.pharmacy.pms.exception.ResourceNotFoundException;
import com.pharmacy.pms.model.entity.Supplier;
import com.pharmacy.pms.repository.SupplierRepository;
import com.pharmacy.pms.service.SupplierService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class SupplierServiceImpl implements SupplierService {

    private final SupplierRepository supplierRepository;

    public SupplierServiceImpl(SupplierRepository supplierRepository) {
        this.supplierRepository = supplierRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public List<Supplier> getAllSuppliers() {
        return supplierRepository.findAll();
    }

    @Override
    @Transactional
    public Supplier createSupplier(Supplier supplier) {
        return supplierRepository.save(supplier);
    }

    @Override
    @Transactional(readOnly = true)
    public Supplier getSupplierById(Long id) {
        return supplierRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Supplier not found with ID: " + id));
    }

    @Override
    @Transactional
    public Supplier updateSupplier(Long id, Supplier supplier) {
        Supplier existing = getSupplierById(id);
        existing.setName(supplier.getName());
        existing.setContactPerson(supplier.getContactPerson());
        existing.setPhone(supplier.getPhone());
        existing.setEmail(supplier.getEmail());
        existing.setTaxNumber(supplier.getTaxNumber());
        existing.setAddress(supplier.getAddress());
        if (supplier.getPaymentTermsDays() != null) {
            existing.setPaymentTermsDays(supplier.getPaymentTermsDays());
        }
        return supplierRepository.save(existing);
    }

    @Override
    @Transactional
    public void deleteSupplier(Long id) {
        Supplier existing = getSupplierById(id);
        supplierRepository.delete(existing);
    }
}
