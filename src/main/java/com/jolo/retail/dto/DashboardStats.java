package com.jolo.retail.dto;

import com.jolo.retail.model.Order;
import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

public class DashboardStats {
    private BigDecimal totalSales;
    private Long totalOrders;
    private Long totalCustomers;
    private Long lowStockCount;
    private List<Order> recentOrders;
    private Map<String, Long> categoryDistribution;
    private List<SalesTrendPoint> salesTrends;

    public DashboardStats() {}

    public DashboardStats(BigDecimal totalSales, Long totalOrders, Long totalCustomers, Long lowStockCount, List<Order> recentOrders, Map<String, Long> categoryDistribution, List<SalesTrendPoint> salesTrends) {
        this.totalSales = totalSales;
        this.totalOrders = totalOrders;
        this.totalCustomers = totalCustomers;
        this.lowStockCount = lowStockCount;
        this.recentOrders = recentOrders;
        this.categoryDistribution = categoryDistribution;
        this.salesTrends = salesTrends;
    }

    // Getters and Setters
    public BigDecimal getTotalSales() {
        return totalSales;
    }

    public void setTotalSales(BigDecimal totalSales) {
        this.totalSales = totalSales;
    }

    public Long getTotalOrders() {
        return totalOrders;
    }

    public void setTotalOrders(Long totalOrders) {
        this.totalOrders = totalOrders;
    }

    public Long getTotalCustomers() {
        return totalCustomers;
    }

    public void setTotalCustomers(Long totalCustomers) {
        this.totalCustomers = totalCustomers;
    }

    public Long getLowStockCount() {
        return lowStockCount;
    }

    public void setLowStockCount(Long lowStockCount) {
        this.lowStockCount = lowStockCount;
    }

    public List<Order> getRecentOrders() {
        return recentOrders;
    }

    public void setRecentOrders(List<Order> recentOrders) {
        this.recentOrders = recentOrders;
    }

    public Map<String, Long> getCategoryDistribution() {
        return categoryDistribution;
    }

    public void setCategoryDistribution(Map<String, Long> categoryDistribution) {
        this.categoryDistribution = categoryDistribution;
    }

    public List<SalesTrendPoint> getSalesTrends() {
        return salesTrends;
    }

    public void setSalesTrends(List<SalesTrendPoint> salesTrends) {
        this.salesTrends = salesTrends;
    }

    // Inner class for trend data points
    public static class SalesTrendPoint {
        private String date;
        private BigDecimal sales;

        public SalesTrendPoint(String date, BigDecimal sales) {
            this.date = date;
            this.sales = sales;
        }

        public String getDate() {
            return date;
        }

        public void setDate(String date) {
            this.date = date;
        }

        public BigDecimal getSales() {
            return sales;
        }

        public void setSales(BigDecimal sales) {
            this.sales = sales;
        }
    }
}
