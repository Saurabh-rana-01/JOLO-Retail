package com.jolo.retail.service;

import com.jolo.retail.model.Customer;
import com.jolo.retail.repository.CustomerRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class CustomerService {
    private final CustomerRepository customerRepository;

    public CustomerService(CustomerRepository customerRepository) {
        this.customerRepository = customerRepository;
    }

    public List<Customer> getAllCustomers() {
        return customerRepository.findAll();
    }

    public Optional<Customer> getCustomerById(Long id) {
        return customerRepository.findById(id);
    }

    public List<Customer> searchCustomers(String query) {
        if (query == null || query.trim().isEmpty()) {
            return getAllCustomers();
        }
        return customerRepository.findByNameContainingIgnoreCaseOrPhoneContaining(query, query);
    }

    public Customer createCustomer(Customer customer) {
        // Enforce uniqueness of phone and email
        if (customerRepository.findByPhone(customer.getPhone()).isPresent()) {
            throw new IllegalArgumentException("Customer with phone number '" + customer.getPhone() + "' already exists!");
        }
        if (customerRepository.findByEmail(customer.getEmail()).isPresent()) {
            throw new IllegalArgumentException("Customer with email '" + customer.getEmail() + "' already exists!");
        }
        
        customer.setLoyaltyPoints(0);
        customer.setLoyaltyTier("BRONZE");
        return customerRepository.save(customer);
    }

    public Customer updateCustomer(Long id, Customer details) {
        Customer existing = customerRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Customer not found with ID: " + id));

        // Phone unique validation
        if (!existing.getPhone().equals(details.getPhone())) {
            if (customerRepository.findByPhone(details.getPhone()).isPresent()) {
                throw new IllegalArgumentException("Customer with phone number '" + details.getPhone() + "' already exists!");
            }
        }
        
        // Email unique validation
        if (!existing.getEmail().equals(details.getEmail())) {
            if (customerRepository.findByEmail(details.getEmail()).isPresent()) {
                throw new IllegalArgumentException("Customer with email '" + details.getEmail() + "' already exists!");
            }
        }

        existing.setName(details.getName());
        existing.setEmail(details.getEmail());
        existing.setPhone(details.getPhone());
        // We preserve points unless changed explicitly
        if (details.getLoyaltyPoints() != null) {
            existing.setLoyaltyPoints(details.getLoyaltyPoints());
        }

        return customerRepository.save(existing);
    }

    public void deleteCustomer(Long id) {
        if (!customerRepository.existsById(id)) {
            throw new IllegalArgumentException("Customer not found with ID: " + id);
        }
        customerRepository.deleteById(id);
    }

    public Customer addLoyaltyPoints(Long customerId, Integer points) {
        Customer customer = customerRepository.findById(customerId)
                .orElseThrow(() -> new IllegalArgumentException("Customer not found with ID: " + customerId));
        customer.addPoints(points);
        return customerRepository.save(customer);
    }
}
