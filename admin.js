// Admin dashboard functionality
import './firebase-config.js';

let adminUnsubscribes = [];
let currentAdminTab = 'orders';

// Initialize admin dashboard
document.addEventListener('DOMContentLoaded', () => {
    initializeAdminDashboard();
    setupAdminEventListeners();
});

// Initialize admin dashboard
function initializeAdminDashboard() {
    // Check if user is authenticated
    if (window.auth) {
        window.firebaseExports.onAuthStateChanged(window.auth, (user) => {
            if (user) {
                loadAdminData();
            } else {
                // Clean up subscriptions if user logs out
                cleanupAdminSubscriptions();
            }
        });
    }
}

// Setup admin event listeners
function setupAdminEventListeners() {
    // Tab switching
    const tabButtons = document.querySelectorAll('.tab-btn');
    tabButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const tab = e.target.dataset.tab;
            switchAdminTab(tab);
        });
    });

    // Logout button
    const logoutBtn = document.getElementById('adminLogout');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleAdminLogout);
    }

    // Filter controls
    const orderStatus = document.getElementById('orderStatus');
    if (orderStatus) {
        orderStatus.addEventListener('change', filterOrders);
    }

    const bookingStatus = document.getElementById('bookingStatus');
    if (bookingStatus) {
        bookingStatus.addEventListener('change', filterBookings);
    }

    // Add buttons
    const addDevice = document.getElementById('addDevice');
    if (addDevice) {
        addDevice.addEventListener('click', () => openDeviceModal());
    }

    const addMenuItem = document.getElementById('addMenuItem');
    if (addMenuItem) {
        addMenuItem.addEventListener('click', () => openMenuItemModal());
    }

    // Generate report button
    const generateReport = document.getElementById('generateReport');
    if (generateReport) {
        generateReport.addEventListener('click', generateAnalyticsReport);
    }

    // Modal event listeners
    setupModalEventListeners();
}

// Switch admin tab
function switchAdminTab(tab) {
    // Update button states
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.tab === tab) {
            btn.classList.add('active');
        }
    });

    // Update content visibility
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });

    const targetTab = document.getElementById(`${tab}Tab`);
    if (targetTab) {
        targetTab.classList.add('active');
        currentAdminTab = tab;
        
        // Load specific data based on tab
        switch(tab) {
            case 'orders':
                loadOrders();
                break;
            case 'bookings':
                loadBookings();
                break;
            case 'devices':
                loadDevicesAdmin();
                break;
            case 'menu':
                loadMenuAdmin();
                break;
            case 'analytics':
                loadAnalytics();
                break;
        }
    }
}

// Load admin data
function loadAdminData() {
    loadOrders();
    loadBookings();
    loadDevicesAdmin();
    loadMenuAdmin();
    loadAnalytics();
}

// Load orders with real-time updates
function loadOrders() {
    const ordersList = document.getElementById('ordersList');
    if (!ordersList) return;

    // Clean up existing subscription
    if (adminUnsubscribes.orders) {
        adminUnsubscribes.orders();
    }

    try {
        adminUnsubscribes.orders = window.FirebaseHelper.subscribeToCollection(
            'orders',
            (orders) => {
                displayOrders(orders.sort((a, b) => {
                    const aTime = a.createdAt?.toDate?.() || new Date(0);
                    const bTime = b.createdAt?.toDate?.() || new Date(0);
                    return bTime - aTime;
                }));
            },
            [window.firebaseExports.orderBy('createdAt', 'desc')]
        );
    } catch (error) {
        console.error('Error loading orders:', error);
        ordersList.innerHTML = '<p>Error loading orders</p>';
    }
}

