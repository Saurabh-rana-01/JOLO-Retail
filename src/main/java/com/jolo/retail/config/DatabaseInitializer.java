package com.jolo.retail.config;

import com.jolo.retail.model.Customer;
import com.jolo.retail.model.Order;
import com.jolo.retail.model.OrderItem;
import com.jolo.retail.model.Product;
import com.jolo.retail.repository.CustomerRepository;
import com.jolo.retail.repository.OrderRepository;
import com.jolo.retail.repository.ProductRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;

@Component
public class DatabaseInitializer implements CommandLineRunner {
    private static final Logger logger = LoggerFactory.getLogger(DatabaseInitializer.class);

    private final ProductRepository productRepository;
    private final CustomerRepository customerRepository;
    private final OrderRepository orderRepository;

    public DatabaseInitializer(ProductRepository productRepository, CustomerRepository customerRepository, OrderRepository orderRepository) {
        this.productRepository = productRepository;
        this.customerRepository = customerRepository;
        this.orderRepository = orderRepository;
    }

    @Override
    public void run(String... args) throws Exception {
        logger.info("Initializing sample retail data...");

        // 1. Seed Products
        if (productRepository.count() == 0) {
            List<Product> products = Arrays.asList(
                new Product("ELEC-IP15PM", "iPhone 15 Pro Max 256GB", "Apple flagship smartphone with titanium body", new BigDecimal("1199.99"), new BigDecimal("850.00"), 12, 3, "Electronics"),
                new Product("ELEC-SONYX5", "Sony WH-1000XM5 Headphones", "Industry-leading noise canceling wireless headphones", new BigDecimal("349.99"), new BigDecimal("220.00"), 20, 5, "Electronics"),
                new Product("ELEC-LOGIMX3", "Logitech MX Master 3S Mouse", "Premium wireless productivity mouse", new BigDecimal("99.99"), new BigDecimal("60.00"), 4, 5, "Electronics"), // Low stock
                new Product("ELEC-DELL27", "Dell UltraSharp 27\" 4K Monitor", "USB-C Hub IPS monitor for professionals", new BigDecimal("499.99"), new BigDecimal("320.00"), 8, 2, "Electronics"),
                
                new Product("APPR-NIKEAM", "Nike Air Max 270 Sneakers", "Comfortable, stylish athletic running shoes", new BigDecimal("150.00"), new BigDecimal("75.00"), 3, 5, "Apparel"), // Low stock
                new Product("APPR-PATSWEAT", "Patagonia Better Sweater Jacket", "Recycled polyester fleece full-zip sweater", new BigDecimal("149.00"), new BigDecimal("80.00"), 15, 3, "Apparel"),
                new Product("APPR-LEVI511", "Levi's 511 Slim Fit Jeans", "Classic stretch denim jeans", new BigDecimal("69.50"), new BigDecimal("32.00"), 30, 8, "Apparel"),
                
                new Product("HOME-NESPVM", "Nespresso Vertuo Coffee Maker", "Centrifusion technology single-serve coffee machine", new BigDecimal("199.00"), new BigDecimal("120.00"), 6, 2, "Home & Kitchen"),
                new Product("GROC-MATCHATEA", "Organic Ceremonial Matcha Tea 50g", "Pure stone-ground Japanese green tea powder", new BigDecimal("29.99"), new BigDecimal("12.00"), 45, 10, "Grocery"),
                new Product("HOME-HFLASK32", "Hydro Flask 32oz Wide Mouth", "Double-wall vacuum insulated stainless steel water bottle", new BigDecimal("44.95"), new BigDecimal("20.00"), 0, 5, "Home & Kitchen") // Out of stock
            );
            productRepository.saveAll(products);
            logger.info("Saved {} products to database.", products.size());
        }

        // 2. Seed Customers
        if (customerRepository.count() == 0) {
            Customer c1 = new Customer("John Doe", "john.doe@example.com", "9876543210");
            c1.setLoyaltyPoints(620); // GOLD Tier
            
            Customer c2 = new Customer("Jane Smith", "jane.smith@example.com", "9876543211");
            c2.setLoyaltyPoints(250); // SILVER Tier
            
            Customer c3 = new Customer("Bob Johnson", "bob.johnson@example.com", "9876543212");
            c3.setLoyaltyPoints(45);  // BRONZE Tier
            
            Customer c4 = new Customer("Alice Williams", "alice.williams@example.com", "9876543213");
            c4.setLoyaltyPoints(0);   // BRONZE Tier

            customerRepository.saveAll(Arrays.asList(c1, c2, c3, c4));
            logger.info("Saved 4 customers to database.");
        }

        // 3. Seed Orders (spaced historically to show a nice dashboard sales chart trend!)
        if (orderRepository.count() == 0) {
            List<Product> products = productRepository.findAll();
            Product iphone = products.stream().filter(p -> p.getSku().equals("ELEC-IP15PM")).findFirst().get();
            Product headphones = products.stream().filter(p -> p.getSku().equals("ELEC-SONYX5")).findFirst().get();
            Product jeans = products.stream().filter(p -> p.getSku().equals("APPR-LEVI511")).findFirst().get();
            Product matchatea = products.stream().filter(p -> p.getSku().equals("GROC-MATCHATEA")).findFirst().get();
            Product mouse = products.stream().filter(p -> p.getSku().equals("ELEC-LOGIMX3")).findFirst().get();
            
            List<Customer> customers = customerRepository.findAll();
            Customer john = customers.stream().filter(c -> c.getEmail().startsWith("john")).findFirst().get();
            Customer jane = customers.stream().filter(c -> c.getEmail().startsWith("jane")).findFirst().get();

            // Order 1: 3 Days ago
            LocalDateTime date1 = LocalDateTime.now().minusDays(3);
            Order o1 = new Order("JOLO-20260601-142218-1001", john.getId(), john.getName(), date1, BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO, "CARD", "COMPLETED");
            OrderItem item1 = new OrderItem(iphone.getId(), iphone.getName(), iphone.getPrice(), 1);
            OrderItem item2 = new OrderItem(mouse.getId(), mouse.getName(), mouse.getPrice(), 1);
            o1.addItem(item1);
            o1.addItem(item2);
            BigDecimal total1 = item1.getSubtotal().add(item2.getSubtotal());
            o1.setTotalAmount(total1);
            BigDecimal disc1 = total1.multiply(new BigDecimal("0.05")).setScale(2, RoundingMode.HALF_UP); // Gold 5%
            o1.setDiscount(disc1);
            BigDecimal tax1 = total1.subtract(disc1).multiply(new BigDecimal("0.08")).setScale(2, RoundingMode.HALF_UP);
            o1.setTax(tax1);
            o1.setNetAmount(total1.subtract(disc1).add(tax1));
            orderRepository.save(o1);

            // Order 2: 2 Days ago
            LocalDateTime date2 = LocalDateTime.now().minusDays(2);
            Order o2 = new Order("JOLO-20260602-111005-2002", jane.getId(), jane.getName(), date2, BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO, "UPI", "COMPLETED");
            OrderItem item3 = new OrderItem(headphones.getId(), headphones.getName(), headphones.getPrice(), 1);
            o2.addItem(item3);
            BigDecimal total2 = item3.getSubtotal();
            o2.setTotalAmount(total2);
            BigDecimal disc2 = total2.multiply(new BigDecimal("0.03")).setScale(2, RoundingMode.HALF_UP); // Silver 3%
            o2.setDiscount(disc2);
            BigDecimal tax2 = total2.subtract(disc2).multiply(new BigDecimal("0.08")).setScale(2, RoundingMode.HALF_UP);
            o2.setTax(tax2);
            o2.setNetAmount(total2.subtract(disc2).add(tax2));
            orderRepository.save(o2);

            // Order 3: 1 Day ago
            LocalDateTime date3 = LocalDateTime.now().minusDays(1);
            Order o3 = new Order("JOLO-20260603-184530-3003", null, null, date3, BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO, "CASH", "COMPLETED");
            OrderItem item4 = new OrderItem(jeans.getId(), jeans.getName(), jeans.getPrice(), 2);
            OrderItem item5 = new OrderItem(matchatea.getId(), matchatea.getName(), matchatea.getPrice(), 3);
            o3.addItem(item4);
            o3.addItem(item5);
            BigDecimal total3 = item4.getSubtotal().add(item5.getSubtotal());
            o3.setTotalAmount(total3);
            o3.setDiscount(BigDecimal.ZERO); // Walk-in no discount
            BigDecimal tax3 = total3.multiply(new BigDecimal("0.08")).setScale(2, RoundingMode.HALF_UP);
            o3.setTax(tax3);
            o3.setNetAmount(total3.add(tax3));
            orderRepository.save(o3);

            // Order 4: Today (earlier)
            LocalDateTime date4 = LocalDateTime.now().minusHours(2);
            Order o4 = new Order("JOLO-20260604-091522-4004", john.getId(), john.getName(), date4, BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO, "CARD", "COMPLETED");
            OrderItem item6 = new OrderItem(matchatea.getId(), matchatea.getName(), matchatea.getPrice(), 1);
            o4.addItem(item6);
            BigDecimal total4 = item6.getSubtotal();
            o4.setTotalAmount(total4);
            BigDecimal disc4 = total4.multiply(new BigDecimal("0.05")).setScale(2, RoundingMode.HALF_UP);
            o4.setDiscount(disc4);
            BigDecimal tax4 = total4.subtract(disc4).multiply(new BigDecimal("0.08")).setScale(2, RoundingMode.HALF_UP);
            o4.setTax(tax4);
            o4.setNetAmount(total4.subtract(disc4).add(tax4));
            orderRepository.save(o4);

            logger.info("Saved 4 sample historical orders.");
        }
        
        logger.info("Database initialization complete.");
    }
}
