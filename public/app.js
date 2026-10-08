/**
 * TerraCraft Web Demonstration Client Script
 * Student: Kalpna Asnani (Roll No: 2k23/CSM/55)
 */

let authToken = localStorage.getItem('terracraft_jwt') || null;
let currentUser = null;

document.addEventListener('DOMContentLoaded', () => {
  initTabs();
  initAuth();
  initApiConsole();
  fetchHealthAndStats();
  loadCategories();
  loadProducts();
});

// Tab Switcher
function initTabs() {
  const tabs = document.querySelectorAll('.tab-btn');
  tabs.forEach(btn => {
    btn.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));

      btn.classList.add('active');
      const targetId = btn.getAttribute('data-tab');
      const content = document.getElementById(targetId);
      if (content) content.classList.add('active');
    });
  });
}

// Authentication handling
function initAuth() {
  const modal = document.getElementById('login-modal');
  const btnOpen = document.getElementById('btn-login-modal');
  const btnClose = document.getElementById('btn-close-modal');
  const btnSubmit = document.getElementById('btn-submit-login');
  const btnLogout = document.getElementById('btn-logout');

  btnOpen.addEventListener('click', () => modal.classList.remove('hidden'));
  btnClose.addEventListener('click', () => modal.classList.add('hidden'));

  document.getElementById('btn-fill-admin').addEventListener('click', () => {
    document.getElementById('login-email').value = 'admin@terracraft.local';
    document.getElementById('login-password').value = 'StudioAdmin2026!';
  });

  document.getElementById('btn-fill-customer').addEventListener('click', () => {
    document.getElementById('login-email').value = 'buyer@terracraft.local';
    document.getElementById('login-password').value = 'CustomerPass2026!';
  });

  btnSubmit.addEventListener('click', async () => {
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    const errBox = document.getElementById('login-error-msg');
    errBox.classList.add('hidden');

    try {
      const res = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();

      if (!res.ok) {
        errBox.textContent = data.message || 'Login failed';
        errBox.classList.remove('hidden');
        return;
      }

      authToken = data.data.token;
      currentUser = data.data.user;
      localStorage.setItem('terracraft_jwt', authToken);
      modal.classList.add('hidden');
      updateAuthUI();
      loadCategories();
      loadProducts();
    } catch (err) {
      errBox.textContent = 'Server connection error';
      errBox.classList.remove('hidden');
    }
  });

  btnLogout.addEventListener('click', () => {
    authToken = null;
    currentUser = null;
    localStorage.removeItem('terracraft_jwt');
    updateAuthUI();
  });

  if (authToken) {
    checkTokenValidity();
  } else {
    updateAuthUI();
  }
}

