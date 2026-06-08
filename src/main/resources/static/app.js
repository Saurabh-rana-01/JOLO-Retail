// JOLO Retail ROIMS - Single Page Application Engine
const API_BASE = '/api/v1';

// Global Client State
let state = {
    products: [],
    customers: [],
    orders: [],
    cart: [],
    activeCustomer: null,
    charts: {
        salesTrend: null,
        categoryDist: null
    }
};

// --- Initialization & Setup ---
document.addEventListener('DOMContentLoaded', () => {
    initClock();
    initNavigation();
    initEventListeners();
    
    // Initial data fetch
    refreshAllData();
});

// Live Header Clock
function initClock() {
    const clockEl = document.querySelector('#live-clock span');
    const updateTime = () => {
        const now = new Date();
        clockEl.textContent = now.toLocaleTimeString();
    };
    updateTime();
    setInterval(updateTime, 1000);
}

// SPA Routing Router
function initNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    const panels = document.querySelectorAll('.content-panel');
    const pageTitle = document.getElementById('page-title');
    const pageSubtitle = document.getElementById('page-subtitle');
    
    const pageMetadata = {
        'dashboard-panel': { title: 'Dashboard Analytics', subtitle: 'Live overview of sales KPIs, product status, and revenues.' },
        'pos-panel': { title: 'POS Checkout Terminal', subtitle: 'Search products, compile cart, link loyalty members, and complete transactions.' },
        'inventory-panel': { title: 'Inventory Management', subtitle: 'Track and adjust stock levels, cost prices, retail prices, and edit SKU catalogs.' },
        'customers-panel': { title: 'Customer Loyalty Database', subtitle: 'Register and search members, track point levels, and view tier brackets.' },
        'orders-panel': { title: 'Transaction Archives', subtitle: 'Browse history logs of completed orders and view receipts.' }
    };

    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const targetPanelId = item.getAttribute('data-target');
            
            // Toggle active sidebar link
            navItems.forEach(n => n.classList.remove('active'));
            item.classList.add('active');
            
            // Toggle active panel
            panels.forEach(panel => {
                if (panel.id === targetPanelId) {
                    panel.classList.add('active');
                } else {
                    panel.classList.remove('active');
                }
            });
            
            // Update titles
            if (pageMetadata[targetPanelId]) {
                pageTitle.textContent = pageMetadata[targetPanelId].title;
                pageSubtitle.textContent = pageMetadata[targetPanelId].subtitle;
            }

            // Specialized panel refreshes
            if (targetPanelId === 'dashboard-panel') {
                refreshDashboard();
            } else if (targetPanelId === 'pos-panel') {
                renderPOSProducts();
            } else if (targetPanelId === 'inventory-panel') {
                loadInventoryTable();
            } else if (targetPanelId === 'customers-panel') {
                loadCustomersTable();
            } else if (targetPanelId === 'orders-panel') {
                loadOrdersTable();
            }
        });
    });

    // Custom view-all navigation hooks from dashboard
    document.querySelector('.btn-view-all-orders').addEventListener('click', () => {
        document.querySelector('[data-target="orders-panel"]').click();
    });

    document.querySelector('.btn-go-inventory').addEventListener('click', () => {
        document.querySelector('[data-target="inventory-panel"]').click();
    });

    document.getElementById('kpi-low-stock-btn').addEventListener('click', () => {
        document.querySelector('[data-target="inventory-panel"]').click();
    });
}

// Central Refresh Action
function refreshAllData() {
    fetchProducts();
    fetchCustomers();
    refreshDashboard();
}

// --- Fetch API Handlers ---
function fetchProducts(callback) {
    fetch(`${API_BASE}/products`)
        .then(res => res.json())
        .then(data => {
            state.products = data;
            if (callback) callback();
        })
        .catch(err => {
            console.error('Error fetching products:', err);
            showToast('Failed to sync product catalog.', 'error');
        });
}

