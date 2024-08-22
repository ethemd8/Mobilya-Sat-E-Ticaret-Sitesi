document.addEventListener('DOMContentLoaded', function() {
    const cartButtons = document.querySelectorAll('.add-to-cart');
    const cartItemsContainer = document.querySelector('#cartItemsContainer');
    const cartTotalElement = document.querySelector('#cartTotal');
    const orderTotalElement = document.querySelector('#orderTotal');
    const shippingCostElement = document.querySelector('#shipping');
    const paymentForm = document.querySelector('#paymentForm');

    loadCartFromLocalStorage();

    cartButtons.forEach(button => {
        button.addEventListener('click', function(event) {
            event.preventDefault();
            const productId = button.getAttribute('data-id');
            const productName = button.getAttribute('data-name');
            const productPrice = parseFloat(button.getAttribute('data-price'));
            const productImage = button.getAttribute('data-image');

            addItemToCart(productId, productName, productPrice, productImage);
        });
    });

    paymentForm.addEventListener('submit', function() {
        addHiddenInputsToForm();
    });

    function addItemToCart(id, name, price, image, quantity = 1) {
        const existingItem = cartItemsContainer.querySelector(`[data-id='${id}']`);
        if (existingItem) {
            const quantityElement = existingItem.querySelector('.product-quantity input');
            quantityElement.value = parseInt(quantityElement.value) + quantity;
            updateSubtotal(existingItem, price);
        } else {
            const cartItem = document.createElement('tr');
            cartItem.innerHTML = `
                <td class="product-thumbnail"><a href="#"><img src="${image}" alt="${name}" /></a></td>
                <td class="product-name"><a href="#">${name}</a></td>
                <td class="product-price"><span class="amount">${price.toFixed(2)}</span></td>
                <td class="product-quantity"><input type="number" value="${quantity}" min="1" /></td>
                <td class="product-subtotal">₺${price.toFixed(2)}</td>
                <td class="product-remove"><a href="#"><i class="icon-trash icons"></i></a></td>
            `;
            cartItem.setAttribute('data-id', id);

            cartItemsContainer.appendChild(cartItem);

            cartItem.querySelector('.product-quantity input').addEventListener('change', function() {
                updateSubtotal(cartItem, price);
                updateTotalPrice();
                updateCartItemCount();
                saveCartToLocalStorage();
            });

            cartItem.querySelector('.product-remove').addEventListener('click', function(event) {
                event.preventDefault();
                cartItem.remove();
                updateTotalPrice();
                updateCartItemCount();
                saveCartToLocalStorage();
            });
        }

        updateTotalPrice();
        updateCartItemCount();
        saveCartToLocalStorage();
    }

    function addHiddenInputsToForm() {
        const cartItems = [];
        cartItemsContainer.querySelectorAll('tr').forEach(item => {
            const id = item.getAttribute('data-id');
            const quantity = item.querySelector('.product-quantity input').value;
            const hiddenInput = document.createElement('input');
            hiddenInput.type = 'hidden';
            hiddenInput.name = `items[${id}]`;
            hiddenInput.value = quantity;
            paymentForm.appendChild(hiddenInput);
        });

        const cartTotal = cartTotalElement.textContent.replace('₺', '');
        const shipping = shippingCostElement.textContent.replace('₺', '');
        const orderTotal = orderTotalElement.textContent.replace('₺', '');

        const hiddenCartTotal = document.createElement('input');
        hiddenCartTotal.type = 'hidden';
        hiddenCartTotal.name = 'cartTotal';
        hiddenCartTotal.value = cartTotal;
        paymentForm.appendChild(hiddenCartTotal);

        const hiddenShipping = document.createElement('input');
        hiddenShipping.type = 'hidden';
        hiddenShipping.name = 'shipping';
        hiddenShipping.value = shipping;
        paymentForm.appendChild(hiddenShipping);

        const hiddenOrderTotal = document.createElement('input');
        hiddenOrderTotal.type = 'hidden';
        hiddenOrderTotal.name = 'orderTotal';
        hiddenOrderTotal.value = orderTotal;
        paymentForm.appendChild(hiddenOrderTotal);
    }

    function updateSubtotal(cartItem, price) {
        const quantity = parseInt(cartItem.querySelector('.product-quantity input').value);
        const subtotal = price * quantity;
        cartItem.querySelector('.product-subtotal').textContent = `₺${subtotal.toFixed(2)}`;
    }

    function updateTotalPrice() {
        const items = document.querySelectorAll('#cartItemsContainer tr');
        let total = 0;
        items.forEach(item => {
            const price = parseFloat(item.querySelector('.product-price .amount').textContent);
            const quantity = parseInt(item.querySelector('.product-quantity input').value);
            const subtotal = price * quantity;
            total += subtotal;
            item.querySelector('.product-subtotal').textContent = `₺${subtotal.toFixed(2)}`;
        });
        cartTotalElement.textContent = `₺${total.toFixed(2)}`;
        updateOrderTotal(total);
    }

    function updateOrderTotal(cartTotal) {
        const shippingCost = parseFloat(shippingCostElement.textContent.replace('₺', ''));
        const orderTotal = cartTotal + shippingCost;
        orderTotalElement.textContent = `₺${orderTotal.toFixed(2)}`;
    }

    function updateCartItemCount() {
        let totalItems = 0;
        document.querySelectorAll('#cartItemsContainer tr').forEach(item => {
            totalItems += parseInt(item.querySelector('.product-quantity input').value);
        });
    }

    function saveCartToLocalStorage() {
        const cartItems = [];
        document.querySelectorAll('#cartItemsContainer tr').forEach(item => {
            const id = item.getAttribute('data-id');
            const name = item.querySelector('.product-name a').textContent;
            const price = item.querySelector('.product-price .amount').textContent;
            const quantity = item.querySelector('.product-quantity input').value;
            const image = item.querySelector('.product-thumbnail img').src;
            cartItems.push({ id, name, price, quantity, image });
        });
        localStorage.setItem('cartItems', JSON.stringify(cartItems));
    }

    function loadCartFromLocalStorage() {
        const cartItems = JSON.parse(localStorage.getItem('cartItems')) || [];
        cartItems.forEach(item => {
            addItemToCart(item.id, item.name, parseFloat(item.price), item.image, parseInt(item.quantity));
        });
        updateTotalPrice();
        updateCartItemCount();
    }
});
