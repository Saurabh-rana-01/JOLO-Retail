package com.jolo.retail.model;

import jakarta.persistence.*;

@Entity
@Table(name = "customers")
public class Customer {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false, unique = true)
    private String phone;

    @Column(nullable = false)
    private Integer loyaltyPoints;

    @Column(nullable = false)
    private String loyaltyTier; // BRONZE, SILVER, GOLD

    // Constructors
    public Customer() {}

    public Customer(String name, String email, String phone) {
        this.name = name;
        this.email = email;
        this.phone = phone;
        this.loyaltyPoints = 0;
        this.loyaltyTier = "BRONZE";
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public Integer getLoyaltyPoints() {
        return loyaltyPoints;
    }

    public void setLoyaltyPoints(Integer loyaltyPoints) {
        this.loyaltyPoints = loyaltyPoints;
        updateLoyaltyTier();
    }

    public String getLoyaltyTier() {
        return loyaltyTier;
    }

    public void setLoyaltyTier(String loyaltyTier) {
        this.loyaltyTier = loyaltyTier;
    }

    // Business Logic: Dynamic loyalty tier update
    public void addPoints(Integer points) {
        this.loyaltyPoints += points;
        updateLoyaltyTier();
    }

    private void updateLoyaltyTier() {
        if (this.loyaltyPoints >= 500) {
            this.loyaltyTier = "GOLD";
        } else if (this.loyaltyPoints >= 100) {
            this.loyaltyTier = "SILVER";
        } else {
            this.loyaltyTier = "BRONZE";
        }
    }
}
