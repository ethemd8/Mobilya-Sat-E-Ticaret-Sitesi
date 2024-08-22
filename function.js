document.addEventListener('DOMContentLoaded', function() {
    const cartButtons = document.querySelectorAll('.add-to-cart');
    const cartItemsContainer = document.getElementById('shoppingCartItems');
    const cartItemCount = document.getElementById('cartItemCount');

    // Load cart from localStorage on page load
    loadCartFromLocalStorage();

    cartButtons.forEach(button => {
        button.addEventListener('click', function(event) {
            event.preventDefault();
            const productId = button.getAttribute('data-id');
            const productName = button.getAttribute('data-name');
            const productPrice = parseFloat(button.getAttribute('data-price'));
            const productImage = button.getAttribute('data-image'); // Add image URL

            addItemToCart(productId, productName, productPrice, productImage);
        });
    });

    function addItemToCart(id, name, price, image, quantity = 1) {
        const existingItem = cartItemsContainer.querySelector(`[data-id='${id}']`);
        if (existingItem) {
            const quantityElement = existingItem.querySelector('.quantity');
            quantityElement.textContent = parseInt(quantityElement.textContent) + quantity;
        } else {
            const cartItem = document.createElement('div');
            cartItem.classList.add('shp__single__product');
            cartItem.setAttribute('data-id', id);
            cartItem.innerHTML = `
                <div class="shp__pro__thumb">
                    <a href="${image}">
                        <img src="${image}" alt="${name}">
                    </a>
                </div>
                <div class="shp__pro__details">
                    <h2><a href="product-details.html">${name}</a></h2>
                    <span class="quantity">${quantity}</span>
                    <span class="shp__price">₺${price.toFixed(2)}</span>
                    <button class="increase-quantity">+</button>
                    <button class="decrease-quantity">—</button>
                </div>
                <div class="remove__btn">
                    <a href="#" title="Remove this item" class="remove-from-cart"><i class="zmdi zmdi-close"></i></a>
                </div>
            `;

            cartItemsContainer.appendChild(cartItem);

            cartItem.querySelector('.remove-from-cart').addEventListener('click', function(event) {
                event.preventDefault();
                cartItem.remove();
                updateTotalPrice();
                updateCartItemCount();
                saveCartToLocalStorage();
            });

            cartItem.querySelector('.increase-quantity').addEventListener('click', function() {
                const quantityElement = cartItem.querySelector('.quantity');
                quantityElement.textContent = parseInt(quantityElement.textContent) + 1;
                updateTotalPrice();
                updateCartItemCount();
                saveCartToLocalStorage();
            });

            cartItem.querySelector('.decrease-quantity').addEventListener('click', function() {
                const quantityElement = cartItem.querySelector('.quantity');
                if (parseInt(quantityElement.textContent) > 1) {
                    quantityElement.textContent = parseInt(quantityElement.textContent) - 1;
                } else {
                    cartItem.remove();
                }
                updateTotalPrice();
                updateCartItemCount();
                saveCartToLocalStorage();
            });
        }

        updateTotalPrice();
        updateCartItemCount();
        saveCartToLocalStorage();
    }

    function updateTotalPrice() {
        const items = document.querySelectorAll('.shp__single__product');
        let total = 0;
        items.forEach(item => {
            const price = parseFloat(item.querySelector('.shp__price').textContent.replace('₺', ''));
            const quantity = parseInt(item.querySelector('.quantity').textContent);
            total += price * quantity;
        });
        document.querySelector('.total__price').textContent = `₺${total.toFixed(2)}`;
    }

    function updateCartItemCount() {
        let totalItems = 0;
        document.querySelectorAll('.shp__single__product .quantity').forEach(quantityElement => {
            totalItems += parseInt(quantityElement.textContent);
        });
        cartItemCount.textContent = totalItems;
    }

    function saveCartToLocalStorage() {
        const cartItems = [];
        document.querySelectorAll('.shp__single__product').forEach(item => {
            const id = item.getAttribute('data-id');
            const name = item.querySelector('.shp__pro__details h2 a').textContent;
            const price = item.querySelector('.shp__price').textContent.replace('₺', '');
            const quantity = item.querySelector('.quantity').textContent;
            const image = item.querySelector('.shp__pro__thumb img').src; // Save image URL
            cartItems.push({ id, name, price, quantity, image });
        });
        localStorage.setItem('cartItems', JSON.stringify(cartItems));
    }

    function loadCartFromLocalStorage() {
        const cartItems = JSON.parse(localStorage.getItem('cartItems')) || [];
        cartItemsContainer.innerHTML = ''; // Clear the cart container
        cartItems.forEach(item => {
            addItemToCart(item.id, item.name, parseFloat(item.price), item.image, parseInt(item.quantity));
        });
        updateTotalPrice();
        updateCartItemCount();
    }
});
