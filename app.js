// Main application JavaScript
import './firebase-config.js';

let currentUser = null;
let currentPage = 'home';
let cart = [];
let menuItems = [];
let devices = [];
let unsubscribeCallbacks = [];

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
    setupEventListeners();
    setupNavigation();
    setupBookingForm();
    setupOrderSystem();
    loadAvailability();
});

// Initialize the app
function initializeApp() {
    // Check authentication state
    if (window.auth) {
        window.firebaseExports.onAuthStateChanged(window.auth, (user) => {
            currentUser = user;
            updateUIForAuth();
        });
    }
    
    // Set minimum date for booking
    const today = new Date().toISOString().split('T')[0];
    const bookingDate = document.getElementById('bookingDate');
    if (bookingDate) {
        bookingDate.min = today;
    }
    
    // Load menu items
    loadMenuItems();
    
    // Load devices
    loadDevices();
    
    // Initialize analytics date range
    initializeDateRange();
}

// Setup event listeners
function setupEventListeners() {
    // Admin login
    const adminLogin = document.getElementById('adminLogin');
    if (adminLogin) {
        adminLogin.addEventListener('click', handleAdminLogin);
    }
    
    // Booking form
    const submitBooking = document.getElementById('submitBooking');
    if (submitBooking) {
        submitBooking.addEventListener('click', handleBookingSubmit);
    }
    
    // Order form
    const submitOrder = document.getElementById('submitOrder');
    if (submitOrder) {
        submitOrder.addEventListener('click', handleOrderSubmit);
    }
    
    // Room type change
    const roomType = document.getElementById('roomType');
    if (roomType) {
        roomType.addEventListener('change', updateAvailableTimeSlots);
    }
    
    // Date change
    const bookingDate = document.getElementById('bookingDate');
    if (bookingDate) {
        bookingDate.addEventListener('change', updateAvailableTimeSlots);
    }
    
    // Menu category buttons
    const categoryButtons = document.querySelectorAll('.category-btn');
    categoryButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const category = e.target.dataset.category;
            filterMenuItems(category);
            
            // Update active state
            categoryButtons.forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
        });
    });
    
    // Mobile menu toggle
    const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
    if (mobileMenuToggle) {
        mobileMenuToggle.addEventListener('click', toggleMobileMenu);
    }
    
    // Hidden admin access - triple click on logo
    const navLogo = document.querySelector('.nav-logo');
    if (navLogo) {
        let clickCount = 0;
        let clickTimer = null;
        
        navLogo.addEventListener('click', () => {
            clickCount++;
            if (clickCount === 1) {
                clickTimer = setTimeout(() => {
                    clickCount = 0;
                }, 1000);
            } else if (clickCount === 3) {
                clearTimeout(clickTimer);
                clickCount = 0;
                handleAdminLogin();
            }
        });
    }
}

// Setup navigation
function setupNavigation() {
    const navLinks = document.querySelectorAll('.nav-link');
    const ctaButtons = document.querySelectorAll('.cta-button[data-page]');
    
    [...navLinks, ...ctaButtons].forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const page = e.target.dataset.page || e.target.getAttribute('data-page');
            if (page) {
                navigateToPage(page);
                // Close mobile menu if open
                const navMenu = document.querySelector('.nav-menu');
                if (navMenu && navMenu.classList.contains('mobile-active')) {
                    toggleMobileMenu();
                }
            }
        });
    });
}

// Navigate to page
function navigateToPage(page) {
    // Hide all pages
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    
    // Show selected page
    const targetPage = document.getElementById(page);
    if (targetPage) {
        targetPage.classList.add('active');
        currentPage = page;
        
        // Update navigation active state
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
            if (link.dataset.page === page) {
                link.classList.add('active');
            }
        });
        
        // Show/hide footer based on page
        const footer = document.querySelector('.footer');
        if (footer) {
            if (page === 'admin') {
                footer.style.display = 'none';
            } else {
                footer.style.display = 'block';
            }
        }
        
        // Load page-specific data
        if (page === 'availability') {
            loadAvailability();
        } else if (page === 'order') {
            loadMenuItems();
        }
    }
}