function fetchCustomers(callback) {
    fetch(`${API_BASE}/customers`)
        .then(res => res.json())
        .then(data => {
            state.customers = data;
            populatePOSCustomers();
            if (callback) callback();
        })
        .catch(err => {
            console.error('Error fetching customers:', err);
            showToast('Failed to sync loyalty directory.', 'error');
        });
}

// --- Dashboard Module ---
function refreshDashboard() {
    fetch(`${API_BASE}/dashboard/stats`)
        .then(res => res.json())
        .then(stats => {
            // Update KPIs
            document.getElementById('kpi-revenue').textContent = `$${stats.totalSales.toFixed(2)}`;
            document.getElementById('kpi-orders').textContent = stats.totalOrders;
            document.getElementById('kpi-customers').textContent = stats.totalCustomers;
            document.getElementById('kpi-low-stock').textContent = stats.lowStockCount;
            
            // Warning style if stock count is high
            const stockCard = document.getElementById('kpi-low-stock-btn');
            if (stats.lowStockCount > 0) {
                stockCard.classList.add('text-glow-orange');
            } else {
                stockCard.classList.remove('text-glow-orange');
            }

            // Populate Recent Orders Table
            const recentTbody = document.querySelector('#recent-orders-table tbody');
            recentTbody.innerHTML = '';
            if (stats.recentOrders.length === 0) {
                recentTbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted">No transactions found.</td></tr>';
            } else {
                stats.recentOrders.forEach(o => {
                    const row = document.createElement('tr');
                    const date = new Date(o.orderDate);
                    row.innerHTML = `
                        <td><span class="prod-sku">${o.orderNumber}</span></td>
                        <td>${o.customerName || '<span class="text-muted">Walk-in Guest</span>'}</td>
                        <td>${date.toLocaleString()}</td>
                        <td class="text-right"><strong>$${o.netAmount.toFixed(2)}</strong></td>
                        <td><span class="badge ${o.paymentMethod === 'CASH' ? 'badge-warning' : 'badge-success'}">${o.paymentMethod}</span></td>
                    `;
                    recentTbody.appendChild(row);
                });
            }

            // Populate Low Stock list ticker
            const alertList = document.getElementById('low-stock-alert-list');
            alertList.innerHTML = '';
            const lowStockProducts = state.products.filter(p => p.quantity <= p.lowStockThreshold);
            if (lowStockProducts.length === 0) {
                alertList.innerHTML = '<div class="text-center text-muted pad-20">All product stock counts healthy.</div>';
            } else {
                lowStockProducts.forEach(p => {
                    const item = document.createElement('div');
                    item.className = 'product-alert-item';
                    item.innerHTML = `
                        <div class="alert-item-info">
                            <h4>${p.name}</h4>
                            <span>SKU: ${p.sku} | Threshold: ${p.lowStockThreshold}</span>
                        </div>
                        <span class="stock-status-pill ${p.quantity === 0 ? 'pill-red' : 'pill-orange'}">
                            ${p.quantity === 0 ? 'OUT' : p.quantity + ' LEFT'}
                        </span>
                    `;
                    alertList.appendChild(item);
                });
            }

            // Render Charts
            renderCharts(stats.salesTrends, stats.categoryDistribution);
        })
        .catch(err => {
            console.error('Error loading dashboard stats:', err);
            showToast('Unable to fetch live analytics.', 'error');
        });
}

