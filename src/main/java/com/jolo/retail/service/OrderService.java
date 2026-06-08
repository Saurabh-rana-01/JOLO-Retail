package com.jolo.retail.service;

import com.jolo.retail.dto.OrderRequest;
import com.jolo.retail.model.Customer;
import com.jolo.retail.model.Order;
import com.jolo.retail.model.OrderItem;
import com.jolo.retail.model.Product;
import com.jolo.retail.repository.CustomerRepository;
import com.jolo.retail.repository.OrderRepository;
import com.jolo.retail.repository.ProductRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Optional;
import java.util.Random;

@Service
@Transactional
public class OrderService {
    private final OrderRepository orderRepository;
    private final ProductRepository productRepository;
    private final CustomerRepository customerRepository;

    public OrderService(OrderRepository orderRepository, ProductRepository productRepository, CustomerRepository customerRepository) {
        this.orderRepository = orderRepository;
        this.productRepository = productRepository;
        this.customerRepository = customerRepository;
    }

    public List<Order> getAllOrders() {
        return orderRepository.findAllByOrderByOrderDateDesc();
    }

    public Optional<Order> getOrderById(Long id) {
        return orderRepository.findById(id);
    }

    public Optional<Order> getOrderByOrderNumber(String orderNumber) {
        return orderRepository.findByOrderNumber(orderNumber);
    }

    public Order checkout(OrderRequest request) {
        if (request.getItems() == null || request.getItems().isEmpty()) {
            throw new IllegalArgumentException("Cart cannot be empty!");
        }

        Customer customer = null;
        if (request.getCustomerId() != null) {
            customer = customerRepository.findById(request.getCustomerId())
                    .orElseThrow(() -> new IllegalArgumentException("Customer not found with ID: " + request.getCustomerId()));
        }

        BigDecimal totalAmount = BigDecimal.ZERO;
        Order order = new Order();
        order.setOrderDate(LocalDateTime.now());
        order.setPaymentMethod(request.getPaymentMethod());
        order.setStatus("COMPLETED");

        // Set customer info if present
        if (customer != null) {
            order.setCustomerId(customer.getId());
            order.setCustomerName(customer.getName());
        }

        // Process cart items
        for (OrderRequest.CartItem cartItem : request.getItems()) {
            Product product = productRepository.findById(cartItem.getProductId())
                    .orElseThrow(() -> new IllegalArgumentException("Product not found with ID: " + cartItem.getProductId()));

            // Stock validation
            if (product.getQuantity() < cartItem.getQuantity()) {
                throw new IllegalArgumentException("Insufficient stock for product: " + product.getName() + 
                        ". Available: " + product.getQuantity() + ", Requested: " + cartItem.getQuantity());
            }

            // Decrement Stock
            product.setQuantity(product.getQuantity() - cartItem.getQuantity());
            productRepository.save(product);

            // Create Order Item
            OrderItem orderItem = new OrderItem(product.getId(), product.getName(), product.getPrice(), cartItem.getQuantity());
            order.addItem(orderItem);
            
            totalAmount = totalAmount.add(orderItem.getSubtotal());
        }

        order.setTotalAmount(totalAmount);

        // Apply loyalty discounts based on customer tiers
        BigDecimal discountRate = BigDecimal.ZERO;
        if (customer != null) {
            String tier = customer.getLoyaltyTier();
            if ("GOLD".equalsIgnoreCase(tier)) {
                discountRate = new BigDecimal("0.05"); // 5% discount
            } else if ("SILVER".equalsIgnoreCase(tier)) {
                discountRate = new BigDecimal("0.03"); // 3% discount
            }
        }
        
        BigDecimal discount = totalAmount.multiply(discountRate).setScale(2, RoundingMode.HALF_UP);
        // Add any manual coupon discount sent from front-end
        if (request.getDiscount() != null) {
            discount = discount.add(request.getDiscount());
        }
        order.setDiscount(discount);

        // Tax calculation: 8% flat retail tax on discounted amount
        BigDecimal taxableAmount = totalAmount.subtract(discount);
        if (taxableAmount.compareTo(BigDecimal.ZERO) < 0) {
            taxableAmount = BigDecimal.ZERO;
        }
        BigDecimal tax = taxableAmount.multiply(new BigDecimal("0.08")).setScale(2, RoundingMode.HALF_UP);
        order.setTax(tax);

        // Net Amount = taxableAmount + tax
        BigDecimal netAmount = taxableAmount.add(tax).setScale(2, RoundingMode.HALF_UP);
        order.setNetAmount(netAmount);

        // Generate custom sequential/timestamped order number
        order.setOrderNumber(generateOrderNumber());

        // Award loyalty points: 1 point for every $10 net amount spent
        if (customer != null) {
            int earnedPoints = netAmount.divide(BigDecimal.TEN, 0, RoundingMode.DOWN).intValue();
            if (earnedPoints > 0) {
                customer.addPoints(earnedPoints);
                customerRepository.save(customer);
            }
        }

        return orderRepository.save(order);
    }

    private String generateOrderNumber() {
        DateTimeFormatter dtf = DateTimeFormatter.ofPattern("yyyyMMdd-HHmmss");
        String timestamp = LocalDateTime.now().format(dtf);
        int random = new Random().nextInt(9000) + 1000; // 1000 to 9999
        return "JOLO-" + timestamp + "-" + random;
    }
}
