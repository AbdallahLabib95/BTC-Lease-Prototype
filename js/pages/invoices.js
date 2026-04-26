import { supabase } from '../supabase-client.js';
import { statusBadge, formatDate, formatCurrency, loadingSpinner } from '../utils.js';

let allItems = [];

export async function renderInvoices() {
  const container = document.getElementById('pageContent');
  container.innerHTML = loadingSpinner();

  const { data: items } = await supabase.from('invoices').select('*, agreements(agreement_number, client_name)').order('created_at', { ascending: false });
  allItems = items || [];

  const unpaidCount = allItems.filter(i => i.status !== 'paid').length;

  const now = new Date();
  const fromDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
  const toDate = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

  container.innerHTML = `
    <div class="fade-in">
      <div class="page-section" style="padding-top:32px">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">
          <div>
            <h1 style="font-size:24px;font-weight:700;margin:0">Invoices</h1>
            <p style="font-size:14px;color:var(--text-secondary);margin:4px 0 0">Total Not Paid Invoices / ${unpaidCount}</p>
          </div>
        </div>

        <div class="row g-3 mb-3" style="margin-top:16px">
          <div class="col-md-4">
            <label class="form-label">Invoice Type</label>
            <select class="form-select" id="invTypeFilter">
              <option value="">Select</option>
              <option value="lease">Lease</option>
              <option value="rental">Rental</option>
              <option value="maintenance">Maintenance</option>
            </select>
          </div>
          <div class="col-md-4">
            <label class="form-label">Invoice No.</label>
            <input type="text" class="form-control" id="invSearchNum" placeholder="Invoice No.">
          </div>
          <div class="col-md-4">
            <label class="form-label">Agreement No.</label>
            <input type="text" class="form-control" id="invSearchAgr" placeholder="Agreement No.">
          </div>
          <div class="col-md-4">
            <label class="form-label">Status</label>
            <select class="form-select" id="invStatusFilter">
              <option value="">Select</option>
              <option value="pending">Pending</option>
              <option value="paid">Paid</option>
              <option value="overdue">Overdue</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          <div class="col-md-4">
            <label class="form-label">From Date</label>
            <input type="date" class="form-control" id="invFromDate" value="${fromDate}">
          </div>
          <div class="col-md-4">
            <label class="form-label">To Date</label>
            <input type="date" class="form-control" id="invToDate" value="${toDate}">
          </div>
        </div>
        <div style="text-align:center;margin-bottom:24px">
          <button class="btn-primary-green" id="invSearchBtn"><i class="bi bi-search"></i> Search</button>
        </div>

        <div class="data-card">
          <div class="table-container" id="invTableContainer">${buildTable(allItems)}</div>
          <div class="table-footer-info">
            <span>Showing ${allItems.length > 0 ? '1' : '0'} to ${allItems.length} of ${allItems.length} entries</span>
            <div class="pagination-links"><a>Previous</a><a>Next</a></div>
          </div>
        </div>
      </div>
    </div>
  `;

  document.getElementById('invSearchBtn').addEventListener('click', filterRender);
}

function buildTable(items) {
  if (items.length === 0) return `<div class="no-data-text">No data available in table</div>`;
  return `
    <table class="data-table">
      <thead><tr><th>Invoice Type</th><th>Date</th><th>Total Invoice</th><th>Tax</th><th>Total</th><th>Status</th></tr></thead>
      <tbody>
        ${items.map(i => `
          <tr>
            <td><strong>${i.invoice_number}</strong></td>
            <td>${formatDate(i.issued_date || i.created_at)}</td>
            <td>${formatCurrency(i.amount)}</td>
            <td>${formatCurrency(i.tax_amount)}</td>
            <td><strong>${formatCurrency(i.total_amount)}</strong></td>
            <td>${statusBadge(i.status)}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>`;
}

function filterRender() {
  const num = (document.getElementById('invSearchNum').value || '').toLowerCase();
  const st = document.getElementById('invStatusFilter').value;
  const agr = (document.getElementById('invSearchAgr').value || '').toLowerCase();
  const filtered = allItems.filter(i => {
    const matchNum = !num || i.invoice_number.toLowerCase().includes(num);
    const matchStatus = !st || i.status === st;
    const matchAgr = !agr || (i.agreements && i.agreements.agreement_number.toLowerCase().includes(agr));
    return matchNum && matchStatus && matchAgr;
  });
  document.getElementById('invTableContainer').innerHTML = buildTable(filtered);
}