// Chart.js Drawing Functions
function renderCharts(trends, categories) {
    // 1. Sales Trend Line Chart
    const trendCtx = document.getElementById('sales-trend-chart').getContext('2d');
    if (state.charts.salesTrend) {
        state.charts.salesTrend.destroy();
    }
    
    // Sort trends chronologically
    trends.sort((a, b) => new Date(a.date) - new Date(b.date));
    
    const labels = trends.map(t => {
        const d = new Date(t.date);
        return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    });
    const values = trends.map(t => t.sales);

    state.charts.salesTrend = new Chart(trendCtx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Daily Net Revenue ($)',
                data: values,
                borderColor: '#00f2fe',
                backgroundColor: 'rgba(0, 242, 254, 0.1)',
                borderWidth: 3,
                fill: true,
                tension: 0.3,
                pointBackgroundColor: '#0072ff',
                pointBorderColor: '#fff',
                pointRadius: 4,
                pointHoverRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            scales: {
                x: {
                    grid: { color: 'rgba(255, 255, 255, 0.05)' },
                    ticks: { color: '#64748b' }
                },
                y: {
                    grid: { color: 'rgba(255, 255, 255, 0.05)' },
                    ticks: { color: '#64748b' },
                    beginAtZero: true
                }
            }
        }
    });

    // 2. Category Distribution Doughnut Chart
    const catCtx = document.getElementById('category-chart').getContext('2d');
    if (state.charts.categoryDist) {
        state.charts.categoryDist.destroy();
    }

    const catLabels = Object.keys(categories);
    const catValues = Object.values(categories);

    state.charts.categoryDist = new Chart(catCtx, {
        type: 'doughnut',
        data: {
            labels: catLabels,
            datasets: [{
                data: catValues,
                backgroundColor: [
                    '#00f2fe', // Cyan
                    '#7f00ff', // Purple
                    '#00c6ff', // Sky Blue
                    '#f59e0b', // Yellow/Orange
                    '#10b981', // Green
                    '#ef4444'  // Red
                ],
                borderWidth: 0,
                hoverOffset: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: '#94a3b8',
                        padding: 10,
                        font: { family: 'Outfit', size: 11 }
                    }
                }
            },
            cutout: '65%'
        }
    });
}

// --- POS Terminal Module ---
function renderPOSProducts() {
    const grid = document.getElementById('pos-products-grid');
    grid.innerHTML = '';

    const searchQuery = document.getElementById('pos-search').value.toLowerCase();
    const activeCategory = document.querySelector('#pos-category-filters .btn-filter.active').getAttribute('data-category');

    const filtered = state.products.filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(searchQuery) || p.sku.toLowerCase().includes(searchQuery);
        const matchesCat = activeCategory === 'ALL' || p.category.toLowerCase() === activeCategory.toLowerCase();
        return matchesSearch && matchesCat;
    });

    if (filtered.length === 0) {
        grid.innerHTML = '<div class="col-12 text-center text-muted pad-20">No matching products in catalog.</div>';
        return;
    }

    filtered.forEach(p => {
        const isOutOfStock = p.quantity <= 0;
        const isLow = p.quantity <= p.lowStockThreshold;
        
        const card = document.createElement('div');
        card.className = `product-card ${isOutOfStock ? 'out-of-stock' : ''}`;
        
        let stockText = `${p.quantity} In Stock`;
        let stockColorClass = '';
        
        if (isOutOfStock) {
            stockText = 'Out of Stock';
            stockColorClass = 'text-glow-orange';
        } else if (isLow) {
            stockText = `Low Stock (${p.quantity})`;
        }

        card.innerHTML = `
            <div>
                <span class="prod-sku">${p.sku}</span>
                <h4 class="prod-name">${p.name}</h4>
            </div>
            <div>
                <div class="prod-details">
                    <span class="prod-price">$${p.price.toFixed(2)}</span>
                    <span class="prod-stock ${stockColorClass}">${stockText}</span>
                </div>
                <button class="btn-add-cart" ${isOutOfStock ? 'disabled' : ''} onclick="addToCart(${p.id})">
                    <i class="fa-solid fa-plus"></i> Add to Cart
                </button>
            </div>
        `;
        grid.appendChild(card);
    });
}

function populatePOSCustomers() {
    const select = document.getElementById('pos-customer-select');
    select.innerHTML = '<option value="">-- Guest Checkout --</option>';
    
    state.customers.forEach(c => {
        const opt = document.createElement('option');
        opt.value = c.id;
        opt.textContent = `${c.name} (${c.phone})`;
        select.appendChild(opt);
    });
}

