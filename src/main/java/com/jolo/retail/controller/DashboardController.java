package com.jolo.retail.controller;

import com.jolo.retail.dto.DashboardStats;
import com.jolo.retail.model.Order;
import com.jolo.retail.repository.CustomerRepository;
import com.jolo.retail.repository.OrderRepository;
import com.jolo.retail.repository.ProductRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/dashboard")
@CrossOrigin(origins = "*")
public class DashboardController {
    private final OrderRepository orderRepository;
    private final ProductRepository productRepository;
    private final CustomerRepository customerRepository;

    public DashboardController(OrderRepository orderRepository, ProductRepository productRepository, CustomerRepository customerRepository) {
        this.orderRepository = orderRepository;
        this.productRepository = productRepository;
        this.customerRepository = customerRepository;
    }

    @GetMapping("/stats")
    public ResponseEntity<DashboardStats> getStats() {
        BigDecimal totalSales = orderRepository.calculateTotalRevenue();
        long totalOrders = orderRepository.count();
        long totalCustomers = customerRepository.count();
        long lowStockCount = productRepository.countLowStockProducts();

        // Fetch recent 5 orders
        List<Order> recentOrders = orderRepository.findAllByOrderByOrderDateDesc()
                .stream()
                .limit(5)
                .collect(Collectors.toList());

        // Category distribution mapping
        List<Object[]> catCountsRaw = productRepository.countProductsByCategory();
        Map<String, Long> categoryDistribution = new HashMap<>();
        for (Object[] row : catCountsRaw) {
            String category = (String) row[0];
            Long count = (Long) row[1];
            if (category != null) {
                categoryDistribution.put(category, count);
            }
        }

        // Daily sales trends mapping
        List<Object[]> trendsRaw = orderRepository.findDailySalesTrends();
        List<DashboardStats.SalesTrendPoint> salesTrends = new ArrayList<>();
        for (Object[] row : trendsRaw) {
            // Grouping returns Java SQL Date or Local Date, print date as string
            String dateStr = row[0].toString();
            BigDecimal dailySum = (BigDecimal) row[1];
            salesTrends.add(new DashboardStats.SalesTrendPoint(dateStr, dailySum));
        }

        DashboardStats stats = new DashboardStats(
                totalSales,
                totalOrders,
                totalCustomers,
                lowStockCount,
                recentOrders,
                categoryDistribution,
                salesTrends
        );

        return ResponseEntity.ok(stats);
    }
}
