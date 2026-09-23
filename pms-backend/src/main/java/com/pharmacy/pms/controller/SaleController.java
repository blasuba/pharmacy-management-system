package com.pharmacy.pms.controller;

import com.pharmacy.pms.dto.response.ApiResponse;
import com.pharmacy.pms.model.entity.Sale;
import com.pharmacy.pms.model.enums.PaymentMethod;
import com.pharmacy.pms.service.PosService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/sales")
public class SaleController {

    private final PosService posService;

    public SaleController(PosService posService) {
        this.posService = posService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<Sale>>> getAllSales(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(required = false) PaymentMethod paymentMethod) {
        List<Sale> sales = posService.getAllSales(startDate, endDate, paymentMethod);
        return ResponseEntity.ok(ApiResponse.success(sales));
    }
}