// Display orders
function displayOrders(orders) {
    const ordersList = document.getElementById('ordersList');
    if (!ordersList) return;

    const statusFilter = document.getElementById('orderStatus').value;
    const filteredOrders = statusFilter ? orders.filter(order => order.status === statusFilter) : orders;

    if (filteredOrders.length === 0) {
        ordersList.innerHTML = '<p>No orders found</p>';
        return;
    }

    ordersList.innerHTML = '';
    filteredOrders.forEach(order => {
        const orderElement = document.createElement('div');
        orderElement.className = 'order-item';
        
        const orderDate = order.createdAt?.toDate?.() || new Date();
        const formattedDate = orderDate.toLocaleDateString();
        const formattedTime = orderDate.toLocaleTimeString();

        orderElement.innerHTML = `
            <div class="item-header">
                <div class="item-title">${order.customerName}</div>
                <div class="item-status status-${order.status}">${window.LanguageManager.translate(order.status)}</div>
            </div>
            <div class="item-details">
                <p><strong>Phone:</strong> ${order.customerPhone}</p>
                <p><strong>Room/Device:</strong> ${order.roomNumber || 'Not specified'}</p>
                <p><strong>Date:</strong> ${formattedDate} ${formattedTime}</p>
                <p><strong>Total:</strong> ${order.total} EGP</p>
                <div class="order-items">
                    <strong>Items:</strong>
                    <ul>
                        ${order.items.map(item => `
                            <li>${getCurrentLanguage() === 'ar' ? item.nameArabic : item.name} x${item.quantity} - ${item.price * item.quantity} EGP</li>
                        `).join('')}
                    </ul>
                </div>
            </div>
            <div class="item-actions">
                ${order.status === 'pending' ? `
                    <button class="action-btn success" onclick="updateOrderStatus('${order.id}', 'preparing')">
                        ${window.LanguageManager.translate('preparing')}
                    </button>
                ` : ''}
                ${order.status === 'preparing' ? `
                    <button class="action-btn primary" onclick="updateOrderStatus('${order.id}', 'ready')">
                        ${window.LanguageManager.translate('ready')}
                    </button>
                ` : ''}
                ${order.status === 'ready' ? `
                    <button class="action-btn success" onclick="updateOrderStatus('${order.id}', 'completed')">
                        ${window.LanguageManager.translate('completed')}
                    </button>
                ` : ''}
                <button class="action-btn danger" onclick="deleteOrder('${order.id}')">
                    ${window.LanguageManager.translate('delete')}
                </button>
            </div>
        `;
        ordersList.appendChild(orderElement);
    });
}

// Load bookings with real-time updates
function loadBookings() {
    const bookingsList = document.getElementById('bookingsList');
    if (!bookingsList) return;

    // Clean up existing subscription
    if (adminUnsubscribes.bookings) {
        adminUnsubscribes.bookings();
    }

    try {
        adminUnsubscribes.bookings = window.FirebaseHelper.subscribeToCollection(
            'bookings',
            (bookings) => {
                displayBookings(bookings.sort((a, b) => {
                    const aTime = a.createdAt?.toDate?.() || new Date(0);
                    const bTime = b.createdAt?.toDate?.() || new Date(0);
                    return bTime - aTime;
                }));
            },
            [window.firebaseExports.orderBy('createdAt', 'desc')]
        );
    } catch (error) {
        console.error('Error loading bookings:', error);
        bookingsList.innerHTML = '<p>Error loading bookings</p>';
    }
}

