
// Cart and Razorpay Integration
document.addEventListener('DOMContentLoaded', function() {
    // Cart elements
    const cartIcon = document.querySelector('.cart-icon');
    const cartSidebar = document.querySelector('.cart-sidebar');
    const closeCart = document.querySelector('.close-cart');
    const overlay = document.querySelector('.overlay');
    const cartItemsContainer = document.querySelector('.cart-items');
    const cartCount = document.querySelector('.cart-count');
    const subtotalElement = document.querySelector('.subtotal');
    const totalPriceElement = document.querySelector('.total-price');
    const checkoutBtn = document.querySelector('.checkout-btn');
    
    let cart = JSON.parse(localStorage.getItem('mehfilCart')) || [];
    const deliveryCharge = 60;
    
    // Razorpay Configuration - REPLACE WITH YOUR ACTUAL KEY
    const RAZORPAY_KEY_ID = "rzp_test_RfZ1jAbitb8pTi"; // Get this from Razorpay dashboard

    // Initialize cart
    updateCart();

    // Cart toggle functionality
    cartIcon.addEventListener('click', function() {
        cartSidebar.classList.add('active');
        overlay.classList.add('active');
    });

    closeCart.addEventListener('click', function() {
        cartSidebar.classList.remove('active');
        overlay.classList.remove('active');
    });

    overlay.addEventListener('click', function() {
        cartSidebar.classList.remove('active');
        overlay.classList.remove('active');
    });

    // Add to cart functionality
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('add-to-cart')) {
            const productId = e.target.getAttribute('data-id');
            const productName = e.target.getAttribute('data-name');
            const productPrice = parseInt(e.target.getAttribute('data-price'));
            const productImage = e.target.getAttribute('data-image');
            
            addToCart(productId, productName, productPrice, productImage);
            
            // Visual feedback
            const originalText = e.target.textContent;
            e.target.textContent = 'Added to Cart!';
            e.target.style.background = '#4caf50';
            
            setTimeout(() => {
                e.target.textContent = originalText;
                e.target.style.background = '#ff6b6b';
            }, 1500);
        }
    });

    // Checkout with Razorpay
    checkoutBtn.addEventListener('click', function() {
        if (cart.length === 0) {
            showNotification('Your cart is empty! Add some products first.', 'error');
            return;
        }
        
        // Show payment methods info before opening Razorpay
        const paymentInfo = showPaymentMethods();
        
        // Create a confirmation modal
        const confirmModal = document.createElement('div');
        confirmModal.className = 'confirm-modal active';
        confirmModal.innerHTML = `
            <div class="confirm-content">
                <h3>Proceed to Payment</h3>
                ${paymentInfo}
                <div class="confirm-buttons">
                    <button class="confirm-btn proceed-btn">Proceed to Pay ₹${calculateTotalAmount()}</button>
                    <button class="confirm-btn cancel-btn">Cancel</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(confirmModal);
        
        // Event listeners for modal buttons
        confirmModal.querySelector('.proceed-btn').addEventListener('click', function() {
            confirmModal.remove();
            processRazorpayPayment();
        });
        
        confirmModal.querySelector('.cancel-btn').addEventListener('click', function() {
            confirmModal.remove();
        });
        
        // Close modal when clicking outside
        confirmModal.addEventListener('click', function(e) {
            if (e.target === confirmModal) {
                confirmModal.remove();
            }
        });
    });

    function addToCart(id, name, price, image) {
        // Check if item already exists in cart
        const existingItemIndex = cart.findIndex(item => item.id === id);
        
        if (existingItemIndex > -1) {
            // Update quantity if item exists
            cart[existingItemIndex].quantity += 1;
        } else {
            // Add new item to cart
            cart.push({
                id,
                name,
                price,
                image,
                quantity: 1
            });
        }
        
        // Save to localStorage
        localStorage.setItem('mehfilCart', JSON.stringify(cart));
        
        updateCart();
        
        // Show cart sidebar when adding an item
        cartSidebar.classList.add('active');
        overlay.classList.add('active');
        
        showNotification(`${name} added to cart! ✨`);
    }

    function updateCart() {
        cartItemsContainer.innerHTML = '';
        let total = 0;
        let count = 0;
        
        if (cart.length === 0) {
            cartItemsContainer.innerHTML = `
                <div class="empty-cart">
                    <i class="fas fa-shopping-cart"></i>
                    <p>Your cart is empty</p>
                    <p style="font-size: 0.9rem; margin-top: 0.5rem;">Add some beautiful accessories! 💖</p>
                </div>
            `;
            checkoutBtn.disabled = true;
        } else {
            cart.forEach(item => {
                const itemTotal = item.price * item.quantity;
                total += itemTotal;
                count += item.quantity;
                
                const cartItem = document.createElement('div');
                cartItem.className = 'cart-item';
                cartItem.innerHTML = `
                    <img src="${item.image}" alt="${item.name}" style="width: 60px; height: 60px; object-fit: cover; border-radius: 8px;" onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjYwIiBoZWlnaHQ9IjYwIiBmaWxsPSIjZmY2YjhiIi8+Cjx0ZXh0IHg9IjMwIiB5PSIzMCIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjEwIiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkltYWdlPC90ZXh0Pgo8L3N2Zz4K'">
                    <div class="cart-item-details">
                        <div class="cart-item-name">${item.name}</div>
                        <div class="cart-item-price">₹${item.price}</div>
                        <div class="cart-item-quantity">
                            <button class="quantity-btn minus" data-id="${item.id}">-</button>
                            <span class="quantity">${item.quantity}</span>
                            <button class="quantity-btn plus" data-id="${item.id}">+</button>
                        </div>
                    </div>
                    <button class="remove-item" data-id="${item.id}"><i class="fas fa-trash"></i></button>
                `;
                
                cartItemsContainer.appendChild(cartItem);
            });
            checkoutBtn.disabled = false;
        }
        
        // Update cart totals
        subtotalElement.textContent = total;
        totalPriceElement.textContent = total + deliveryCharge;
        cartCount.textContent = count;
        
        // Add event listeners to quantity buttons
        document.querySelectorAll('.minus').forEach(btn => {
            btn.addEventListener('click', function() {
                const id = this.getAttribute('data-id');
                decreaseQuantity(id);
            });
        });
        
        document.querySelectorAll('.plus').forEach(btn => {
            btn.addEventListener('click', function() {
                const id = this.getAttribute('data-id');
                increaseQuantity(id);
            });
        });
        
        document.querySelectorAll('.remove-item').forEach(btn => {
            btn.addEventListener('click', function() {
                const id = this.getAttribute('data-id');
                removeFromCart(id);
            });
        });
    }

    function increaseQuantity(id) {
        const item = cart.find(item => item.id === id);
        if (item) {
            item.quantity += 1;
            localStorage.setItem('mehfilCart', JSON.stringify(cart));
            updateCart();
            showNotification(`Increased quantity of ${item.name}`);
        }
    }

    function decreaseQuantity(id) {
        const item = cart.find(item => item.id === id);
        if (item) {
            if (item.quantity > 1) {
                item.quantity -= 1;
                localStorage.setItem('mehfilCart', JSON.stringify(cart));
                updateCart();
                showNotification(`Decreased quantity of ${item.name}`);
            } else {
                removeFromCart(id);
            }
        }
    }

    function removeFromCart(id) {
        const item = cart.find(item => item.id === id);
        cart = cart.filter(item => item.id !== id);
        localStorage.setItem('mehfilCart', JSON.stringify(cart));
        updateCart();
        if (item) {
            showNotification(`${item.name} removed from cart`);
        }
    }

    // Razorpay Payment Processing
    function processRazorpayPayment() {
        const totalAmount = calculateTotalAmount();
        
        // Validate Razorpay key
        if (!RAZORPAY_KEY_ID || RAZORPAY_KEY_ID === "rzp_test_YOUR_ACTUAL_KEY_HERE") {
            showNotification('Payment system not configured. Please contact support.', 'error');
            return;
        }

        const options = {
            key: RAZORPAY_KEY_ID,
            amount: totalAmount * 100, // Amount in paise
            currency: "INR",
            name: "Mehfil Accessories",
            description: "Purchase from Mehfil Accessories",
            handler: function(response) {
                handlePaymentSuccess(response);
            },
            prefill: {
                name: "Customer Name",
                email: "customer@example.com",
                contact: "9999999999"
            },
            notes: {
                order_type: "Mehfil Accessories Purchase",
                items_count: cart.length.toString()
            },
            theme: {
                color: "#ff6b6b"
            },
            // Enable all payment methods
            method: {
                netbanking: true,
                card: true,
                upi: true,
                wallet: true,
                paylater: true
            },
            // Additional configuration for better card handling
            modal: {
                ondismiss: function() {
                    showNotification('Payment cancelled. You can try again.', 'error');
                }
            }
        };
        
        try {
            const rzp = new Razorpay(options);
            rzp.open();
            
            rzp.on('payment.failed', function(response) {
                console.error("Payment failed:", response);
                
                let errorMessage = 'Payment failed. ';
                
                if (response.error && response.error.description) {
                    errorMessage += response.error.description;
                    
                    // Specific handling for card errors
                    if (response.error.description.includes('international') || 
                        response.error.description.includes('card not supported')) {
                        errorMessage += ' Please use UPI, Net Banking, or an Indian debit/credit card.';
                    } else if (response.error.description.includes('declined')) {
                        errorMessage += ' Your card was declined. Please try another payment method.';
                    }
                } else {
                    errorMessage += 'Please try another payment method like UPI or Net Banking.';
                }
                
                showNotification(errorMessage, 'error');
            });

        } catch (error) {
            console.error("Razorpay error:", error);
            showNotification('Error initializing payment. Please try again.', 'error');
        }
    }

    function calculateTotalAmount() {
        const subtotal = cart.reduce((total, item) => total + (item.price * item.quantity), 0);
        return subtotal + deliveryCharge;
    }

    function handlePaymentSuccess(response) {
        console.log("Payment successful:", response);
        
        // Create order summary
        const orderSummary = {
            paymentId: response.razorpay_payment_id,
            orderId: response.razorpay_order_id,
            signature: response.razorpay_signature,
            amount: calculateTotalAmount(),
            items: [...cart],
            timestamp: new Date().toISOString()
        };
        
        // Save order to localStorage
        const orders = JSON.parse(localStorage.getItem('mehfilOrders')) || [];
        orders.push(orderSummary);
        localStorage.setItem('mehfilOrders', JSON.stringify(orders));
        
        // Show success message
        showNotification('Payment successful! Thank you for your order. 🎉', 'success');
        
        // Clear cart
        cart = [];
        localStorage.removeItem('mehfilCart');
        updateCart();
        
        // Close cart sidebar
        cartSidebar.classList.remove('active');
        overlay.classList.remove('active');
    }

    // Payment Methods Helper - Show available options
    function showPaymentMethods() {
        const paymentMethodsHTML = `
            <div class="payment-methods-info">
                <h3>💳 Available Payment Methods</h3>
                <div class="payment-options">
                    <div class="payment-option">
                        <i class="fas fa-mobile-alt"></i>
                        <span>UPI (Recommended)</span>
                    </div>
                    <div class="payment-option">
                        <i class="fas fa-university"></i>
                        <span>Net Banking</span>
                    </div>
                    <div class="payment-option">
                        <i class="fas fa-credit-card"></i>
                        <span>Indian Debit/Credit Cards</span>
                    </div>
                    <div class="payment-option">
                        <i class="fas fa-wallet"></i>
                        <span>Wallets (Paytm, PhonePe, etc.)</span>
                    </div>
                </div>
                <p class="payment-note">💡 For best results, use UPI payment method</p>
            </div>
        `;
        
        return paymentMethodsHTML;
    }

    // Notification system
    function showNotification(message, type = 'success') {
        // Remove existing notification
        const existingNotification = document.querySelector('.notification');
        if (existingNotification) {
            existingNotification.remove();
        }
        
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas ${type === 'error' ? 'fa-exclamation-circle' : 'fa-check-circle'}"></i>
                <span>${message}</span>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // Animate in
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);
        
        // Remove after 4 seconds
        setTimeout(() => {
            notification.style.transform = 'translateX(400px)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 4000);
    }

    // Modern Carousel Functionality
    const carousels = document.querySelectorAll('.carousel-container');
    
    carousels.forEach(carousel => {
        const track = carousel.querySelector('.carousel-track');
        const slides = Array.from(track.children);
        const prevBtn = carousel.querySelector('.prev-btn');
        const nextBtn = carousel.querySelector('.next-btn');
        const indicators = carousel.parentElement.querySelector('.carousel-indicators');
        
        let currentIndex = 0;
        const slideCount = slides.length;
        
        // Only add controls if there's more than one image
        if (slideCount <= 1) {
            carousel.classList.add('single-image');
            return;
        }
        
        function updateSlidePosition() {
            track.style.transform = `translateX(-${currentIndex * 100}%)`;
            
            if (indicators) {
                const indicatorDots = indicators.querySelectorAll('.indicator');
                indicatorDots.forEach((indicator, index) => {
                    indicator.classList.toggle('active', index === currentIndex);
                });
            }
        }
        
        function nextSlide() {
            currentIndex = (currentIndex + 1) % slideCount;
            updateSlidePosition();
        }
        
        function prevSlide() {
            currentIndex = (currentIndex - 1 + slideCount) % slideCount;
            updateSlidePosition();
        }
        
        if (prevBtn) prevBtn.addEventListener('click', prevSlide);
        if (nextBtn) nextBtn.addEventListener('click', nextSlide);
        
        if (indicators) {
            const indicatorDots = indicators.querySelectorAll('.indicator');
            indicatorDots.forEach((indicator, index) => {
                indicator.addEventListener('click', () => {
                    currentIndex = index;
                    updateSlidePosition();
                });
            });
        }
        
        // Swipe functionality
        let startX = 0;
        let endX = 0;
        
        track.addEventListener('touchstart', (e) => {
            startX = e.touches[0].clientX;
        });
        
        track.addEventListener('touchend', (e) => {
            endX = e.changedTouches[0].clientX;
            handleSwipe();
        });
        
        function handleSwipe() {
            const swipeThreshold = 50;
            
            if (startX - endX > swipeThreshold) {
                nextSlide();
            } else if (endX - startX > swipeThreshold) {
                prevSlide();
            }
        }
    });
    
    // Zoom Functionality
    const zoomModal = document.querySelector('.zoom-modal');
    const zoomImage = zoomModal.querySelector('img');
    const closeZoom = zoomModal.querySelector('.close-zoom');
    const zoomInBtn = document.getElementById('zoom-in');
    const zoomOutBtn = document.getElementById('zoom-out');
    const resetZoomBtn = document.getElementById('reset-zoom');
    
    let currentZoom = 1;
    const zoomStep = 0.2;
    const maxZoom = 3;
    const minZoom = 0.5;
    
    document.querySelectorAll('.carousel-slide img').forEach(img => {
        img.addEventListener('click', function() {
            zoomImage.src = this.src;
            zoomImage.alt = this.alt;
            currentZoom = 1;
            zoomImage.style.transform = `scale(${currentZoom})`;
            zoomModal.classList.add('active');
            document.body.style.overflow = 'hidden';
        });
    });
    
    function closeZoomModal() {
        zoomModal.classList.remove('active');
        document.body.style.overflow = '';
    }
    
    closeZoom.addEventListener('click', closeZoomModal);
    
    zoomInBtn.addEventListener('click', () => {
        if (currentZoom < maxZoom) {
            currentZoom += zoomStep;
            zoomImage.style.transform = `scale(${currentZoom})`;
        }
    });
    
    zoomOutBtn.addEventListener('click', () => {
        if (currentZoom > minZoom) {
            currentZoom -= zoomStep;
            zoomImage.style.transform = `scale(${currentZoom})`;
        }
    });
    
    resetZoomBtn.addEventListener('click', () => {
        currentZoom = 1;
        zoomImage.style.transform = `scale(${currentZoom})`;
    });
    
    zoomModal.addEventListener('click', (e) => {
        if (e.target === zoomModal) {
            closeZoomModal();
        }
    });
    
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && zoomModal.classList.contains('active')) {
            closeZoomModal();
        }
    });
});

// Add all necessary CSS styles
const styles = document.createElement('style');
styles.textContent = `
    /* Notification Styles */
    .notification {
        position: fixed;
        top: 20px;
        right: 20px;
        background: white;
        padding: 15px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 15px rgba(0,0,0,0.2);
        z-index: 2000;
        transform: translateX(400px);
        transition: transform 0.3s ease;
        max-width: 300px;
    }
    .notification.success {
        border-left: 4px solid #4caf50;
    }
    .notification.error {
        border-left: 4px solid #f44336;
    }
    .notification-content {
        display: flex;
        align-items: center;
        gap: 10px;
    }
    .notification-content i {
        font-size: 18px;
    }
    .notification.success .notification-content i {
        color: #4caf50;
    }
    .notification.error .notification-content i {
        color: #f44336;
    }

    /* Payment Methods Styles */
    .payment-methods-info {
        background: #f8f9fa;
        padding: 20px;
        border-radius: 10px;
        margin: 15px 0;
        border-left: 4px solid #ff6b6b;
    }
    .payment-methods-info h3 {
        margin: 0 0 15px 0;
        color: #333;
        font-size: 18px;
    }
    .payment-options {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 10px;
        margin-bottom: 15px;
    }
    .payment-option {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 8px;
        background: white;
        border-radius: 6px;
        font-size: 14px;
    }
    .payment-option i {
        color: #ff6b6b;
        width: 16px;
    }
    .payment-note {
        font-size: 14px;
        color: #666;
        margin: 0;
        font-style: italic;
    }

    /* Confirm Modal Styles */
    .confirm-modal {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.5);
        display: none;
        justify-content: center;
        align-items: center;
        z-index: 2000;
    }
    .confirm-modal.active {
        display: flex;
    }
    .confirm-content {
        background: white;
        padding: 25px;
        border-radius: 12px;
        max-width: 500px;
        width: 90%;
        max-height: 80vh;
        overflow-y: auto;
    }
    .confirm-content h3 {
        margin: 0 0 20px 0;
        color: #333;
        text-align: center;
    }
    .confirm-buttons {
        display: flex;
        gap: 10px;
        margin-top: 20px;
    }
    .confirm-btn {
        flex: 1;
        padding: 12px;
        border: none;
        border-radius: 6px;
        font-size: 16px;
        cursor: pointer;
        transition: all 0.3s;
    }
    .proceed-btn {
        background: #ff6b6b;
        color: white;
    }
    .proceed-btn:hover {
        background: #ff5252;
    }
    .cancel-btn {
        background: #f5f5f5;
        color: #333;
    }
    .cancel-btn:hover {
        background: #e0e0e0;
    }

    @media (max-width: 480px) {
        .payment-options {
            grid-template-columns: 1fr;
        }
        .confirm-buttons {
            flex-direction: column;
        }
    }
`;
document.head.appendChild(styles);
