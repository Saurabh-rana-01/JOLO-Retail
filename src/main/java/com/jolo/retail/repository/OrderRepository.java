package com.jolo.retail.repository;

import com.jolo.retail.model.Order;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {
    Optional<Order> findByOrderNumber(String orderNumber);
    List<Order> findAllByOrderByOrderDateDesc();
    
    @Query("SELECT COALESCE(SUM(o.netAmount), 0) FROM Order o WHERE o.status = 'COMPLETED'")
    BigDecimal calculateTotalRevenue();

    @Query("SELECT COALESCE(SUM(o.totalAmount - o.discount), 0) - COALESCE(SUM(i.quantity * p.cost), 0) " +
           "FROM Order o JOIN o.items i JOIN Product p ON i.productId = p.id WHERE o.status = 'COMPLETED'")
    BigDecimal calculateTotalProfit();

    @Query("SELECT CAST(o.orderDate AS date), SUM(o.netAmount) " +
           "FROM Order o WHERE o.status = 'COMPLETED' " +
           "GROUP BY CAST(o.orderDate AS date) " +
           "ORDER BY CAST(o.orderDate AS date) ASC")
    List<Object[]> findDailySalesTrends();
}
