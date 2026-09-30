package com.pharmacy.pms.service;

import com.pharmacy.pms.dto.request.PurchaseOrderCreateRequest;
import com.pharmacy.pms.model.entity.PurchaseOrder;
import java.util.List;

public interface PurchaseService {
    List<PurchaseOrder> getAllPurchaseOrders();
    PurchaseOrder getPurchaseOrderById(Long id);
    PurchaseOrder createPurchaseOrder(PurchaseOrderCreateRequest request, Long userId);
    PurchaseOrder updatePurchaseOrder(Long id, PurchaseOrderCreateRequest request, Long userId);
    void deletePurchaseOrder(Long id, Long userId);
    PurchaseOrder receiveGoods(Long poId, Long userId);
}