// Display bookings
function displayBookings(bookings) {
    const bookingsList = document.getElementById('bookingsList');
    if (!bookingsList) return;

    const statusFilter = document.getElementById('bookingStatus').value;
    const filteredBookings = statusFilter ? bookings.filter(booking => booking.status === statusFilter) : bookings;

    if (filteredBookings.length === 0) {
        bookingsList.innerHTML = '<p>No bookings found</p>';
        return;
    }

    bookingsList.innerHTML = '';
    filteredBookings.forEach(booking => {
        const bookingElement = document.createElement('div');
        bookingElement.className = 'booking-item';
        
        const bookingDate = booking.createdAt?.toDate?.() || new Date();
        const formattedDate = bookingDate.toLocaleDateString();

        bookingElement.innerHTML = `
            <div class="item-header">
                <div class="item-title">${booking.customerName}</div>
                <div class="item-status status-${booking.status}">${window.LanguageManager.translate(booking.status)}</div>
            </div>
            <div class="item-details">
                <p><strong>Phone:</strong> ${booking.customerPhone}</p>
                <p><strong>Device:</strong> ${booking.deviceName}</p>
                <p><strong>Date:</strong> ${booking.date}</p>
                <p><strong>Time:</strong> ${formatTime(booking.time)}</p>
                <p><strong>Duration:</strong> ${booking.duration} hours</p>
                <p><strong>Total Cost:</strong> ${booking.totalCost} EGP</p>
                <p><strong>Booked:</strong> ${formattedDate}</p>
            </div>
            <div class="item-actions">
                ${booking.status === 'pending' ? `
                    <button class="action-btn success" onclick="updateBookingStatus('${booking.id}', 'confirmed')">
                        ${window.LanguageManager.translate('confirm')}
                    </button>
                ` : ''}
                ${booking.status === 'confirmed' ? `
                    <button class="action-btn primary" onclick="updateBookingStatus('${booking.id}', 'active')">
                        ${window.LanguageManager.translate('active')}
                    </button>
                ` : ''}
                ${booking.status === 'active' ? `
                    <button class="action-btn success" onclick="updateBookingStatus('${booking.id}', 'completed')">
                        ${window.LanguageManager.translate('complete')}
                    </button>
                ` : ''}
                <button class="action-btn danger" onclick="deleteBooking('${booking.id}')">
                    ${window.LanguageManager.translate('delete')}
                </button>
            </div>
        `;
        bookingsList.appendChild(bookingElement);
    });
}

// Load devices for admin
function loadDevicesAdmin() {
    const devicesList = document.getElementById('devicesList');
    if (!devicesList) return;

    // Clean up existing subscription
    if (adminUnsubscribes.devices) {
        adminUnsubscribes.devices();
    }

    try {
        adminUnsubscribes.devices = window.FirebaseHelper.subscribeToCollection(
            'devices',
            (devices) => {
                displayDevicesAdmin(devices.sort((a, b) => a.name.localeCompare(b.name)));
            }
        );
    } catch (error) {
        console.error('Error loading devices:', error);
        devicesList.innerHTML = '<p>Error loading devices</p>';
    }
}

// Display devices for admin
function displayDevicesAdmin(devices) {
    const devicesList = document.getElementById('devicesList');
    if (!devicesList) return;

    if (devices.length === 0) {
        devicesList.innerHTML = '<p>No devices found</p>';
        return;
    }

    devicesList.innerHTML = '';
    devices.forEach(device => {
        const deviceElement = document.createElement('div');
        deviceElement.className = 'device-item';
        
        deviceElement.innerHTML = `
            <div class="item-header">
                <div class="item-title">${device.name}</div>
                <div class="item-status ${device.available ? 'status-confirmed' : 'status-pending'}">
                    ${device.available ? window.LanguageManager.translate('available') : window.LanguageManager.translate('maintenance')}
                </div>
            </div>
            <div class="item-details">
                <p><strong>Type:</strong> ${window.LanguageManager.translate(device.type + '_room')}</p>
                <p><strong>Rate:</strong> ${device.rate} EGP/hour</p>
                <p><strong>Status:</strong> ${device.status || 'Available'}</p>
            </div>
            <div class="item-actions">
                <button class="action-btn primary" onclick="editDevice('${device.id}')">
                    ${window.LanguageManager.translate('edit')}
                </button>
                <button class="action-btn ${device.available ? 'danger' : 'success'}" onclick="toggleDeviceAvailability('${device.id}', ${!device.available})">
                    ${device.available ? 'Disable' : 'Enable'}
                </button>
                <button class="action-btn danger" onclick="deleteDevice('${device.id}')">
                    ${window.LanguageManager.translate('delete')}
                </button>
            </div>
        `;
        devicesList.appendChild(deviceElement);
    });
}

// Load menu for admin
function loadMenuAdmin() {
    const menuManagement = document.getElementById('menuManagement');
    if (!menuManagement) return;

    // Clean up existing subscription
    if (adminUnsubscribes.menu) {
        adminUnsubscribes.menu();
    }

    try {
        adminUnsubscribes.menu = window.FirebaseHelper.subscribeToCollection(
            'menu',
            (menuItems) => {
                displayMenuAdmin(menuItems.sort((a, b) => a.name.localeCompare(b.name)));
            }
        );
    } catch (error) {
        console.error('Error loading menu:', error);
        menuManagement.innerHTML = '<p>Error loading menu</p>';
    }
}