// Cart Mechanics
window.addToCart = function(productId) {
    const product = state.products.find(p => p.id === productId);
    if (!product || product.quantity <= 0) return;

    const existing = state.cart.find(item => item.productId === productId);
    if (existing) {
        if (existing.quantity >= product.quantity) {
            showToast(`Cannot add more. Only ${product.quantity} units available.`, 'warning');
            return;
        }
        existing.quantity++;
    } else {
        state.cart.push({
            productId: product.id,
            name: product.name,
            price: product.price,
            quantity: 1
        });
    }

    showToast(`Added ${product.name} to cart.`, 'success');
    renderCart();
};

function renderCart() {
    const tbody = document.getElementById('cart-tbody');
    tbody.innerHTML = '';

    if (state.cart.length === 0) {
        tbody.innerHTML = '<tr class="empty-cart-row"><td colspan="5" class="text-center">Cart is empty. Select items on the left.</td></tr>';
        document.getElementById('checkout-btn').disabled = true;
        updateCartTotals();
        return;
    }

    document.getElementById('checkout-btn').disabled = false;

    state.cart.forEach(item => {
        const product = state.products.find(p => p.id === item.productId);
        const row = document.createElement('tr');
        
        row.innerHTML = `
            <td><div class="cart-item-name" title="${item.name}">${item.name}</div></td>
            <td>
                <div class="cart-qty-ctrl">
                    <button class="btn-qty" onclick="changeCartQty(${item.productId}, -1)">-</button>
                    <span>${item.quantity}</span>
                    <button class="btn-qty" onclick="changeCartQty(${item.productId}, 1)">+</button>
                </div>
            </td>
            <td class="text-right">$${item.price.toFixed(2)}</td>
            <td class="text-right"><strong>$${(item.price * item.quantity).toFixed(2)}</strong></td>
            <td class="text-center">
                <button class="btn-remove-item" onclick="removeFromCart(${item.productId})">
                    <i class="fa-regular fa-trash-can"></i>
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });

    updateCartTotals();
}

window.changeCartQty = function(productId, delta) {
    const item = state.cart.find(c => c.productId === productId);
    if (!item) return;

    const product = state.products.find(p => p.id === productId);
    
    if (delta > 0 && item.quantity >= product.quantity) {
        showToast('Max available stock reached.', 'warning');
        return;
    }

    item.quantity += delta;
    if (item.quantity <= 0) {
        removeFromCart(productId);
    } else {
        renderCart();
    }
};

window.removeFromCart = function(productId) {
    state.cart = state.cart.filter(c => c.productId !== productId);
    renderCart();
};

function updateCartTotals() {
    let subtotal = 0;
    state.cart.forEach(item => {
        subtotal += item.price * item.quantity;
    });

    let discount = 0;
    if (state.activeCustomer) {
        const tier = state.activeCustomer.loyaltyTier;
        if (tier === 'GOLD') {
            discount = subtotal * 0.05; // 5% discount
        } else if (tier === 'SILVER') {
            discount = subtotal * 0.03; // 3% discount
        }
    }

    const taxable = Math.max(0, subtotal - discount);
    const tax = taxable * 0.08; // 8% flat tax
    const net = taxable + tax;

    document.getElementById('cart-subtotal').textContent = `$${subtotal.toFixed(2)}`;
    document.getElementById('cart-discount').textContent = `-$${discount.toFixed(2)}`;
    document.getElementById('cart-tax').textContent = `$${tax.toFixed(2)}`;
    document.getElementById('cart-net').textContent = `$${net.toFixed(2)}`;
}

// Checkout Form Submission
function runCheckout() {
    const btn = document.getElementById('checkout-btn');
    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Processing...';

    const payload = {
        customerId: state.activeCustomer ? state.activeCustomer.id : null,
        paymentMethod: document.querySelector('input[name="payment-method"]:checked').value,
        discount: 0,
        items: state.cart.map(c => ({ productId: c.productId, quantity: c.quantity }))
    };

    fetch(`${API_BASE}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    })
    .then(async res => {
        const data = await res.json();
        if (!res.ok) {
            throw new Error(data.message || 'Checkout failed');
        }
        return data;
    })
    .then(order => {
        showToast(`Checkout completed! Order: ${order.orderNumber}`, 'success');
        
        // Show thermal receipt
        renderReceipt(order);
        
        // Clear Cart
        state.cart = [];
        state.activeCustomer = null;
        document.getElementById('pos-customer-select').value = '';
        document.getElementById('attached-customer-badge').classList.add('hidden');
        renderCart();
        
        // Reload inventories & dashboard updates
        refreshAllData();
    })
    .catch(err => {
        console.error('Checkout error:', err);
        showToast(err.message || 'Check stock levels or customer information.', 'error');
    })
    .finally(() => {
        btn.disabled = false;
        btn.innerHTML = '<i class="fa-solid fa-cash-register"></i> Complete Checkout';
    });
}

