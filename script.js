document.addEventListener('DOMContentLoaded', () => {
    // --- 1. Variables Globales (Constantes del DOM) ---
    const productGrid = document.getElementById('productos');
    const cartButton = document.getElementById('cart-button'); // Botón/Link en el NAV
    const cartSidebar = document.getElementById('cart-sidebar');
    const closeCartButton = document.getElementById('close-cart'); 
    const cartItemsContainer = document.getElementById('cart-items');
    const cartTotalElement = document.getElementById('cart-total');
    const checkoutContainer = document.getElementById('checkout-container');
    const checkoutButton = document.getElementById('checkout-button');
    const notificationToast = document.getElementById('notification-toast'); // <-- ¡NUEVO!

    // Carrito (inicialmente vacío o cargado desde localStorage)
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    
    // --- 2. Lógica de Animación (Scroll Reveal) ---

    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.15
    };

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    // --- 3. Inicialización de Observador y Carga de Productos ---

    function observeScrollRevealElements() {
        const elementsToAnimate = document.querySelectorAll('.scroll-reveal');
        elementsToAnimate.forEach(element => {
            observer.observe(element);
        });
    }

    updateCartCounter();
    fetchProducts();
    
    // --- 4. Carga de Productos ---
    async function fetchProducts() {
        try {
            const response = await fetch('https://fakestoreapi.com/products?limit=6'); 
            const products = await response.json();
            
            renderProducts(products);
            observeScrollRevealElements(); 
        } catch (error) {
            console.error('Error al obtener los productos:', error);
            if (productGrid) {
                productGrid.innerHTML = '<p>Lo sentimos, no pudimos cargar los productos.</p>';
            }
        }
    }

    function renderProducts(products) {
        if (!productGrid) return;
        productGrid.innerHTML = '';
        
        products.forEach(product => {
            const card = document.createElement('article');
            card.classList.add('product-card', 'scroll-reveal');

            card.innerHTML = `
                <img src="${product.image}" alt="${product.title}" style="max-height: 150px; width: auto;">
                <h3>${product.title}</h3>
                <p class="price">$${product.price.toFixed(2)}</p>
                <button class="add-to-cart" data-id="${product.id}" data-name="${product.title}" data-price="${product.price}">
                    Añadir al Carrito
                </button>
            `;
            
            productGrid.appendChild(card);
        });
        
        document.querySelectorAll('.add-to-cart').forEach(button => {
            button.addEventListener('click', handleAddToCart);
        });
    }

    // --- 5. Lógica del Carrito (Apertura/Cierre/Persistencia) ---

    function showCart() {
        if (cartSidebar) {
            renderCart(); 
            cartSidebar.classList.remove('hidden');
            cartSidebar.classList.add('visible');
        }
    }

    function hideCart() {
        if (cartSidebar) {
            cartSidebar.classList.remove('visible');
            cartSidebar.classList.add('hidden');
        }
    }

    function saveCart() {
        localStorage.setItem('cart', JSON.stringify(cart));
        updateCartCounter(); 
    }

    // --- 6. Funciones de Compra y UI ---
    
    function showNotification(message) { // <-- FUNCIÓN DE NOTIFICACIÓN
        if (notificationToast) {
            notificationToast.textContent = message;
            notificationToast.classList.remove('hidden');
            
            // Ocultar automáticamente después de 3 segundos
            setTimeout(() => {
                notificationToast.classList.add('hidden');
            }, 3000); 
        }
    }

    function handleAddToCart(event) {
        const { id, name, price } = event.target.dataset;
        const productId = Number(id);
        const productPrice = Number(price);

        const existingItem = cart.find(item => item.id === productId);

        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            cart.push({ id: productId, name: name, price: productPrice, quantity: 1 });
        }

        saveCart(); 
        // Ya no abrimos el carrito automáticamente
        showNotification(`✅ "${name}" añadido al carrito.`); // <-- USO DE NOTIFICACIÓN
    }
    
    function updateCartCounter() {
        const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
        if (cartButton) {
            cartButton.textContent = `Carrito (${totalItems})`;
        }
    }
    
    function updateCartTotal() {
        const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        if (cartTotalElement) {
            cartTotalElement.textContent = `$${total.toFixed(2)}`;
        }
    }
    
    function handleCheckout() {
        alert('¡Procesando pago! (Esta función aún está en desarrollo)');
        // Implementación de lógica de checkout
    }

    // --- 7. Renderizado y Manejo de Items en el Sidebar ---
    
    function renderCart() {
        if (!cartItemsContainer || !cartTotalElement) {
            return;
        }

        // 🛑 FILTRADO DE SEGURIDAD CONTRA ITEMS CORRUPTOS (Corrección de error de price)
        cart = cart.filter(item => item && typeof item.price === 'number' && !isNaN(item.price));

        cartItemsContainer.innerHTML = '';
        
        if (cart.length === 0) {
            cartItemsContainer.innerHTML = '<p id="empty-cart-message" style="text-align: center;">Tu carrito está vacío.</p>';
            updateCartTotal(); 
            if (checkoutContainer) checkoutContainer.classList.add('hidden'); 
            return;
        }
        
        if (checkoutContainer) checkoutContainer.classList.remove('hidden');

        cart.forEach(item => {
            const itemElement = document.createElement('li');
            itemElement.classList.add('cart-item');
            
            // CORRECCIÓN: Garantizamos que itemPrice es un número
            const itemPrice = Number(item.price); 
            const itemQuantity = Number(item.quantity);
            const itemSubtotal = itemPrice * itemQuantity; 
            
            itemElement.innerHTML = `
                <div class="item-details">
                    <p><strong>${item.name}</strong></p>
                    <p>$${itemPrice.toFixed(2)} x ${item.quantity} = $${itemSubtotal.toFixed(2)}</p>
                </div>
                
                <div class="item-quantity">
                    <button class="update-quantity" data-id="${item.id}" data-action="decrease">-</button>
                    <input type="number" value="${item.quantity}" min="1" data-id="${item.id}" class="quantity-input" readonly>
                    <button class="update-quantity" data-id="${item.id}" data-action="increase">+</button>
                </div>
                
                <button class="remove-item" data-id="${item.id}">🗑️</button>
            `;

            cartItemsContainer.appendChild(itemElement);
        });

        attachCartListeners();
        updateCartTotal(); 
    }

    function attachCartListeners() {
        document.querySelectorAll('.update-quantity').forEach(button => {
            button.addEventListener('click', handleUpdateQuantity);
        });

        document.querySelectorAll('.remove-item').forEach(button => {
            button.addEventListener('click', handleRemoveItem);
        });
    }

    function handleUpdateQuantity(event) {
        const productId = Number(event.target.dataset.id);
        const action = event.target.dataset.action;
        
        const item = cart.find(i => i.id === productId);

        if (item) {
            if (action === 'increase') {
                item.quantity += 1;
            } else if (action === 'decrease') {
                item.quantity -= 1;
            }
            
            if (item.quantity <= 0) {
                cart = cart.filter(i => i.id !== productId); 
            }
            
            saveCart();
            renderCart();
        }
    }

    function handleRemoveItem(event) {
        const productId = Number(event.target.dataset.id);
        
        cart = cart.filter(item => item.id !== productId);
        
        saveCart();
        renderCart();
    }

    // --- 8. Listeners de Navegación y Checkout ---
    
    if (cartButton) {
        cartButton.addEventListener('click', showCart);
    }
    if (closeCartButton) {
        closeCartButton.addEventListener('click', hideCart);
    }
    if (checkoutButton) {
        checkoutButton.addEventListener('click', handleCheckout); 
    }

    // --- 9. Lógica del Formulario de Contacto ---
    const form = document.getElementById('contact-form');
    const formStatus = document.getElementById('form-status');

    if (form) {
        form.addEventListener('submit', async function(event) {
            event.preventDefault(); 

            const data = new FormData(event.target);
            
            try {
                const response = await fetch(event.target.action, {
                    method: 'POST',
                    body: data,
                    headers: {
                        'Accept': 'application/json'
                    }
                });

                if (response.ok) {
                    formStatus.textContent = '¡Gracias por tu mensaje! Nos pondremos en contacto pronto.';
                    formStatus.style.color = 'green';
                    form.reset();
                } else {
                    formStatus.textContent = 'Hubo un error al enviar el formulario. Por favor, inténtalo de nuevo.';
                    formStatus.style.color = 'red';
                }
            } catch (error) {
                console.error('Error de red:', error);
                formStatus.textContent = 'Error de conexión. Verifica tu red.';
                formStatus.style.color = 'red';
            }
        });
    }
});