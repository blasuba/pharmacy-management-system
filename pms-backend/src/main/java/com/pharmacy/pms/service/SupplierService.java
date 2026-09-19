package com.pharmacy.pms.service;

import com.pharmacy.pms.model.entity.Supplier;
import java.util.List;

public interface SupplierService {
    List<Supplier> getAllSuppliers();
    Supplier createSupplier(Supplier supplier);
    Supplier getSupplierById(Long id);
}