// Update UI based on authentication state
function updateUIForAuth() {
    const adminLogin = document.getElementById('adminLogin');
    const adminPage = document.getElementById('admin');
    
    if (currentUser) {
        if (adminLogin) {
            adminLogin.innerHTML = '<i class="fas fa-user-shield"></i> <span>Dashboard</span>';
            adminLogin.onclick = () => navigateToPage('admin');
        }
        if (adminPage) {
            adminPage.style.display = 'block';
        }
    } else {
        if (adminLogin) {
            adminLogin.innerHTML = '<i class="fas fa-user-shield"></i> <span data-translate="admin">Admin</span>';
            adminLogin.onclick = handleAdminLogin;
        }
        if (adminPage) {
            adminPage.style.display = 'none';
        }
        if (currentPage === 'admin') {
            navigateToPage('home');
        }
    }
}

// Handle admin login
async function handleAdminLogin() {
    if (currentUser) {
        navigateToPage('admin');
        return;
    }
    
    const email = prompt('Enter admin email:');
    const password = prompt('Enter admin password:');
    
    if (email && password) {
        try {
            showLoading(true);
            await window.firebaseExports.signInWithEmailAndPassword(window.auth, email, password);
            showToast('Login successful!', 'success');
            navigateToPage('admin');
        } catch (error) {
            console.error('Login error:', error);
            showToast('Invalid email or password', 'error');
        } finally {
            showLoading(false);
        }
    }
}

// Setup booking form
function setupBookingForm() {
    const bookingDate = document.getElementById('bookingDate');
    const bookingTime = document.getElementById('bookingTime');
    const submitBooking = document.getElementById('submitBooking');
    const roomType = document.getElementById('roomType');
    const duration = document.getElementById('duration');
    
    // Set minimum date to today
    if (bookingDate) {
        const today = new Date().toISOString().split('T')[0];
        bookingDate.min = today;
        bookingDate.value = today;
    }
    
    // Generate time slots
    generateTimeSlots();
    
    // Update available time slots when date changes
    if (bookingDate) {
        bookingDate.addEventListener('change', updateAvailableTimeSlots);
    }
    
    // Update pricing when room type or duration changes
    if (roomType) {
        roomType.addEventListener('change', updatePricing);
    }
    
    if (duration) {
        duration.addEventListener('change', updatePricing);
    }
    
    if (submitBooking) {
        submitBooking.addEventListener('click', handleBookingSubmit);
    }
}

// Generate time slots
function generateTimeSlots() {
    const timeSelect = document.getElementById('bookingTime');
    if (!timeSelect) return;
    
    const times = [
        '09:00', '10:00', '11:00', '12:00', '13:00', '14:00',
        '15:00', '16:00', '17:00', '18:00', '19:00', '20:00',
        '21:00', '22:00', '23:00'
    ];
    
    timeSelect.innerHTML = '<option value="">Select Time</option>';
    times.forEach(time => {
        const option = document.createElement('option');
        option.value = time;
        option.textContent = formatTime(time);
        timeSelect.appendChild(option);
    });
}

// Format time for display
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

