import { supabase } from '../supabase-client.js';
import { statusBadge, formatDate, formatCurrency, loadingSpinner, emptyState } from '../utils.js';

let allItems = [];

export async function renderVehicleRequest() {
  const container = document.getElementById('pageContent');
  container.innerHTML = loadingSpinner();

  const { data } = await supabase.from('vehicle_requests').select('*').order('created_at', { ascending: false });
  allItems = data || [];

  container.innerHTML = `
    <div class="fade-in">
      <div class="page-hero">
        <h1>Request New Vehicle</h1>
        <p>Submit and track new vehicle requests for your fleet</p>
      </div>
      <div class="page-section">
        <div class="data-card">
          <div class="data-card-header">
            <h3>New Vehicle Requests</h3>
            <span></span>
          </div>
          <div class="data-card-body">
            <div class="search-filter-bar mb-3">
              <div class="search-input-group">
                <i class="bi bi-search"></i>
                <input type="text" class="form-control" id="vrSearch" placeholder="Search...">
              </div>
              <select class="form-select filter-select" id="vrStatusFilter">
                <option value="">All Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="fulfilled">Fulfilled</option>
              </select>
            </div>
          </div>
          <div class="table-container" id="vrTableContainer">${buildTable(allItems)}</div>
        </div>
      </div>
    </div>
  `;

  document.getElementById('vrSearch').addEventListener('input', filterRender);
  document.getElementById('vrStatusFilter').addEventListener('change', filterRender);
}

function buildTable(items) {
  if (items.length === 0) return `<div class="data-card-body">${emptyState('bi-plus-circle', 'No Vehicle Requests', 'No requests to show.')}</div>`;
  return `
    <table class="data-table">
      <thead><tr><th>Requested By</th><th>Type</th><th>Qty</th><th>Preferred</th><th>Purpose</th><th>Budget</th><th>Status</th><th>Date</th></tr></thead>
      <tbody>
        ${items.map(r => `
          <tr>
            <td><strong>${r.requested_by}</strong></td>
            <td style="text-transform:capitalize">${r.vehicle_type}</td>
            <td>${r.quantity}</td>
            <td>${r.preferred_make ? `${r.preferred_make} ${r.preferred_model || ''}` : '-'}</td>
            <td><small>${r.purpose}</small></td>
            <td>${formatCurrency(r.budget)}</td>
            <td>${statusBadge(r.status)}</td>
            <td>${formatDate(r.created_at)}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>`;
}

function filterRender() {
  const q = (document.getElementById('vrSearch').value || '').toLowerCase();
  const st = document.getElementById('vrStatusFilter').value;
  const filtered = allItems.filter(r => {
    const text = `${r.requested_by} ${r.purpose} ${r.preferred_make} ${r.preferred_model}`.toLowerCase();
    return (!q || text.includes(q)) && (!st || r.status === st);
  });
  document.getElementById('vrTableContainer').innerHTML = buildTable(filtered);
}
