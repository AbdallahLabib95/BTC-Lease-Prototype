import { supabase } from '../supabase-client.js';
import { formatDate, statusBadge, loadingSpinner } from '../utils.js';

export async function renderTodoList() {
  const container = document.getElementById('pageContent');
  container.innerHTML = loadingSpinner();

  const [agreements, maintenance] = await Promise.all([
    supabase.from('agreements').select('*'),
    supabase.from('maintenance_schedules').select('*, vehicles(plate_number, make, model)')
  ]);

  const ag = agreements.data || [];
  const m = maintenance.data || [];

  const expiringAgreements = ag.filter(a => {
    if (a.status !== 'active') return false;
    const diff = (new Date(a.end_date) - new Date()) / (1000 * 60 * 60 * 24);
    return diff <= 30 && diff > 0;
  });

  const upcomingMaintenance = m
    .filter(x => x.status === 'scheduled' || x.status === 'in_progress')
    .sort((a, b) => new Date(a.scheduled_date) - new Date(b.scheduled_date));

  container.innerHTML = `
    <div class="fade-in">
      <div class="page-section" style="padding-top:32px">
        <h1 style="font-size:24px;font-weight:700;margin-bottom:24px">Customer Have Expired Documents</h1>

        <div class="data-card mb-5">
          <div style="display:flex;justify-content:flex-end;padding:16px 16px 0">
            <div style="display:flex;align-items:center;gap:8px"><span style="font-size:14px;color:var(--text-secondary)">Search:</span><input type="text" class="form-control" id="todoDocSearch" style="width:200px;padding:6px 12px;font-size:13px"></div>
          </div>
          <div class="table-container" id="todoDocTable">
            ${buildDocTable(expiringAgreements)}
          </div>
          <div class="table-footer-info">
            <span>Showing ${expiringAgreements.length > 0 ? '1' : '0'} to ${expiringAgreements.length} of ${expiringAgreements.length} entries</span>
            <div class="pagination-links"><a>Previous</a><a>Next</a></div>
          </div>
        </div>

        <h2 style="font-size:24px;font-weight:700;margin-bottom:24px">Service Reminders</h2>

        <div class="data-card mb-5">
          <div style="display:flex;justify-content:flex-end;padding:16px 16px 0">
            <div style="display:flex;align-items:center;gap:8px"><span style="font-size:14px;color:var(--text-secondary)">Search:</span><input type="text" class="form-control" id="todoServiceSearch" style="width:200px;padding:6px 12px;font-size:13px"></div>
          </div>
          <div class="table-container" id="todoServiceTable">
            ${buildServiceTable(upcomingMaintenance)}
          </div>
          <div class="table-footer-info">
            <span>Showing ${upcomingMaintenance.length > 0 ? '1' : '0'} to ${upcomingMaintenance.length} of ${upcomingMaintenance.length} entries</span>
            <div class="pagination-links"><a>Previous</a><a>Next</a></div>
          </div>
        </div>
      </div>
    </div>
  `;

  const allExpiring = [...expiringAgreements];
  const allMaint = [...upcomingMaintenance];

  document.getElementById('todoDocSearch').addEventListener('input', function () {
    const q = this.value.toLowerCase();
    const filtered = allExpiring.filter(a => `${a.client_name} ${a.end_date}`.toLowerCase().includes(q));
    document.getElementById('todoDocTable').innerHTML = buildDocTable(filtered);
  });

  document.getElementById('todoServiceSearch').addEventListener('input', function () {
    const q = this.value.toLowerCase();
    const filtered = allMaint.filter(item => {
      const text = `${item.vehicles ? item.vehicles.make + ' ' + item.vehicles.model + ' ' + item.vehicles.plate_number : ''} ${item.maintenance_type}`.toLowerCase();
      return text.includes(q);
    });
    document.getElementById('todoServiceTable').innerHTML = buildServiceTable(filtered);
  });
}

function buildDocTable(items) {
  return `
    <table class="data-table">
      <thead><tr><th>Customer</th><th>Documant Type</th><th>Expiration Date</th></tr></thead>
      <tbody>
        ${items.length === 0
          ? '<tr><td colspan="3" class="no-data-text">No data available in table</td></tr>'
          : items.map(a => `<tr><td>${a.client_name}</td><td>Lease Agreement</td><td>${formatDate(a.end_date)}</td></tr>`).join('')}
      </tbody>
    </table>`;
}

function buildServiceTable(items) {
  return `
    <table class="data-table">
      <thead><tr><th>Vehicles</th><th>Services</th><th>Date</th><th>Kilometer</th><th>Status</th></tr></thead>
      <tbody>
        ${items.length === 0
          ? '<tr><td colspan="5" class="no-data-text">No data available in table</td></tr>'
          : items.map(item => `<tr>
              <td>${item.vehicles ? item.vehicles.make + ' ' + item.vehicles.model : '-'}<br><small class="text-muted">${item.vehicles ? item.vehicles.plate_number : ''}</small></td>
              <td>${item.maintenance_type}</td>
              <td>${formatDate(item.scheduled_date)}</td>
              <td>-</td>
              <td>${statusBadge(item.status)}</td>
            </tr>`).join('')}
      </tbody>
    </table>`;
}