// Receipt Rendering Invoice
function renderReceipt(order) {
    document.getElementById('receipt-no').textContent = order.orderNumber;
    document.getElementById('receipt-date').textContent = new Date(order.orderDate).toLocaleString();
    document.getElementById('receipt-customer').textContent = order.customerName || 'Walk-in Guest';
    document.getElementById('receipt-pay-method').textContent = order.paymentMethod;
    
    const itemsTbody = document.getElementById('receipt-items-tbody');
    itemsTbody.innerHTML = '';
    
    order.items.forEach(item => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${item.productName}</td>
            <td class="text-center">${item.quantity}</td>
            <td class="text-right">$${item.subtotal.toFixed(2)}</td>
        `;
        itemsTbody.appendChild(tr);
    });

    document.getElementById('receipt-subtotal').textContent = `$${order.totalAmount.toFixed(2)}`;
    document.getElementById('receipt-discount').textContent = `-$${order.discount.toFixed(2)}`;
    document.getElementById('receipt-tax').textContent = `$${order.tax.toFixed(2)}`;
    document.getElementById('receipt-net').textContent = `$${order.netAmount.toFixed(2)}`;

    // Loyalty section handling
    const loyaltySect = document.getElementById('receipt-loyalty-section');
    if (order.customerId) {
        loyaltySect.classList.remove('hidden');
        
        // Find updated customer info
        fetch(`${API_BASE}/customers/${order.customerId}`)
            .then(res => res.json())
            .then(cust => {
                const earned = Math.floor(order.netAmount / 10);
                const prev = Math.max(0, cust.loyaltyPoints - earned);
                document.getElementById('receipt-prev-pts').textContent = prev;
                document.getElementById('receipt-earned-pts').textContent = earned;
                document.getElementById('receipt-new-pts').textContent = cust.loyaltyPoints;
                document.getElementById('receipt-new-tier').textContent = cust.loyaltyTier;
            });
    } else {
        loyaltySect.classList.add('hidden');
    }

    document.getElementById('receipt-modal').style.display = 'flex';
}

// --- Inventory Module ---
function loadInventoryTable() {
    fetchProducts(() => {
        const tbody = document.querySelector('#inventory-table tbody');
        tbody.innerHTML = '';

        const filterVal = document.getElementById('inventory-search').value.toLowerCase();
        const filtered = state.products.filter(p => p.name.toLowerCase().includes(filterVal) || p.sku.toLowerCase().includes(filterVal));

        if (filtered.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8" class="text-center text-muted">No products found.</td></tr>';
            return;
        }

        filtered.forEach(p => {
            const isOutOfStock = p.quantity <= 0;
            const isLow = p.quantity <= p.lowStockThreshold;
            
            let statusPill = '<span class="stock-status-pill pill-green">In Stock</span>';
            if (isOutOfStock) {
                statusPill = '<span class="stock-status-pill pill-red">Out of Stock</span>';
            } else if (isLow) {
                statusPill = `<span class="stock-status-pill pill-orange">Low Stock (${p.quantity})</span>`;
            }

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><span class="prod-sku">${p.sku}</span></td>
                <td><strong>${p.name}</strong></td>
                <td>${p.category}</td>
                <td class="text-right">$${p.cost.toFixed(2)}</td>
                <td class="text-right">$${p.price.toFixed(2)}</td>
                <td class="text-center font-monospace">${p.quantity}</td>
                <td>${statusPill}</td>
                <td class="text-center">
                    <button class="btn-action edit-btn" onclick="openProductEdit(${p.id})"><i class="fa-solid fa-pen"></i></button>
                    <button class="btn-action delete-btn" onclick="deleteProduct(${p.id})"><i class="fa-solid fa-trash"></i></button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    });
}

window.openProductEdit = function(id) {
    const product = state.products.find(p => p.id === id);
    if (!product) return;

    document.getElementById('product-modal-title').textContent = 'Edit Product Catalog';
    document.getElementById('product-id').value = product.id;
    document.getElementById('product-name').value = product.name;
    document.getElementById('product-sku').value = product.sku;
    document.getElementById('product-desc').value = product.description || '';
    document.getElementById('product-category').value = product.category;
    document.getElementById('product-stock').value = product.quantity;
    document.getElementById('product-cost').value = product.cost;
    document.getElementById('product-price').value = product.price;
    document.getElementById('product-threshold').value = product.lowStockThreshold;

    document.getElementById('product-modal').style.display = 'flex';
};

window.deleteProduct = function(id) {
    if (!confirm('Are you sure you want to delete this product?')) return;
    
    fetch(`${API_BASE}/products/${id}`, { method: 'DELETE' })
        .then(res => {
            if (res.ok) {
                showToast('Product successfully deleted.', 'success');
                refreshAllData();
                loadInventoryTable();
            } else {
                throw new Error();
            }
        })
        .catch(() => showToast('Failed to delete product.', 'error'));
};

function saveProduct(e) {
    e.preventDefault();

    const id = document.getElementById('product-id').value;
    const payload = {
        name: document.getElementById('product-name').value,
        sku: document.getElementById('product-sku').value,
        description: document.getElementById('product-desc').value,
        category: document.getElementById('product-category').value,
        quantity: parseInt(document.getElementById('product-stock').value),
        cost: parseFloat(document.getElementById('product-cost').value),
        price: parseFloat(document.getElementById('product-price').value),
        lowStockThreshold: parseInt(document.getElementById('product-threshold').value)
    };

    const url = id ? `${API_BASE}/products/${id}` : `${API_BASE}/products`;
    const method = id ? 'PUT' : 'POST';

    fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    })
    .then(async res => {
        const data = await res.json();
        if (!res.ok) {
            throw new Error(data.message || 'Error occurred while saving product');
        }
        return data;
    })
    .then(() => {
        showToast('Product specifications updated successfully.', 'success');
        document.getElementById('product-modal').style.display = 'none';
        refreshAllData();
        loadInventoryTable();
    })
    .catch(err => {
        showToast(err.message, 'error');
    });
}

// --- Customer Loyalty Module ---
function loadCustomersTable() {
    fetchCustomers(() => {
        const tbody = document.querySelector('#customers-table tbody');
        tbody.innerHTML = '';

        const filterVal = document.getElementById('customers-search').value.toLowerCase();
        const filtered = state.customers.filter(c => c.name.toLowerCase().includes(filterVal) || c.phone.includes(filterVal));

        if (filtered.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="text-center text-muted">No registered members found.</td></tr>';
            return;
        }

        filtered.forEach(c => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${c.id}</td>
                <td><strong>${c.name}</strong></td>
                <td>${c.email}</td>
                <td>${c.phone}</td>
                <td class="text-center font-monospace">${c.loyaltyPoints}</td>
                <td class="text-center"><span class="tier-pill tier-${c.loyaltyTier.toLowerCase()}">${c.loyaltyTier}</span></td>
                <td class="text-center">
                    <button class="btn-action edit-btn" onclick="openCustomerEdit(${c.id})"><i class="fa-solid fa-pen"></i></button>
                    <button class="btn-action delete-btn" onclick="deleteCustomer(${c.id})"><i class="fa-solid fa-trash"></i></button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    });
}

window.openCustomerEdit = function(id) {
    const customer = state.customers.find(c => c.id === id);
    if (!customer) return;

    document.getElementById('customer-modal-title').textContent = 'Modify Loyalty Profile';
    document.getElementById('customer-id').value = customer.id;
    document.getElementById('customer-name').value = customer.name;
    document.getElementById('customer-email').value = customer.email;
    document.getElementById('customer-phone').value = customer.phone;

    document.getElementById('customer-modal').style.display = 'flex';
};

window.deleteCustomer = function(id) {
    if (!confirm('Delete customer account? Transactions will be preserved as Guest.')) return;
    
    fetch(`${API_BASE}/customers/${id}`, { method: 'DELETE' })
        .then(res => {
            if (res.ok) {
                showToast('Loyalty profile detached.', 'success');
                refreshAllData();
                loadCustomersTable();
            } else {
                throw new Error();
            }
        })
        .catch(() => showToast('Failed to delete member.', 'error'));
};

function saveCustomer(e) {
    e.preventDefault();

    const id = document.getElementById('customer-id').value;
    const payload = {
        name: document.getElementById('customer-name').value,
        email: document.getElementById('customer-email').value,
        phone: document.getElementById('customer-phone').value
    };

    const url = id ? `${API_BASE}/customers/${id}` : `${API_BASE}/customers`;
    const method = id ? 'PUT' : 'POST';

    fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    })
    .then(async res => {
        const data = await res.json();
        if (!res.ok) {
            throw new Error(data.message || 'Error occurred while saving customer');
        }
        return data;
    })
    .then(() => {
        showToast('Customer registry updated.', 'success');
        document.getElementById('customer-modal').style.display = 'none';
        refreshAllData();
        loadCustomersTable();
    })
    .catch(err => {
        showToast(err.message, 'error');
    });
}

// --- Order Archive History Module ---
function loadOrdersTable() {
    fetch(`${API_BASE}/orders`)
        .then(res => res.json())
        .then(orders => {
            state.orders = orders;
            const tbody = document.querySelector('#orders-table tbody');
            tbody.innerHTML = '';

            const filterVal = document.getElementById('orders-search').value.toLowerCase();
            const filtered = orders.filter(o => o.orderNumber.toLowerCase().includes(filterVal));

            if (filtered.length === 0) {
                tbody.innerHTML = '<tr><td colspan="9" class="text-center text-muted">No historical transactions found.</td></tr>';
                return;
            }

            filtered.forEach(o => {
                const date = new Date(o.orderDate);
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td><span class="prod-sku font-monospace">${o.orderNumber}</span></td>
                    <td>${o.customerName || '<span class="text-muted">Walk-in Guest</span>'}</td>
                    <td>${date.toLocaleString()}</td>
                    <td class="text-right">$${o.totalAmount.toFixed(2)}</td>
                    <td class="text-right text-discount">-$${o.discount.toFixed(2)}</td>
                    <td class="text-right"><strong>$${o.netAmount.toFixed(2)}</strong></td>
                    <td><span class="badge ${o.paymentMethod === 'CASH' ? 'badge-warning' : 'badge-success'}">${o.paymentMethod}</span></td>
                    <td><span class="badge badge-success">${o.status}</span></td>
                    <td class="text-center">
                        <button class="btn btn-secondary btn-xs" onclick="viewReceiptFromHistory(${o.id})"><i class="fa-solid fa-receipt"></i> Details</button>
                    </td>
                `;
                tbody.appendChild(tr);
            });
        });
}