// Display menu for admin
function displayMenuAdmin(menuItems) {
    const menuManagement = document.getElementById('menuManagement');
    if (!menuManagement) return;

    if (menuItems.length === 0) {
        menuManagement.innerHTML = '<p>No menu items found</p>';
        return;
    }

    menuManagement.innerHTML = '';
    menuItems.forEach(item => {
        const itemElement = document.createElement('div');
        itemElement.className = 'menu-item-admin';
        
        itemElement.innerHTML = `
            <div class="item-header">
                <div class="item-title">${getCurrentLanguage() === 'ar' ? item.nameArabic : item.name}</div>
                <div class="item-status ${item.available ? 'status-confirmed' : 'status-pending'}">
                    ${item.available ? window.LanguageManager.translate('available') : 'Unavailable'}
                </div>
            </div>
            <div class="item-details">
                <p><strong>Category:</strong> ${window.LanguageManager.translate(item.category)}</p>
                <p><strong>Price:</strong> ${item.price} EGP</p>
                <p><strong>Description:</strong> ${item.description || 'No description'}</p>
            </div>
            <div class="item-actions">
                <button class="action-btn primary" onclick="editMenuItem('${item.id}')">
                    ${window.LanguageManager.translate('edit')}
                </button>
                <button class="action-btn ${item.available ? 'danger' : 'success'}" onclick="toggleMenuItemAvailability('${item.id}', ${!item.available})">
                    ${item.available ? 'Disable' : 'Enable'}
                </button>
                <button class="action-btn danger" onclick="deleteMenuItem('${item.id}')">
                    ${window.LanguageManager.translate('delete')}
                </button>
            </div>
        `;
        menuManagement.appendChild(itemElement);
    });
}

// Load analytics
async function loadAnalytics() {
    try {
        const startDate = document.getElementById('analyticsStartDate').value;
        const endDate = document.getElementById('analyticsEndDate').value;
        
        if (!startDate || !endDate) {
            return;
        }

        const startTimestamp = new Date(startDate);
        const endTimestamp = new Date(endDate);
        endTimestamp.setHours(23, 59, 59, 999);

        // Load orders
        const orders = await window.FirebaseHelper.getDocuments('orders', [
            window.firebaseExports.where('createdAt', '>=', startTimestamp),
            window.firebaseExports.where('createdAt', '<=', endTimestamp)
        ]);

        // Load bookings
        const bookings = await window.FirebaseHelper.getDocuments('bookings', [
            window.firebaseExports.where('createdAt', '>=', startTimestamp),
            window.firebaseExports.where('createdAt', '<=', endTimestamp)
        ]);

        updateAnalyticsDisplay(orders, bookings);
    } catch (error) {
        console.error('Error loading analytics:', error);
    }
}

// Update analytics display
function updateAnalyticsDisplay(orders, bookings) {
    // Total orders
    const totalOrders = document.getElementById('totalOrders');
    if (totalOrders) {
        totalOrders.textContent = orders.length;
    }

    // Total bookings
    const totalBookings = document.getElementById('totalBookings');
    if (totalBookings) {
        totalBookings.textContent = bookings.length;
    }

    // Total revenue
    const orderRevenue = orders.reduce((sum, order) => sum + (order.total || 0), 0);
    const bookingRevenue = bookings.reduce((sum, booking) => sum + (booking.totalCost || 0), 0);
    const totalRevenue = orderRevenue + bookingRevenue;
    
    const totalRevenueElement = document.getElementById('totalRevenue');
    if (totalRevenueElement) {
        totalRevenueElement.textContent = `${totalRevenue} EGP`;
    }

    // Popular items
    const itemCounts = {};
    orders.forEach(order => {
        if (order.items) {
            order.items.forEach(item => {
                const key = getCurrentLanguage() === 'ar' ? item.nameArabic : item.name;
                itemCounts[key] = (itemCounts[key] || 0) + item.quantity;
            });
        }
    });

    const popularItems = Object.entries(itemCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5);

    const popularItemsElement = document.getElementById('popularItems');
    if (popularItemsElement) {
        popularItemsElement.innerHTML = '';
        popularItems.forEach(([item, count]) => {
            const itemElement = document.createElement('div');
            itemElement.textContent = `${item}: ${count} orders`;
            popularItemsElement.appendChild(itemElement);
        });
    }
}

