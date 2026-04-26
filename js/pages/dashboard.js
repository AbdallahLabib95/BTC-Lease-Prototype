import { supabase } from '../supabase-client.js';
import { formatCurrency, formatDate, statusBadge, loadingSpinner } from '../utils.js';

export async function renderDashboard() {
  const container = document.getElementById('pageContent');
  container.innerHTML = loadingSpinner();

  const [vehicles, agreements, maintenance, incidents, invoices, replacements, vehicleRequests] = await Promise.all([
    supabase.from('vehicles').select('*'),
    supabase.from('agreements').select('*'),
    supabase.from('maintenance_schedules').select('*, vehicles(plate_number, make, model)'),
    supabase.from('incidents').select('*, vehicles(plate_number, make, model)'),
    supabase.from('invoices').select('*'),
    supabase.from('replacement_requests').select('*'),
    supabase.from('vehicle_requests').select('*')
  ]);

  const v = vehicles.data || [];
  const ag = agreements.data || [];
  const m = maintenance.data || [];
  const inc = incidents.data || [];
  const inv = invoices.data || [];
  const rep = replacements.data || [];
  const vr = vehicleRequests.data || [];

  const totalFleet = v.length;
  const available = v.filter(x => x.status === 'available').length;
  const rented = v.filter(x => x.status === 'rented').length;
  const inMaintenance = v.filter(x => x.status === 'maintenance').length;
  const booked = v.filter(x => x.status === 'booked').length;
  const transfer = v.filter(x => x.status === 'transfer').length;
  const underRepair = v.filter(x => x.status === 'under_repair').length;
  const outGarage = v.filter(x => x.status === 'out_garage').length;
  const staffService = v.filter(x => x.status === 'staff_service').length;

  const pendingReplacements = rep.filter(x => x.status === 'pending').length;
  const movementIn = rep.filter(x => x.status === 'approved').length;
  const movementOut = rep.filter(x => x.status === 'completed').length;
  const transferRequests = vr.filter(x => x.status === 'pending').length;
  const totalMovements = movementIn + movementOut + transferRequests;

  const totalAgreements = ag.length;
  const agOpen = ag.filter(x => x.status === 'active' || x.status === 'open').length;
  const agClosed = ag.filter(x => x.status === 'closed').length;
  const agPendingPayment = ag.filter(x => x.status === 'pending_payment' || x.status === 'pending_payment_closing').length;
  const agPendingClosing = ag.filter(x => x.status === 'pending_closing').length;

  const overdueInvoices = inv.filter(x => x.status === 'overdue');
  const pendingInvoices = inv.filter(x => x.status === 'pending');
  const paidInvoices = inv.filter(x => x.status === 'paid');
  const unpaidInvoices = inv.filter(x => x.status !== 'paid');
  const openIncidents = inc.filter(x => x.status === 'reported' || x.status === 'under_review').length;
  const upcomingMaint = m.filter(x => x.status === 'scheduled').length;

  const allPaymentTotal = inv.reduce((s, i) => s + (i.total_amount || 0), 0);
  const duePaymentTotal = [...overdueInvoices, ...pendingInvoices].reduce((s, i) => s + (i.total_amount || 0), 0);
  const paidTotal = paidInvoices.reduce((s, i) => s + (i.total_amount || 0), 0);
  const unpaidTotal = unpaidInvoices.reduce((s, i) => s + (i.total_amount || 0), 0);

  const expiringAgreements = ag.filter(a => {
    if (a.status !== 'active') return false;
    const diff = (new Date(a.end_date) - new Date()) / (1000 * 60 * 60 * 24);
    return diff <= 30 && diff > 0;
  });

  const recentIncidents = inc.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 5);
  const upcomingMaintenanceList = m.filter(x => x.status === 'scheduled' || x.status === 'in_progress')
    .sort((a, b) => new Date(a.scheduled_date) - new Date(b.scheduled_date)).slice(0, 5);

  const maxBar = totalFleet || 1;

  const agreementSegs = [
    { label: 'Open', value: agOpen, color: '#16a34a' },
    { label: 'Closed', value: agClosed, color: '#ef4444' },
    { label: 'Pending Payment', value: agPendingPayment, color: '#f59e0b' },
    { label: 'Pending Closing', value: agPendingClosing, color: '#0f172a' }
  ];
  const vehicleSegs = [
    { label: 'Ready', value: available, color: '#06b6d4' },
    { label: 'Maintenance', value: inMaintenance, color: '#f97316' },
    { label: 'Rented', value: rented, color: '#2563eb' },
    { label: 'Booked', value: booked, color: '#eab308' },
    { label: 'Transfer', value: transfer, color: '#64748b' },
    { label: 'Under Repair', value: underRepair, color: '#dc2626' },
    { label: 'Out Garage', value: outGarage, color: '#0891b2' },
    { label: 'Staff Service', value: staffService, color: '#e11d48' }
  ];
  const movementSegs = [
    { label: 'Movement In', value: movementIn, color: '#0ea5e9' },
    { label: 'Movement Out', value: movementOut, color: '#f59e0b' },
    { label: 'Transfer Requests', value: transferRequests, color: '#e11d48' }
  ];

  function pieChart(segs) {
    const total = segs.reduce((s, x) => s + x.value, 0);
    if (total === 0) {
      return `<div class="pie-empty">No Data</div>`;
    }
    let cur = 0;
    const stops = segs.filter(s => s.value > 0).map(s => {
      const start = (cur / total) * 360;
      cur += s.value;
      const end = (cur / total) * 360;
      return `${s.color} ${start}deg ${end}deg`;
    }).join(', ');
    return `<div class="pie-chart" style="background:conic-gradient(${stops})"></div>`;
  }

  function legend(segs) {
    return `<div class="pie-legend">${segs.map(s => `
      <div class="pie-legend-item"><span class="pie-legend-dot" style="background:${s.color}"></span>${s.label}</div>
    `).join('')}</div>`;
  }

  function progressRows(segs) {
    const total = segs.reduce((s, x) => s + x.value, 0) || 1;
    return segs.map(s => `
      <div class="chart-bar-row">
        <span class="chart-bar-label">${s.label}</span>
        <div class="chart-bar-track">
          <div class="chart-bar-fill" style="width:${(s.value / total) * 100}%;background:${s.color}">${s.value}</div>
        </div>
      </div>
    `).join('');
  }

  container.innerHTML = `
    <div class="fade-in">
      <div class="page-section" style="padding-top:32px">

        <h2 class="section-title">Overview</h2>
        <div class="row g-3 mb-4">
          <div class="col-6 col-md-3">
            <div class="gradient-card green-gradient">
              <div class="gc-title">Agreements</div>
              <div class="gc-value">${totalAgreements}</div>
              <div class="gc-icon"><i class="bi bi-file-earmark-text-fill"></i></div>
            </div>
          </div>
          <div class="col-6 col-md-3">
            <div class="gradient-card green-gradient">
              <div class="gc-title">Vehicles</div>
              <div class="gc-value">${totalFleet}</div>
              <div class="gc-icon"><i class="bi bi-truck-front-fill"></i></div>
            </div>
          </div>
          <div class="col-6 col-md-3">
            <div class="gradient-card green-gradient">
              <div class="gc-title">Movement In</div>
              <div class="gc-value">${movementIn}</div>
              <div class="gc-icon"><i class="bi bi-box-arrow-in-right"></i></div>
            </div>
          </div>
          <div class="col-6 col-md-3">
            <div class="gradient-card green-gradient">
              <div class="gc-title">Movement Out</div>
              <div class="gc-value">${movementOut}</div>
              <div class="gc-icon"><i class="bi bi-box-arrow-right"></i></div>
            </div>
          </div>
        </div>

        <h2 class="section-title">Agreement Status</h2>
        <div class="row g-3 mb-4">
          <div class="col-lg-7">
            <div class="form-card h-100">
              <div class="form-card-body">
                <h3 class="form-card-title">Agreement Breakdown</h3>
                <div class="chart-placeholder">${progressRows(agreementSegs)}</div>
              </div>
            </div>
          </div>
          <div class="col-lg-5">
            <div class="form-card h-100">
              <div class="form-card-body text-center">
                <h3 class="form-card-title">Rental Agreement : ${totalAgreements} Agreement</h3>
                <div class="pie-wrap">${pieChart(agreementSegs)}</div>
                ${legend(agreementSegs)}
              </div>
            </div>
          </div>
        </div>

        <h2 class="section-title">Vehicle Status</h2>
        <div class="row g-3 mb-4">
          <div class="col-lg-7">
            <div class="form-card h-100">
              <div class="form-card-body">
                <h3 class="form-card-title">Vehicle Breakdown</h3>
                <div class="chart-placeholder">${progressRows(vehicleSegs)}</div>
              </div>
            </div>
          </div>
          <div class="col-lg-5">
            <div class="form-card h-100">
              <div class="form-card-body text-center">
                <h3 class="form-card-title">Vehicle Status : ${totalFleet} Vehicle</h3>
                <div class="pie-wrap">${pieChart(vehicleSegs)}</div>
                ${legend(vehicleSegs)}
              </div>
            </div>
          </div>
        </div>

        <h2 class="section-title">Vehicle Movements</h2>
        <div class="row g-3 mb-5">
          <div class="col-lg-7">
            <div class="form-card h-100">
              <div class="form-card-body">
                <h3 class="form-card-title">Movement Breakdown</h3>
                <div class="chart-placeholder">${progressRows(movementSegs)}</div>
              </div>
            </div>
          </div>
          <div class="col-lg-5">
            <div class="form-card h-100">
              <div class="form-card-body text-center">
                <h3 class="form-card-title">Movements Count : ${totalMovements} Movement</h3>
                <div class="pie-wrap">${pieChart(movementSegs)}</div>
                ${legend(movementSegs)}
              </div>
            </div>
          </div>
        </div>

        <div class="invoices-header">
          <h2 class="section-title" style="margin:0">Invoices</h2>
          <a href="#" class="invoices-view-all" data-page="invoices">View All <i class="bi bi-arrow-right"></i></a>
        </div>
        <div class="row g-3 mb-4 invoice-stat-row">
          <div class="col-6 col-md-3">
            <div class="invoice-stat-card invoice-stat-all">
              <div class="inv-stat-icon"><i class="bi bi-receipt-cutoff"></i></div>
              <div class="inv-stat-body">
                <div class="inv-stat-label">All Payment</div>
                <div class="inv-stat-count">${inv.length} <span class="inv-stat-count-sub">invoices</span></div>
                <div class="inv-stat-amount">${formatCurrency(allPaymentTotal)}</div>
              </div>
              <div class="inv-stat-bar"><div class="inv-stat-bar-fill" style="width:100%"></div></div>
            </div>
          </div>
          <div class="col-6 col-md-3">
            <div class="invoice-stat-card invoice-stat-due">
              <div class="inv-stat-icon"><i class="bi bi-clock-history"></i></div>
              <div class="inv-stat-body">
                <div class="inv-stat-label">Due Payment</div>
                <div class="inv-stat-count">${pendingInvoices.length + overdueInvoices.length} <span class="inv-stat-count-sub">pending</span></div>
                <div class="inv-stat-amount">${formatCurrency(duePaymentTotal)}</div>
              </div>
              <div class="inv-stat-bar"><div class="inv-stat-bar-fill" style="width:${inv.length ? Math.round(((pendingInvoices.length + overdueInvoices.length) / inv.length) * 100) : 0}%"></div></div>
            </div>
          </div>
          <div class="col-6 col-md-3">
            <div class="invoice-stat-card invoice-stat-paid">
              <div class="inv-stat-icon"><i class="bi bi-check-circle-fill"></i></div>
              <div class="inv-stat-body">
                <div class="inv-stat-label">Paid</div>
                <div class="inv-stat-count">${paidInvoices.length} <span class="inv-stat-count-sub">completed</span></div>
                <div class="inv-stat-amount">${formatCurrency(paidTotal)}</div>
              </div>
              <div class="inv-stat-bar"><div class="inv-stat-bar-fill" style="width:${inv.length ? Math.round((paidInvoices.length / inv.length) * 100) : 0}%"></div></div>
            </div>
          </div>
          <div class="col-6 col-md-3">
            <div class="invoice-stat-card invoice-stat-unpaid">
              <div class="inv-stat-icon"><i class="bi bi-exclamation-triangle-fill"></i></div>
              <div class="inv-stat-body">
                <div class="inv-stat-label">Unpaid</div>
                <div class="inv-stat-count">${unpaidInvoices.length} <span class="inv-stat-count-sub">outstanding</span></div>
                <div class="inv-stat-amount">${formatCurrency(unpaidTotal)}</div>
              </div>
              <div class="inv-stat-bar"><div class="inv-stat-bar-fill" style="width:${inv.length ? Math.round((unpaidInvoices.length / inv.length) * 100) : 0}%"></div></div>
            </div>
          </div>
        </div>
<!--
        <h2 class="section-title">Service Reminders</h2>
        <div class="data-card mb-5">
          <div style="display:flex;justify-content:flex-end;padding:16px 16px 0">
            <div style="display:flex;align-items:center;gap:8px"><span style="font-size:14px;color:var(--text-secondary)">Search:</span><input type="text" class="form-control" style="width:200px;padding:6px 12px;font-size:13px"></div>
          </div>
          <div class="table-container">
            <table class="data-table">
              <thead><tr><th>Vehicles</th><th>Services</th><th>Date</th><th>Kilometer</th><th>Status</th></tr></thead>
              <tbody>
                ${upcomingMaintenanceList.length === 0 ?
                  '<tr><td colspan="5" class="no-data-text">No data available in table</td></tr>' :
                  upcomingMaintenanceList.map(item => `<tr>
                    <td>${item.vehicles ? item.vehicles.make + ' ' + item.vehicles.model : '-'}<br><small class="text-muted">${item.vehicles ? item.vehicles.plate_number : ''}</small></td>
                    <td>${item.maintenance_type}</td>
                    <td>${formatDate(item.scheduled_date)}</td>
                    <td>-</td>
                    <td>${statusBadge(item.status)}</td>
                  </tr>`).join('')}
              </tbody>
            </table>
          </div>
          <div class="table-footer-info">
            <span>Showing ${upcomingMaintenanceList.length > 0 ? '1' : '0'} to ${upcomingMaintenanceList.length} of ${upcomingMaintenanceList.length} entries</span>
            <div class="pagination-links"><a>Previous</a><a>Next</a></div>
          </div>
        </div>
-->
        <h2 class="section-title">Quick Actions</h2>
        <div class="row g-3 mb-5">
        
          <div class="col-6 col-md-4 col-lg-2"><a href="#" class="quick-action-card" data-page="replacement"><i class="bi bi-arrow-repeat"></i><span>Replacement</span></a></div>
          <div class="col-6 col-md-4 col-lg-2"><a href="#" class="quick-action-card" data-page="maintenance"><i class="bi bi-wrench-adjustable"></i><span>Maintenance</span></a></div>
          <div class="col-6 col-md-4 col-lg-2"><a href="#" class="quick-action-card" data-page="quotations"><i class="bi bi-calculator-fill"></i><span>Quotation</span></a></div>
          <div class="col-6 col-md-4 col-lg-2"><a href="#" class="quick-action-card" data-page="agreements"><i class="bi bi-file-earmark-text-fill"></i><span>Agreements</span></a></div>
          <div class="col-6 col-md-4 col-lg-2"><a href="#" class="quick-action-card" data-page="invoices"><i class="bi bi-receipt-cutoff"></i><span>Invoices</span></a></div>
        </div>

        <div class="row g-4">
          <div class="col-lg-12">
            <div class="data-card">
              <div class="data-card-header"><h3>Recent Incidents</h3><a href="#" class="btn-outline-green" data-page="incidents">View All</a></div>
              <div class="table-container">
                <table class="data-table">
                  <thead><tr><th>Vehicle</th><th>Type</th><th>Date</th><th>Status</th></tr></thead>
                  <tbody>
                    ${recentIncidents.length === 0 ? '<tr><td colspan="4" class="no-data-text">No data available in table</td></tr>' :
                      recentIncidents.map(item => `<tr><td>${item.vehicles ? item.vehicles.make + ' ' + item.vehicles.model : '-'}</td><td style="text-transform:capitalize">${item.incident_type}</td><td>${formatDate(item.incident_date)}</td><td>${statusBadge(item.status)}</td></tr>`).join('')}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}