// Update available time slots
async function updateAvailableTimeSlots() {
    const roomType = document.getElementById('roomType').value;
    const date = document.getElementById('bookingDate').value;
    const timeSelect = document.getElementById('bookingTime');
    
    if (!roomType || !date || !timeSelect) return;
    
    try {
        // Get existing bookings for the date and room type
        const bookings = await window.FirebaseHelper.getDocuments('bookings', [
            window.firebaseExports.where('date', '==', date),
            window.firebaseExports.where('roomType', '==', roomType),
            window.firebaseExports.where('status', '!=', 'cancelled')
        ]);
        
        // Get available devices for the room type
        const availableDevices = await window.FirebaseHelper.getDocuments('devices', [
            window.firebaseExports.where('type', '==', roomType),
            window.firebaseExports.where('available', '==', true)
        ]);
        
        const totalDevices = availableDevices.length;
        const bookedSlots = {};
        
        // Count bookings per time slot
        bookings.forEach(booking => {
            const startTime = booking.time;
            const duration = booking.duration;
            const endHour = parseInt(startTime.split(':')[0]) + duration;
            
            for (let hour = parseInt(startTime.split(':')[0]); hour < endHour; hour++) {
                const timeSlot = `${hour.toString().padStart(2, '0')}:00`;
                bookedSlots[timeSlot] = (bookedSlots[timeSlot] || 0) + 1;
            }
        });
        
        // Update time select options
        const options = timeSelect.querySelectorAll('option');
        options.forEach(option => {
            if (option.value) {
                const bookedCount = bookedSlots[option.value] || 0;
                const available = totalDevices - bookedCount;
                
                if (available > 0) {
                    option.disabled = false;
                    option.textContent = `${formatTime(option.value)} (${available} available)`;
                } else {
                    option.disabled = true;
                    option.textContent = `${formatTime(option.value)} (Fully booked)`;
                }
            }
        });
        
    } catch (error) {
        console.error('Error updating time slots:', error);
    }
}

// Handle booking submission
async function handleBookingSubmit() {
    const roomType = document.getElementById('roomType').value;
    const date = document.getElementById('bookingDate').value;
    const time = document.getElementById('bookingTime').value;
    const duration = parseInt(document.getElementById('duration').value);
    const customerName = document.getElementById('customerName').value;
    const customerPhone = document.getElementById('customerPhone').value;
    
    if (!roomType || !date || !time || !duration || !customerName || !customerPhone) {
        showToast('Please fill in all required fields', 'error');
        return;
    }
    
    try {
        showLoading(true);
        
        // Get device rate
        const availableDevices = await window.FirebaseHelper.getDocuments('devices', [
            window.firebaseExports.where('type', '==', roomType),
            window.firebaseExports.where('available', '==', true)
        ]);
        
        if (availableDevices.length === 0) {
            showToast('No available devices for this room type', 'error');
            return;
        }
        
        const device = availableDevices[0];
        const totalCost = device.rate * duration;
        
        const booking = {
            roomType,
            deviceId: device.id,
            deviceName: device.name,
            date,
            time,
            duration,
            customerName,
            customerPhone,
            totalCost,
            status: 'pending',
            createdAt: window.firebaseExports.serverTimestamp()
        };
        
        await window.FirebaseHelper.addDocument('bookings', booking);
        
        showToast('Booking created successfully!', 'success');
        
        // Reset form
        document.getElementById('roomType').value = '';
        document.getElementById('bookingDate').value = '';
        document.getElementById('bookingTime').value = '';
        document.getElementById('duration').value = '1';
        document.getElementById('customerName').value = '';
        document.getElementById('customerPhone').value = '';
        
    } catch (error) {
        console.error('Error creating booking:', error);
        showToast('Error creating booking. Please try again.', 'error');
    } finally {
        showLoading(false);
    }
}

// Setup order system
function setupOrderSystem() {
    updateCartDisplay();
}

// Load menu items
async function loadMenuItems() {
    try {
        menuItems = await window.FirebaseHelper.getDocuments('menu', [
            window.firebaseExports.where('available', '==', true)
        ]);
        displayMenuItems(menuItems);
    } catch (error) {
        console.error('Error loading menu items:', error);
    }
}

// Display menu items
function displayMenuItems(items) {
    const menuGrid = document.getElementById('menuGrid');
    if (!menuGrid) return;
    
    menuGrid.innerHTML = '';
    
    items.forEach(item => {
        const itemElement = document.createElement('div');
        itemElement.className = 'menu-item';
        itemElement.innerHTML = `
            <h3>${getCurrentLanguage() === 'ar' ? item.nameArabic : item.name}</h3>
            <p>${item.description || ''}</p>
            <div class="menu-item-price">${item.price} EGP</div>
            <button class="add-to-cart" onclick="addToCart('${item.id}')">
                ${window.LanguageManager.translate('add_to_cart')}
            </button>
        `;
        menuGrid.appendChild(itemElement);
    });
}

