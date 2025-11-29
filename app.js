const API_BASE = 'http://localhost:4000/api';

// Token helpers
function getToken() { return localStorage.getItem('token'); }
function setToken(t) { localStorage.setItem('token', t); }
function isAuthed() { return !!getToken(); }

// Cart helpers (localStorage)
function getCart() { return JSON.parse(localStorage.getItem('cart') || '[]'); }
function setCart(c) { localStorage.setItem('cart', JSON.stringify(c)); }
function addToCart(product, quantity = 1) {
  const cart = getCart();
  const existing = cart.find(i => i.productId === product.id);
  if (existing) existing.quantity += quantity;
  else cart.push({ productId: product.id, name: product.name, price: Number(product.price), quantity });
  setCart(cart);
  alert('Added to cart');
}
function removeFromCart(productId) {
  setCart(getCart().filter(i => i.productId !== productId));
  renderCart();
}

// Update account link
document.addEventListener('DOMContentLoaded', () => {
  const acc = document.getElementById('accountLink');
  if (acc) acc.textContent = isAuthed() ? 'My Orders' : 'Login';
  if (acc && isAuthed()) acc.href = 'cart.html';
});

// Page routing by presence of elements
document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('products')) loadProducts();
  if (document.getElementById('productDetail')) loadProductDetail();
  if (document.getElementById('cartItems')) renderCart();
  if (document.getElementById('checkoutForm')) bindCheckout();
  if (document.getElementById('registerForm')) bindAuthForms();
});

async function loadProducts() {
  const res = await fetch(`${API_BASE}/products`);
  const products = await res.json();
  const grid = document.getElementById('products');
  grid.innerHTML = products.map(p => `
    <div class="card">
      <img src="${p.imageUrl || 'https://via.placeholder.com/300x200?text=Product'}" alt="${p.name}">
      <div class="body">
        <h4>${p.name}</h4>
        <div class="price">₹${Number(p.price).toFixed(2)}</div>
        <p>${p.description || ''}</p>
        <div style="display:flex; gap:8px;">
          <a href="product.html?id=${p.id}"><button>View</button></a>
          <button onclick='(${addToCart.toString()})(${JSON.stringify(p)},1)'>Add to cart</button>
        </div>
      </div>
    </div>
  `).join('');
}

async function loadProductDetail() {
  const params = new URLSearchParams(location.search);
  const id = params.get('id');
  if (!id) return;
  const res = await fetch(`${API_BASE}/products/${id}`);
  const p = await res.json();
  const el = document.getElementById('productDetail');
  el.innerHTML = `
    <div class="card" style="display:grid; grid-template-columns: 1fr 1fr; gap:16px;">
      <img src="${p.imageUrl || 'https://via.placeholder.com/500x300?text=Product'}" alt="${p.name}">
      <div class="body">
        <h2>${p.name}</h2>
        <div class="price">₹${Number(p.price).toFixed(2)}</div>
        <p>${p.description || ''}</p>
        <label>Quantity</label>
        <input type="number" id="qty" min="1" value="1">
        <button id="addBtn">Add to cart</button>
      </div>
    </div>
  `;
  document.getElementById('addBtn').addEventListener('click', () => {
    const q = Math.max(1, Number(document.getElementById('qty').value || 1));
    addToCart(p, q);
  });
}

function renderCart() {
  const cart = getCart();
  const container = document.getElementById('cartItems');
  const totalEl = document.getElementById('cartTotal');
  if (!container) return;
  if (cart.length === 0) {
    container.innerHTML = '<p>Your cart is empty.</p>';
    totalEl.textContent = '';
    return;
  }
  container.innerHTML = cart.map(i => `
    <div class="cart-item">
      <div>${i.name} × ${i.quantity}</div>
      <div>₹${(i.price * i.quantity).toFixed(2)}</div>
      <button onclick="(${removeFromCart.toString()})(${i.productId})">Remove</button>
    </div>
  `).join('');
  const total = cart.reduce((sum, i) => sum + i.price * i.quantity, 0);
  totalEl.textContent = `Total: ₹${total.toFixed(2)}`;
}

function bindCheckout() {
  const form = document.getElementById('checkoutForm');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const address = document.getElementById('address').value.trim();
    const items = getCart().map(i => ({ productId: i.productId, quantity: i.quantity }));
    const resultEl = document.getElementById('orderResult');

    if (!isAuthed()) {
      resultEl.textContent = 'Please login before checkout.';
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getToken()}` },
        body: JSON.stringify({ items, address })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Order failed');
      resultEl.textContent = `Order placed! ID: ${data.orderId}, Total: ₹${Number(data.total).toFixed(2)}.`;
      setCart([]); // clear cart after success
      renderCart();
    } catch (err) {
      resultEl.textContent = err.message;
    }
  });
}

function bindAuthForms() {
  const reg = document.getElementById('registerForm');
  const log = document.getElementById('loginForm');
  const regMsg = document.getElementById('registerMsg');
  const logMsg = document.getElementById('loginMsg');

  reg.addEventListener('submit', async (e) => {
    e.preventDefault();
    const payload = {
      username: document.getElementById('regUsername').value.trim(),
      email: document.getElementById('regEmail').value.trim(),
      password: document.getElementById('regPassword').value
    };
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (res.ok) {
      setToken(data.token);
      regMsg.textContent = 'Registered successfully.';
    } else {
      regMsg.textContent = data.error || 'Registration failed';
    }
  });

  log.addEventListener('submit', async (e) => {
    e.preventDefault();
    const payload = {
      email: document.getElementById('loginEmail').value.trim(),
      password: document.getElementById('loginPassword').value
    };
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (res.ok) {
      setToken(data.token);
      logMsg.textContent = 'Logged in successfully.';
    } else {
      logMsg.textContent = data.error || 'Login failed';
    }
  });
}