window.viewReceiptFromHistory = function(orderId) {
    const order = state.orders.find(o => o.id === orderId);
    if (order) renderReceipt(order);
};

// --- Toast and DOM Event Wireframes ---
function initEventListeners() {
    // 1. POS category filtering
    document.getElementById('pos-category-filters').addEventListener('click', (e) => {
        if (e.target.classList.contains('btn-filter')) {
            document.querySelectorAll('#pos-category-filters .btn-filter').forEach(btn => btn.classList.remove('active'));
            e.target.classList.add('active');
            renderPOSProducts();
        }
    });

    // Search keys
    document.getElementById('pos-search').addEventListener('input', renderPOSProducts);
    document.getElementById('inventory-search').addEventListener('input', loadInventoryTable);
    document.getElementById('customers-search').addEventListener('input', loadCustomersTable);
    document.getElementById('orders-search').addEventListener('input', loadOrdersTable);

    // 2. POS Cart loyalty binding
    document.getElementById('pos-customer-select').addEventListener('change', (e) => {
        const customerId = e.target.value;
        if (customerId) {
            const customer = state.customers.find(c => c.id == customerId);
            if (customer) {
                state.activeCustomer = customer;
                document.getElementById('attached-cust-name').textContent = customer.name;
                document.getElementById('attached-cust-tier').textContent = customer.loyaltyTier;
                document.getElementById('attached-cust-tier').className = `tier-pill tier-${customer.loyaltyTier.toLowerCase()}`;
                document.getElementById('attached-cust-points').textContent = customer.loyaltyPoints;
                document.getElementById('attached-customer-badge').classList.remove('hidden');
                
                showToast(`Customer ${customer.name} attached. Dynamic discounts active.`, 'success');
            }
        } else {
            state.activeCustomer = null;
            document.getElementById('attached-customer-badge').classList.add('hidden');
        }
        updateCartTotals();
    });

    document.getElementById('detach-customer-btn').addEventListener('click', () => {
        state.activeCustomer = null;
        document.getElementById('pos-customer-select').value = '';
        document.getElementById('attached-customer-badge').classList.add('hidden');
        updateCartTotals();
        showToast('Guest checkout selected.', 'info');
    });

    // 3. POS Actions
    document.getElementById('clear-cart-btn').addEventListener('click', () => {
        state.cart = [];
        renderCart();
        showToast('Shopping cart cleared.', 'info');
    });

    document.getElementById('checkout-btn').addEventListener('click', runCheckout);

    // 4. Modal Triggers
    const modalCloses = document.querySelectorAll('.close-modal-btn');
    modalCloses.forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.modal').forEach(m => m.style.display = 'none');
        });
    });

    document.getElementById('btn-close-receipt').addEventListener('click', () => {
        document.getElementById('receipt-modal').style.display = 'none';
    });

    // Add Product Modal
    document.getElementById('btn-add-product').addEventListener('click', () => {
        document.getElementById('product-modal-title').textContent = 'Add New Product';
        document.getElementById('product-form').reset();
        document.getElementById('product-id').value = '';
        document.getElementById('product-modal').style.display = 'flex';
    });

    // Add Customer Modal
    document.getElementById('btn-add-customer').addEventListener('click', () => {
        document.getElementById('customer-modal-title').textContent = 'Register Loyalty Member';
        document.getElementById('customer-form').reset();
        document.getElementById('customer-id').value = '';
        document.getElementById('customer-modal').style.display = 'flex';
    });

    // Form Submissions
    document.getElementById('product-form').addEventListener('submit', saveProduct);
    document.getElementById('customer-form').addEventListener('submit', saveCustomer);
}

// Custom Toast Trigger
function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    let icon = '<i class="fa-solid fa-circle-info"></i>';
    if (type === 'success') {
        icon = '<i class="fa-solid fa-circle-check toast-icon-success"></i>';
    } else if (type === 'error') {
        icon = '<i class="fa-solid fa-circle-xmark toast-icon-error"></i>';
    } else if (type === 'warning') {
        icon = '<i class="fa-solid fa-triangle-exclamation toast-icon-warning"></i>';
    }

    toast.innerHTML = `
        ${icon}
        <span>${message}</span>
    `;

    container.appendChild(toast);

    // Fade and clear toast after 4s
    setTimeout(() => {
        toast.style.animation = 'toastSlideIn 0.3s reverse forwards';
        toast.addEventListener('animationend', () => {
            toast.remove();
        });
    }, 4000);
}
