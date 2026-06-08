package com.jolo.retail.service;

import com.jolo.retail.model.Product;
import com.jolo.retail.repository.ProductRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class ProductService {
    private final ProductRepository productRepository;

    public ProductService(ProductRepository productRepository) {
        this.productRepository = productRepository;
    }

    public List<Product> getAllProducts() {
        return productRepository.findAll();
    }

    public Optional<Product> getProductById(Long id) {
        return productRepository.findById(id);
    }

    public Optional<Product> getProductBySku(String sku) {
        return productRepository.findBySku(sku);
    }

    public List<Product> searchProducts(String query) {
        if (query == null || query.trim().isEmpty()) {
            return getAllProducts();
        }
        return productRepository.findByNameContainingIgnoreCaseOrSkuContainingIgnoreCase(query, query);
    }

    public List<Product> getProductsByCategory(String category) {
        return productRepository.findByCategoryIgnoreCase(category);
    }

    public Product saveProduct(Product product) {
        // Enforce SKU uniqueness on new products
        if (product.getId() == null && productRepository.findBySku(product.getSku()).isPresent()) {
            throw new IllegalArgumentException("Product SKU '" + product.getSku() + "' already exists!");
        }
        return productRepository.save(product);
    }

    public Product updateProduct(Long id, Product details) {
        Product existing = productRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Product not found with ID: " + id));

        // Check if SKU is changing and if new SKU is already in use
        if (!existing.getSku().equals(details.getSku())) {
            if (productRepository.findBySku(details.getSku()).isPresent()) {
                throw new IllegalArgumentException("Product SKU '" + details.getSku() + "' already exists!");
            }
        }

        existing.setName(details.getName());
        existing.setSku(details.getSku());
        existing.setDescription(details.getDescription());
        existing.setPrice(details.getPrice());
        existing.setCost(details.getCost());
        existing.setQuantity(details.getQuantity());
        existing.setLowStockThreshold(details.getLowStockThreshold());
        existing.setCategory(details.getCategory());

        return productRepository.save(existing);
    }

    public void deleteProduct(Long id) {
        if (!productRepository.existsById(id)) {
            throw new IllegalArgumentException("Product not found with ID: " + id);
        }
        productRepository.deleteById(id);
    }

    public long getLowStockCount() {
        return productRepository.countLowStockProducts();
    }
}
