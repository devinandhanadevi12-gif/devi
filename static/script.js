// ── State ──────────────────────────────────────────────────────────────────────
let allExpenses = [];   // Cache of all fetched expenses

// ── On Page Load ───────────────────────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', () => {
  // Set today's date as default in the date input
  const dateInput = document.getElementById('date');
  dateInput.value = new Date().toISOString().split('T')[0];

  loadExpenses();
});

// ── Fetch All Expenses ─────────────────────────────────────────────────────────
async function loadExpenses() {
  try {
    const res = await fetch('/expenses');
    allExpenses = await res.json();
    renderTable(allExpenses);
    renderSummary();
    updateTotal();
  } catch (err) {
    console.error('Failed to load expenses:', err);
  }
}

// ── Add Expense ────────────────────────────────────────────────────────────────
async function addExpense() {
  const title    = document.getElementById('title').value.trim();
  const amount   = document.getElementById('amount').value.trim();
  const category = document.getElementById('category').value;
  const date     = document.getElementById('date').value;
  const msgEl    = document.getElementById('form-message');

  // Client-side validation
  if (!title || !amount || !category || !date) {
    showMessage(msgEl, '⚠️ Please fill in all fields.', 'error');
    return;
  }

  try {
    const res = await fetch('/expenses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, amount: parseFloat(amount), category, date })
    });

    const data = await res.json();

    if (res.ok) {
      showMessage(msgEl, '✅ Expense added!', 'success');
      clearForm();
      loadExpenses();    // Refresh list
    } else {
      showMessage(msgEl, `❌ ${data.error}`, 'error');
    }
  } catch (err) {
    showMessage(msgEl, '❌ Server error. Is Flask running?', 'error');
  }
}

// ── Delete Expense ─────────────────────────────────────────────────────────────
async function deleteExpense(id) {
  if (!confirm('Delete this expense?')) return;

  try {
    const res = await fetch(`/expenses/${id}`, { method: 'DELETE' });
    if (res.ok) {
      loadExpenses();
    }
  } catch (err) {
    alert('Failed to delete. Is Flask running?');
  }
}

// ── Render Table ───────────────────────────────────────────────────────────────
function renderTable(expenses) {
  const tbody    = document.getElementById('expense-body');
  const emptyEl  = document.getElementById('empty-state');
  const tableEl  = document.getElementById('expense-table');

  tbody.innerHTML = '';

  if (expenses.length === 0) {
    tableEl.style.display = 'none';
    emptyEl.style.display = 'block';
    return;
  }

  tableEl.style.display = 'table';
  emptyEl.style.display = 'none';

  expenses.forEach(exp => {
    const tr = document.createElement('tr');
    tr.classList.add('fade-in');
    tr.innerHTML = `
      <td>${escapeHtml(exp.title)}</td>
      <td><span class="category-badge">${escapeHtml(exp.category)}</span></td>
      <td>${formatDate(exp.date)}</td>
      <td class="amount-cell">₹${parseFloat(exp.amount).toFixed(2)}</td>
      <td><button class="delete-btn" onclick="deleteExpense(${exp.id})">✕</button></td>
    `;
    tbody.appendChild(tr);
  });
}

// ── Render Category Summary ────────────────────────────────────────────────────
async function renderSummary() {
  const container = document.getElementById('summary-container');

  try {
    const res  = await fetch('/summary');
    const data = await res.json();

    if (data.length === 0) {
      container.innerHTML = '<span class="empty-hint">No data yet.</span>';
      return;
    }

    container.innerHTML = data.map(item => `
      <div class="pill">
        <span class="pill-label">${escapeHtml(item.category)}</span>
        <span class="pill-amount">₹${parseFloat(item.total).toFixed(2)}</span>
      </div>
    `).join('');
  } catch (err) {
    container.innerHTML = '<span class="empty-hint">Could not load summary.</span>';
  }
}

// ── Update Total ───────────────────────────────────────────────────────────────
function updateTotal() {
  const total = allExpenses.reduce((sum, e) => sum + parseFloat(e.amount), 0);
  document.getElementById('total-amount').textContent = `₹${total.toFixed(2)}`;
}

// ── Filter / Search ────────────────────────────────────────────────────────────
function filterExpenses() {
  const query = document.getElementById('filter-input').value.toLowerCase();
  const filtered = allExpenses.filter(e =>
    e.title.toLowerCase().includes(query) ||
    e.category.toLowerCase().includes(query)
  );
  renderTable(filtered);
}

// ── Helpers ────────────────────────────────────────────────────────────────────
function clearForm() {
  document.getElementById('title').value    = '';
  document.getElementById('amount').value   = '';
  document.getElementById('category').value = '';
  // Keep date as today
}

function showMessage(el, text, type) {
  el.textContent  = text;
  el.className    = type === 'success' ? 'msg-success' : 'msg-error';
  setTimeout(() => { el.textContent = ''; }, 3000);
}

function formatDate(dateStr) {
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y}`;
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