// Filter menu items
function filterMenuItems(category) {
    if (category === 'all') {
        displayMenuItems(menuItems);
    } else {
        const filteredItems = menuItems.filter(item => item.category === category);
        displayMenuItems(filteredItems);
    }
}

// Add item to cart
function addToCart(itemId) {
    const item = menuItems.find(i => i.id === itemId);
    if (!item) return;
    
    const existingItem = cart.find(i => i.id === itemId);
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({
            ...item,
            quantity: 1
        });
    }
    
    updateCartDisplay();
    showToast('Item added to cart', 'success');
}

// Remove item from cart
function removeFromCart(itemId) {
    cart = cart.filter(item => item.id !== itemId);
    updateCartDisplay();
    showToast('Item removed from cart', 'success');
}

// Update item quantity
function updateQuantity(itemId, change) {
    const item = cart.find(i => i.id === itemId);
    if (item) {
        item.quantity += change;
        if (item.quantity <= 0) {
            removeFromCart(itemId);
        } else {
            updateCartDisplay();
        }
    }
}

// Update cart display
function updateCartDisplay() {
    const cartItems = document.getElementById('cartItems');
    const cartTotal = document.getElementById('cartTotal');
    
    if (!cartItems || !cartTotal) return;
    
    if (cart.length === 0) {
        cartItems.innerHTML = '<p class="empty-cart" data-translate="empty_cart">Your cart is empty</p>';
        cartTotal.textContent = '0 EGP';
        return;
    }
    
    let total = 0;
    cartItems.innerHTML = '';
    
    cart.forEach(item => {
        const itemElement = document.createElement('div');
        itemElement.className = 'cart-item';
        itemElement.innerHTML = `
            <div class="cart-item-info">
                <div class="cart-item-name">${getCurrentLanguage() === 'ar' ? item.nameArabic : item.name}</div>
                <div class="cart-item-price">${item.price} EGP</div>
            </div>
            <div class="cart-item-controls">
                <button class="quantity-btn" onclick="updateQuantity('${item.id}', -1)">-</button>
                <span class="quantity">${item.quantity}</span>
                <button class="quantity-btn" onclick="updateQuantity('${item.id}', 1)">+</button>
                <button class="quantity-btn" onclick="removeFromCart('${item.id}')" style="margin-left: 10px;">×</button>
            </div>
        `;
        cartItems.appendChild(itemElement);
        total += item.price * item.quantity;
    });
    
    cartTotal.textContent = `${total} EGP`;
}

// Handle order submission
async function handleOrderSubmit() {
    const customerName = document.getElementById('orderCustomerName').value;
    const customerPhone = document.getElementById('orderCustomerPhone').value;
    const roomNumber = document.getElementById('orderRoomNumber').value;
    
    if (!customerName || !customerPhone) {
        showToast('Please fill in your name and phone number', 'error');
        return;
    }
    
    if (cart.length === 0) {
        showToast('Your cart is empty', 'error');
        return;
    }
    
    try {
        showLoading(true);
        
        const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        
        const order = {
            customerName,
            customerPhone,
            roomNumber: roomNumber || 'Not specified',
            items: cart.map(item => ({
                id: item.id,
                name: item.name,
                nameArabic: item.nameArabic,
                price: item.price,
                quantity: item.quantity
            })),
            total,
            status: 'pending',
            createdAt: window.firebaseExports.serverTimestamp()
        };
        
        await window.FirebaseHelper.addDocument('orders', order);
        
        showToast('Order placed successfully!', 'success');
        
        // Reset form and cart
        cart = [];
        document.getElementById('orderCustomerName').value = '';
        document.getElementById('orderCustomerPhone').value = '';
        document.getElementById('orderRoomNumber').value = '';
        updateCartDisplay();
        
    } catch (error) {
        console.error('Error placing order:', error);
        showToast('Error placing order. Please try again.', 'error');
    } finally {
        showLoading(false);
    }
}

