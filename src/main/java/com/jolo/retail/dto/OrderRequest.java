package com.jolo.retail.dto;

import java.math.BigDecimal;
import java.util.List;

public class OrderRequest {
    private Long customerId;
    private String paymentMethod;
    private BigDecimal discount;
    private List<CartItem> items;

    // Constructors
    public OrderRequest() {}

    public OrderRequest(Long customerId, String paymentMethod, BigDecimal discount, List<CartItem> items) {
        this.customerId = customerId;
        this.paymentMethod = paymentMethod;
        this.discount = discount;
        this.items = items;
    }

    // Getters and Setters
    public Long getCustomerId() {
        return customerId;
    }

    public void setCustomerId(Long customerId) {
        this.customerId = customerId;
    }

    public String getPaymentMethod() {
        return paymentMethod;
    }

    public void setPaymentMethod(String paymentMethod) {
        this.paymentMethod = paymentMethod;
    }

    public BigDecimal getDiscount() {
        return discount;
    }

    public void setDiscount(BigDecimal discount) {
        this.discount = discount;
    }

    public List<CartItem> getItems() {
        return items;
    }

    public void setItems(List<CartItem> items) {
        this.items = items;
    }

    // Inner static class for representing items in cart
    public static class CartItem {
        private Long productId;
        private Integer quantity;

        public CartItem() {}

        public CartItem(Long productId, Integer quantity) {
            this.productId = productId;
            this.quantity = quantity;
        }

        public Long getProductId() {
            return productId;
        }

        public void setProductId(Long productId) {
            this.productId = productId;
        }

        public Integer getQuantity() {
            return quantity;
        }

        public void setQuantity(Integer quantity) {
            this.quantity = quantity;
        }
    }
}