// Generate analytics report
async function generateAnalyticsReport() {
    const startDate = document.getElementById('analyticsStartDate').value;
    const endDate = document.getElementById('analyticsEndDate').value;
    
    if (!startDate || !endDate) {
        showToast('Please select date range', 'error');
        return;
    }

    try {
        showLoading(true);
        await loadAnalytics();
        showToast('Report generated successfully', 'success');
    } catch (error) {
        console.error('Error generating report:', error);
        showToast('Error generating report', 'error');
    } finally {
        showLoading(false);
    }
}

// Filter functions
function filterOrders() {
    loadOrders();
}

function filterBookings() {
    loadBookings();
}

// Update order status
async function updateOrderStatus(orderId, newStatus) {
    try {
        showLoading(true);
        await window.FirebaseHelper.updateDocument('orders', orderId, {
            status: newStatus
        });
        showToast('Order status updated successfully', 'success');
    } catch (error) {
        console.error('Error updating order status:', error);
        showToast('Error updating order status', 'error');
    } finally {
        showLoading(false);
    }
}

// Update booking status
async function updateBookingStatus(bookingId, newStatus) {
    try {
        showLoading(true);
        await window.FirebaseHelper.updateDocument('bookings', bookingId, {
            status: newStatus
        });
        showToast('Booking status updated successfully', 'success');
    } catch (error) {
        console.error('Error updating booking status:', error);
        showToast('Error updating booking status', 'error');
    } finally {
        showLoading(false);
    }
}

// Delete order
async function deleteOrder(orderId) {
    if (!confirm('Are you sure you want to delete this order?')) {
        return;
    }

    try {
        showLoading(true);
        await window.FirebaseHelper.deleteDocument('orders', orderId);
        showToast('Order deleted successfully', 'success');
    } catch (error) {
        console.error('Error deleting order:', error);
        showToast('Error deleting order', 'error');
    } finally {
        showLoading(false);
    }
}

// Delete booking
async function deleteBooking(bookingId) {
    if (!confirm('Are you sure you want to delete this booking?')) {
        return;
    }

    try {
        showLoading(true);
        await window.FirebaseHelper.deleteDocument('bookings', bookingId);
        showToast('Booking deleted successfully', 'success');
    } catch (error) {
        console.error('Error deleting booking:', error);
        showToast('Error deleting booking', 'error');
    } finally {
        showLoading(false);
    }
}

// Device management functions
async function toggleDeviceAvailability(deviceId, available) {
    try {
        showLoading(true);
        await window.FirebaseHelper.updateDocument('devices', deviceId, {
            available: available,
            status: available ? 'available' : 'maintenance'
        });
        showToast('Device availability updated', 'success');
    } catch (error) {
        console.error('Error updating device availability:', error);
        showToast('Error updating device availability', 'error');
    } finally {
        showLoading(false);
    }
}

async function deleteDevice(deviceId) {
    if (!confirm('Are you sure you want to delete this device?')) {
        return;
    }

    try {
        showLoading(true);
        await window.FirebaseHelper.deleteDocument('devices', deviceId);
        showToast('Device deleted successfully', 'success');
    } catch (error) {
        console.error('Error deleting device:', error);
        showToast('Error deleting device', 'error');
    } finally {
        showLoading(false);
    }
}

// Menu management functions
async function toggleMenuItemAvailability(itemId, available) {
    try {
        showLoading(true);
        await window.FirebaseHelper.updateDocument('menu', itemId, {
            available: available
        });
        showToast('Menu item availability updated', 'success');
    } catch (error) {
        console.error('Error updating menu item availability:', error);
        showToast('Error updating menu item availability', 'error');
    } finally {
        showLoading(false);
    }
}