// Load devices
async function loadDevices() {
    try {
        devices = await window.FirebaseHelper.getDocuments('devices');
    } catch (error) {
        console.error('Error loading devices:', error);
    }
}

// Load availability
async function loadAvailability() {
    try {
        const devices = await window.FirebaseHelper.getDocuments('devices');
        const availabilityGrid = document.getElementById('availabilityGrid');
        
        if (!availabilityGrid) return;
        
        availabilityGrid.innerHTML = '';
        
        devices.forEach(device => {
            const deviceElement = document.createElement('div');
            deviceElement.className = `availability-item ${device.available ? 'available' : 'maintenance'}`;
            deviceElement.innerHTML = `
                <h3>${device.name}</h3>
                <div class="availability-status">
                    ${device.available ? 
                        window.LanguageManager.translate('available_now') : 
                        window.LanguageManager.translate('maintenance')
                    }
                </div>
                <p>Rate: ${device.rate} EGP/hour</p>
            `;
            availabilityGrid.appendChild(deviceElement);
        });
        
    } catch (error) {
        console.error('Error loading availability:', error);
    }
}

// Initialize date range for analytics
function initializeDateRange() {
    const today = new Date();
    const startDate = new Date(today.getFullYear(), today.getMonth(), 1);
    const endDate = today;
    
    const startDateInput = document.getElementById('analyticsStartDate');
    const endDateInput = document.getElementById('analyticsEndDate');
    
    if (startDateInput) {
        startDateInput.value = startDate.toISOString().split('T')[0];
    }
    if (endDateInput) {
        endDateInput.value = endDate.toISOString().split('T')[0];
    }
}

// Utility functions
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

function toggleMobileMenu() {
    const navMenu = document.querySelector('.nav-menu');
    const mobileToggle = document.querySelector('.mobile-menu-toggle');
    
    if (navMenu) {
        navMenu.classList.toggle('mobile-active');
        
        // Change hamburger icon
        const icon = mobileToggle.querySelector('i');
        if (navMenu.classList.contains('mobile-active')) {
            icon.classList.remove('fa-bars');
            icon.classList.add('fa-times');
        } else {
            icon.classList.remove('fa-times');
            icon.classList.add('fa-bars');
        }
    }
}

// Update pricing display based on room type and duration
function updatePricing() {
    const roomType = document.getElementById('roomType');
    const duration = document.getElementById('duration');
    const pricingDisplay = document.getElementById('pricingDisplay');
    const roomRate = document.getElementById('roomRate');
    const durationSelected = document.getElementById('durationSelected');
    const totalPrice = document.getElementById('totalPrice');
    
    if (!roomType || !duration || !pricingDisplay) return;
    
    const selectedRoom = roomType.value;
    const selectedDuration = parseInt(duration.value) || 0;
    
    // Room rates per hour
    const rates = {
        'gaming': 50,
        'racing': 75,
        'billiard': 30
    };
    
    if (selectedRoom && selectedDuration > 0) {
        const hourlyRate = rates[selectedRoom] || 0;
        const total = hourlyRate * selectedDuration;
        
        roomRate.textContent = `${hourlyRate} EGP/hour`;
        durationSelected.textContent = `${selectedDuration} hours`;
        totalPrice.textContent = `${total} EGP`;
        
        pricingDisplay.style.display = 'block';
    } else {
        pricingDisplay.style.display = 'none';
    }
}

// Export functions for HTML onclick handlers
window.addToCart = addToCart;
window.removeFromCart = removeFromCart;
window.updateQuantity = updateQuantity;
window.navigateToPage = navigateToPage;
window.handleAdminLogin = handleAdminLogin;

// Clean up subscriptions on page unload
window.addEventListener('beforeunload', () => {
    unsubscribeCallbacks.forEach(unsubscribe => {
        if (typeof unsubscribe === 'function') {
            unsubscribe();
        }
    });
});
