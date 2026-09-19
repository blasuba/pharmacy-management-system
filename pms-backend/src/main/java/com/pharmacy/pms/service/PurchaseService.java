package com.pharmacy.pms.service;

import com.pharmacy.pms.model.entity.PurchaseOrder;
import java.util.List;

public interface PurchaseService {
    List<PurchaseOrder> getAllPurchaseOrders();
    PurchaseOrder getPurchaseOrderById(Long id);
    PurchaseOrder receiveGoods(Long poId, Long userId);
}