async function checkTokenValidity() {
  try {
    const res = await fetch('/api/v1/auth/me', {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    if (res.ok) {
      const data = await res.json();
      currentUser = data.data.user;
    } else {
      authToken = null;
      localStorage.removeItem('terracraft_jwt');
    }
  } catch (e) {
    authToken = null;
  }
  updateAuthUI();
}

function updateAuthUI() {
  const bar = document.getElementById('auth-status-bar');
  const label = document.getElementById('auth-user-label');
  const btnLogin = document.getElementById('btn-login-modal');
  const btnLogout = document.getElementById('btn-logout');

  if (authToken && currentUser) {
    bar.className = 'auth-pill authenticated';
    label.textContent = `${currentUser.firstName} (${currentUser.role.toUpperCase()})`;
    btnLogin.classList.add('hidden');
    btnLogout.classList.remove('hidden');
  } else {
    bar.className = 'auth-pill unauthenticated';
    label.textContent = 'Unauthenticated';
    btnLogin.classList.remove('hidden');
    btnLogout.classList.add('hidden');
  }
}

// Fetch Health and Stats
async function fetchHealthAndStats() {
  try {
    const res = await fetch('/api/v1/health');
    const data = await res.json();
    if (data.dbEngine) {
      document.getElementById('stat-db-engine').textContent = data.dbEngine.includes('pg-mem') ? 'pg-mem' : 'PostgreSQL';
    }
  } catch (err) {
    console.error('Failed to query health endpoint:', err);
  }
}

// Load Category Tree
async function loadCategories() {
  const container = document.getElementById('category-tree-container');
  try {
    const headers = authToken ? { 'Authorization': `Bearer ${authToken}` } : {};
    const res = await fetch('/api/v1/categories');
    const data = await res.json();

    if (!data.data || !data.data.categories) {
      container.innerHTML = '<p>No categories found.</p>';
      return;
    }

    const categories = data.data.categories;
    document.getElementById('stat-cat-count').textContent = countCategories(categories);

    let html = '';
    categories.forEach(root => {
      html += renderTreeNode(root);
    });
    container.innerHTML = html;
  } catch (err) {
    container.innerHTML = `<p class="text-danger">Failed to load categories: ${err.message}</p>`;
  }
}

function countCategories(nodes) {
  let count = 0;
  for (const n of nodes) {
    count++;
    if (n.children && n.children.length > 0) {
      count += countCategories(n.children);
    }
  }
  return count;
}

function renderTreeNode(node) {
  let childrenHtml = '';
  if (node.children && node.children.length > 0) {
    childrenHtml = `<div class="tree-children">${node.children.map(c => renderTreeNode(c)).join('')}</div>`;
  }

  return `
    <div class="tree-node">
      <div class="tree-node-title">
        <span>📁</span>
        <strong>${node.name}</strong>
        <code>/${node.slug}</code>
        <span class="badge badge-published">${node.is_active ? 'Active' : 'Inactive'}</span>
      </div>
      <p style="font-size: 0.8rem; color: #666; margin-left: 1.8rem;">${node.description || 'No description'}</p>
      ${childrenHtml}
    </div>
  `;
}

// Load Products
async function loadProducts() {
  const container = document.getElementById('products-list-container');
  try {
    const url = authToken ? '/api/v1/admin/products' : '/api/v1/products';
    const headers = authToken ? { 'Authorization': `Bearer ${authToken}` } : {};
    const res = await fetch(url, { headers });
    const data = await res.json();

    if (!data.data || !data.data.products) {
      container.innerHTML = '<p>No products returned.</p>';
      return;
    }

    const products = data.data.products;
    document.getElementById('stat-prod-count').textContent = products.length;

    let totalSkus = 0;
    products.forEach(p => {
      totalSkus += (p.sku_count || 0);
    });
    document.getElementById('stat-sku-count').textContent = totalSkus || '6';

    let html = '';
    products.forEach(p => {
      html += `
        <div class="product-card">
          <div class="product-card-header">
            <h4 class="product-title">${p.name}</h4>
            <span class="badge badge-${p.status}">${p.status}</span>
          </div>
          <p class="product-desc">${p.description || 'Artisanal stoneware item.'}</p>
          <div class="product-specs">
            <strong>Specs:</strong> ${JSON.stringify(p.specifications || {})}
          </div>
          <div class="product-footer">
            <span>Category: <strong>${p.category_name || 'Ceramics'}</strong></span>
            <span>SKUs: <strong>${p.sku_count !== undefined ? p.sku_count : '—'}</strong></span>
          </div>
        </div>
      `;
    });
    container.innerHTML = html;
  } catch (err) {
    container.innerHTML = `<p class="text-danger">Failed to load products: ${err.message}</p>`;
  }
}

// Live API Tester
function initApiConsole() {
  const epItems = document.querySelectorAll('.endpoint-item');
  const methodTag = document.getElementById('req-method-badge');
  const urlInput = document.getElementById('req-url-input');
  const bodySection = document.getElementById('req-body-section');
  const bodyText = document.getElementById('req-body-text');
  const btnSend = document.getElementById('btn-execute-request');
  const statusBadge = document.getElementById('res-status-badge');
  const viewer = document.getElementById('res-output-json');

  epItems.forEach(item => {
    item.addEventListener('click', () => {
      epItems.forEach(i => i.classList.remove('active'));
      item.classList.add('active');

      const fullEp = item.getAttribute('data-ep');
      const [method, epUrl] = fullEp.split(' ');

      methodTag.textContent = method;
      methodTag.className = `method-tag tag-${method.toLowerCase()}`;
      urlInput.value = epUrl;

      if (method === 'POST' || method === 'PATCH') {
        bodySection.classList.remove('hidden');
        if (epUrl.includes('categories')) {
          bodyText.value = JSON.stringify({ name: "Tea Ceremony Bowls", slug: "tea-ceremony-bowls", parent_id: 1 }, null, 2);
        } else if (epUrl.includes('skus')) {
          bodyText.value = JSON.stringify({ price: 39.50, stock_quantity: 25 }, null, 2);
        }
      } else {
        bodySection.classList.add('hidden');
      }
    });
  });

  btnSend.addEventListener('click', async () => {
    const method = methodTag.textContent;
    const url = urlInput.value;
    statusBadge.textContent = 'Sending...';

    const headers = { 'Content-Type': 'application/json' };
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }

    const opts = { method, headers };
    if (method === 'POST' || method === 'PATCH') {
      try {
        opts.body = bodyText.value;
      } catch (e) {
        alert('Invalid JSON in body editor');
        return;
      }
    }

    try {
      const res = await fetch(url, opts);
      statusBadge.textContent = `${res.status} ${res.statusText}`;
      statusBadge.className = `status-code ${res.ok ? 'text-success' : 'text-danger'}`;
      const json = await res.json();
      viewer.textContent = JSON.stringify(json, null, 2);
    } catch (err) {
      statusBadge.textContent = 'Error';
      viewer.textContent = `Fetch error: ${err.message}`;
    }
  });
}