async function deleteMenuItem(itemId) {
    if (!confirm('Are you sure you want to delete this menu item?')) {
        return;
    }

    try {
        showLoading(true);
        await window.FirebaseHelper.deleteDocument('menu', itemId);
        showToast('Menu item deleted successfully', 'success');
    } catch (error) {
        console.error('Error deleting menu item:', error);
        showToast('Error deleting menu item', 'error');
    } finally {
        showLoading(false);
    }
}

// Modal functions
function setupModalEventListeners() {
    // Menu item modal
    const menuItemModal = document.getElementById('menuItemModal');
    const closeModal = document.getElementById('closeModal');
    const menuItemForm = document.getElementById('menuItemForm');

    if (closeModal) {
        closeModal.addEventListener('click', () => {
            menuItemModal.classList.remove('active');
        });
    }

    if (menuItemForm) {
        menuItemForm.addEventListener('submit', handleMenuItemSubmit);
    }

    // Device modal
    const deviceModal = document.getElementById('deviceModal');
    const closeDeviceModal = document.getElementById('closeDeviceModal');
    const deviceForm = document.getElementById('deviceForm');

    if (closeDeviceModal) {
        closeDeviceModal.addEventListener('click', () => {
            deviceModal.classList.remove('active');
        });
    }

    if (deviceForm) {
        deviceForm.addEventListener('submit', handleDeviceSubmit);
    }

    // Close modals when clicking outside
    [menuItemModal, deviceModal].forEach(modal => {
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.classList.remove('active');
                }
            });
        }
    });
}

function openMenuItemModal(itemId = null) {
    const modal = document.getElementById('menuItemModal');
    const modalTitle = document.getElementById('modalTitle');
    const form = document.getElementById('menuItemForm');
    
    if (!modal || !modalTitle || !form) return;

    modal.classList.add('active');
    form.reset();
    
    if (itemId) {
        modalTitle.textContent = 'Edit Menu Item';
        form.dataset.itemId = itemId;
        loadMenuItemForEdit(itemId);
    } else {
        modalTitle.textContent = window.LanguageManager.translate('add_menu_item');
        delete form.dataset.itemId;
    }
}

function openDeviceModal(deviceId = null) {
    const modal = document.getElementById('deviceModal');
    const modalTitle = document.getElementById('deviceModalTitle');
    const form = document.getElementById('deviceForm');
    
    if (!modal || !modalTitle || !form) return;

    modal.classList.add('active');
    form.reset();
    
    if (deviceId) {
        modalTitle.textContent = 'Edit Device';
        form.dataset.deviceId = deviceId;
        loadDeviceForEdit(deviceId);
    } else {
        modalTitle.textContent = window.LanguageManager.translate('add_device');
        delete form.dataset.deviceId;
    }
}

async function loadMenuItemForEdit(itemId) {
    try {
        const items = await window.FirebaseHelper.getDocuments('menu');
        const item = items.find(i => i.id === itemId);
        
        if (item) {
            document.getElementById('itemName').value = item.name;
            document.getElementById('itemNameArabic').value = item.nameArabic;
            document.getElementById('itemCategory').value = item.category;
            document.getElementById('itemPrice').value = item.price;
            document.getElementById('itemDescription').value = item.description || '';
            document.getElementById('itemAvailable').checked = item.available;
        }
    } catch (error) {
        console.error('Error loading menu item:', error);
    }
}

async function loadDeviceForEdit(deviceId) {
    try {
        const devices = await window.FirebaseHelper.getDocuments('devices');
        const device = devices.find(d => d.id === deviceId);
        
        if (device) {
            document.getElementById('deviceName').value = device.name;
            document.getElementById('deviceType').value = device.type;
            document.getElementById('deviceRate').value = device.rate;
            document.getElementById('deviceAvailable').checked = device.available;
        }
    } catch (error) {
        console.error('Error loading device:', error);
    }
}

async function handleMenuItemSubmit(e) {
    e.preventDefault();
    
    const form = e.target;
    const itemId = form.dataset.itemId;
    
    const itemData = {
        name: document.getElementById('itemName').value,
        nameArabic: document.getElementById('itemNameArabic').value,
        category: document.getElementById('itemCategory').value,
        price: parseFloat(document.getElementById('itemPrice').value),
        description: document.getElementById('itemDescription').value,
        available: document.getElementById('itemAvailable').checked
    };
    
    try {
        showLoading(true);
        
        if (itemId) {
            await window.FirebaseHelper.updateDocument('menu', itemId, itemData);
            showToast('Menu item updated successfully', 'success');
        } else {
            await window.FirebaseHelper.addDocument('menu', itemData);
            showToast('Menu item added successfully', 'success');
        }
        
        document.getElementById('menuItemModal').classList.remove('active');
    } catch (error) {
        console.error('Error saving menu item:', error);
        showToast('Error saving menu item', 'error');
    } finally {
        showLoading(false);
    }
}

async function handleDeviceSubmit(e) {
    e.preventDefault();
    
    const form = e.target;
    const deviceId = form.dataset.deviceId;
    
    const deviceData = {
        name: document.getElementById('deviceName').value,
        type: document.getElementById('deviceType').value,
        rate: parseFloat(document.getElementById('deviceRate').value),
        available: document.getElementById('deviceAvailable').checked,
        status: document.getElementById('deviceAvailable').checked ? 'available' : 'maintenance'
    };
    
    try {
        showLoading(true);
        
        if (deviceId) {
            await window.FirebaseHelper.updateDocument('devices', deviceId, deviceData);
            showToast('Device updated successfully', 'success');
        } else {
            await window.FirebaseHelper.addDocument('devices', deviceData);
            showToast('Device added successfully', 'success');
        }
        
        document.getElementById('deviceModal').classList.remove('active');
    } catch (error) {
        console.error('Error saving device:', error);
        showToast('Error saving device', 'error');
    } finally {
        showLoading(false);
    }
}

// Admin logout
async function handleAdminLogout() {
    try {
        showLoading(true);
        await window.firebaseExports.signOut(window.auth);
        showToast('Logged out successfully', 'success');
        cleanupAdminSubscriptions();
        window.navigateToPage('home');
    } catch (error) {
        console.error('Error logging out:', error);
        showToast('Error logging out', 'error');
    } finally {
        showLoading(false);
    }
}

// Clean up admin subscriptions
function cleanupAdminSubscriptions() {
    Object.values(adminUnsubscribes).forEach(unsubscribe => {
        if (typeof unsubscribe === 'function') {
            unsubscribe();
        }
    });
    adminUnsubscribes = [];
}

// Helper functions
function formatTime(time24) {
    const [hours, minutes] = time24.split(':');
    const hour = parseInt(hours);
    const period = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    
    if (window.LanguageManager.getCurrentLanguage() === 'ar') {
        return `${hour12}:${minutes} ${period === 'PM' ? 'م' : 'ص'}`;
    }
    return `${hour12}:${minutes} ${period}`;
}

function getCurrentLanguage() {
    return window.LanguageManager.getCurrentLanguage();
}

function showLoading(show) {
    const spinner = document.getElementById('loadingSpinner');
    if (spinner) {
        spinner.classList.toggle('active', show);
    }
}

function showToast(message, type = 'success') {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.remove();
    }, 3000);
}

// Export functions for HTML onclick handlers
window.updateOrderStatus = updateOrderStatus;
window.updateBookingStatus = updateBookingStatus;
window.deleteOrder = deleteOrder;
window.deleteBooking = deleteBooking;
window.toggleDeviceAvailability = toggleDeviceAvailability;
window.deleteDevice = deleteDevice;
window.editDevice = (deviceId) => openDeviceModal(deviceId);
window.toggleMenuItemAvailability = toggleMenuItemAvailability;
window.deleteMenuItem = deleteMenuItem;
window.editMenuItem = (itemId) => openMenuItemModal(itemId);
window.openMenuItemModal = openMenuItemModal;
window.openDeviceModal = openDeviceModal;

// Clean up subscriptions on page unload
window.addEventListener('beforeunload', () => {
    cleanupAdminSubscriptions();
});
