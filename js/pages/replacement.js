import { supabase } from '../supabase-client.js';
import { statusBadge, priorityBadge, formatDate, showToast, loadingSpinner, emptyState } from '../utils.js';

let allItems = [];
let vehiclesList = [];
let agreementsList = [];

export async function renderReplacement() {
  const container = document.getElementById('pageContent');
  container.innerHTML = loadingSpinner();

  const [{ data: items }, { data: vehicles }, { data: agreements }] = await Promise.all([
    supabase.from('replacement_requests').select('*, vehicles!replacement_requests_vehicle_id_fkey(plate_number, make, model), new_vehicle:vehicles!replacement_requests_new_vehicle_id_fkey(plate_number, make, model), agreements(agreement_number, client_name)').order('created_at', { ascending: false }),
    supabase.from('vehicles').select('id, plate_number, make, model'),
    supabase.from('agreements').select('id, agreement_number, client_name').order('agreement_number')
  ]);
  allItems = items || [];
  vehiclesList = vehicles || [];
  agreementsList = agreements || [];

  renderListView(container);
}

function renderListView(container) {
  container.innerHTML = `
    <div class="fade-in">
      <div class="page-hero">
        <h1>Request Replacement</h1>
        <p>Submit and manage vehicle replacement requests</p>
      </div>
      <div class="page-section">
        <div class="data-card">
          <div class="data-card-header" style="display:flex;align-items:center;justify-content:space-between">
            <h3>Vehicle Replacement Requests</h3>
            <button class="btn-primary-green" id="addRepBtn"><i class="bi bi-plus-lg"></i> Add</button>
          </div>
          <div class="data-card-body">
            <div class="search-filter-bar mb-3">
              <div class="search-input-group">
                <i class="bi bi-search"></i>
                <input type="text" class="form-control" id="repSearch" placeholder="Search...">
              </div>
              <select class="form-select filter-select" id="repStatusFilter">
                <option value="">All Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>
          <div class="table-container" id="repTableContainer">${buildTable(allItems)}</div>
        </div>
      </div>
    </div>
  `;

  document.getElementById('repSearch').addEventListener('input', filterRender);
  document.getElementById('repStatusFilter').addEventListener('change', filterRender);
  document.getElementById('addRepBtn').addEventListener('click', () => renderFormView(container, null));
  bindTableActions(container);
}

function buildTable(items) {
  if (items.length === 0) return `<div class="data-card-body">${emptyState('bi-arrow-repeat', 'No Replacement Requests', 'Submit a request to replace a vehicle.')}</div>`;
  return `
    <table class="data-table">
      <thead><tr><th>Agreement</th><th>Old Vehicle</th><th>Reason</th><th>Priority</th><th>Status</th><th>New Vehicle</th><th>Requested By</th><th>Date</th><th>Actions</th></tr></thead>
      <tbody>
        ${items.map(r => {
          const isApproved = r.status === 'approved';
          const newVehicleCell = isApproved && r.new_vehicle
            ? `<div style="display:flex;align-items:center;gap:8px"><i class="bi bi-car-front-fill" style="color:var(--primary);font-size:20px"></i><span style="font-weight:600">${r.new_vehicle.make} ${r.new_vehicle.model} ${r.new_vehicle.plate_number}</span></div>`
            : isApproved ? '<span class="text-muted"><i class="bi bi-car-front"></i> Pending assignment</span>' : '<span class="text-muted">-</span>';
          return `
          <tr>
            <td>${r.agreements ? `<strong>${r.agreements.agreement_number}</strong><br><small class="text-muted">${r.agreements.client_name}</small>` : '-'}</td>
            <td>${r.vehicles ? `${r.vehicles.make} ${r.vehicles.model}<br><small class="text-muted">${r.vehicles.plate_number}</small>` : '-'}</td>
            <td><small>${r.reason || ''}</small></td>
            <td>${priorityBadge(r.priority)}</td>
            <td>${statusBadge(r.status)}</td>
            <td>${newVehicleCell}</td>
            <td>${r.requested_by || '-'}</td>
            <td>${formatDate(r.created_at)}</td>
            <td>
              <button class="btn-icon edit" data-view="${r.id}" title="View"><i class="bi bi-eye"></i></button>
              <button class="btn-icon edit" data-edit="${r.id}" title="Edit"><i class="bi bi-pencil"></i></button>
              <button class="btn-icon delete" data-delete="${r.id}" title="Delete"><i class="bi bi-trash"></i></button>
            </td>
          </tr>`;
        }).join('')}
      </tbody>
    </table>`;
}

function filterRender() {
  const container = document.getElementById('pageContent');
  const q = (document.getElementById('repSearch').value || '').toLowerCase();
  const st = document.getElementById('repStatusFilter').value;
  const filtered = allItems.filter(r => {
    const text = `${r.reason || ''} ${r.requested_by || ''} ${r.vehicles ? r.vehicles.plate_number + ' ' + r.vehicles.make : ''} ${r.agreements ? r.agreements.agreement_number + ' ' + r.agreements.client_name : ''}`.toLowerCase();
    return (!q || text.includes(q)) && (!st || r.status === st);
  });
  document.getElementById('repTableContainer').innerHTML = buildTable(filtered);
  bindTableActions(container);
}

function bindTableActions(container) {
  document.querySelectorAll('#repTableContainer [data-view]').forEach(btn => {
    btn.addEventListener('click', () => {
      const r = allItems.find(x => x.id === btn.dataset.view);
      if (r) renderDetailView(container, r);
    });
  });
  document.querySelectorAll('#repTableContainer [data-edit]').forEach(btn => {
    btn.addEventListener('click', () => {
      const r = allItems.find(x => x.id === btn.dataset.edit);
      if (r) renderFormView(container, r);
    });
  });
  document.querySelectorAll('#repTableContainer [data-delete]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const res = await window.Swal.fire({ title: 'Delete this request?', icon: 'warning', showCancelButton: true, confirmButtonColor: '#dc3545', confirmButtonText: 'Delete', cancelButtonText: 'Cancel' });
      if (!res.isConfirmed) return;
      const { error } = await supabase.from('replacement_requests').delete().eq('id', btn.dataset.delete);
      if (error) { showToast(error.message, 'error'); return; }
      showToast('Request deleted');
      renderReplacement();
    });
  });
}

function renderDetailView(container, r) {
  container.innerHTML = `
    <div class="fade-in">
      <div class="page-section" style="padding-top:32px">
        <div style="display:flex;align-items:center;gap:16px;margin-bottom:24px">
          <button class="btn-secondary-gray" id="backBtn" style="padding:8px 14px"><i class="bi bi-arrow-left"></i></button>
          <h1 style="font-size:24px;font-weight:700;margin:0">Replacement Request Details</h1>
          ${statusBadge(r.status)}
        </div>
        <div class="form-card" style="border-top:4px solid var(--primary)">
          <div class="form-card-body">
            <div class="row g-3">
              <div class="col-md-4"><div style="font-size:12px;color:var(--text-muted)">Agreement</div><div style="font-weight:600">${r.agreements ? r.agreements.agreement_number + ' - ' + r.agreements.client_name : '-'}</div></div>
              <div class="col-md-4"><div style="font-size:12px;color:var(--text-muted)">Old Vehicle</div><div style="font-weight:600">${r.vehicles ? r.vehicles.make + ' ' + r.vehicles.model + ' (' + r.vehicles.plate_number + ')' : '-'}</div></div>
              <div class="col-md-4"><div style="font-size:12px;color:var(--text-muted)">New Vehicle</div><div style="font-weight:600">${r.new_vehicle ? r.new_vehicle.make + ' ' + r.new_vehicle.model + ' (' + r.new_vehicle.plate_number + ')' : '-'}</div></div>
              <div class="col-md-4"><div style="font-size:12px;color:var(--text-muted)">Priority</div><div>${priorityBadge(r.priority)}</div></div>
              <div class="col-md-4"><div style="font-size:12px;color:var(--text-muted)">Requested By</div><div style="font-weight:600">${r.requested_by || '-'}</div></div>
              <div class="col-md-4"><div style="font-size:12px;color:var(--text-muted)">Date</div><div style="font-weight:600">${formatDate(r.created_at)}</div></div>
              <div class="col-12"><div style="font-size:12px;color:var(--text-muted)">Reason</div><div>${r.reason || '-'}</div></div>
              <div class="col-12"><div style="font-size:12px;color:var(--text-muted)">Notes</div><div>${r.notes || '-'}</div></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
  document.getElementById('backBtn').addEventListener('click', () => renderReplacement());
}

function renderFormView(container, existing) {
  const isEdit = !!existing;
  container.innerHTML = `
    <div class="fade-in">
      <div class="page-section" style="padding-top:32px">
        <div style="display:flex;align-items:center;gap:16px;margin-bottom:24px">
          <button class="btn-secondary-gray" id="backBtn" style="padding:8px 14px"><i class="bi bi-arrow-left"></i></button>
          <h1 style="font-size:24px;font-weight:700;margin:0">${isEdit ? 'Edit' : 'Add'} Replacement Request</h1>
        </div>
        <div class="form-card" style="border-top:4px solid var(--primary)">
          <div class="form-card-body">
            <div class="row g-3">
              <div class="col-md-6">
                <label class="form-label">Agreement <span class="required">*</span></label>
                <select class="form-select" id="rAgreement">
                  <option value="">Select Agreement</option>
                  ${agreementsList.map(a => `<option value="${a.id}" ${existing && existing.agreement_id === a.id ? 'selected' : ''}>${a.agreement_number} - ${a.client_name}</option>`).join('')}
                </select>
              </div>
              <div class="col-md-6">
                <label class="form-label">Old Vehicle <span class="required">*</span></label>
                <select class="form-select" id="rVehicle">
                  <option value="">Select Vehicle</option>
                  ${vehiclesList.map(v => `<option value="${v.id}" ${existing && existing.vehicle_id === v.id ? 'selected' : ''}>${v.plate_number} - ${v.make} ${v.model}</option>`).join('')}
                </select>
              </div>
              <div class="col-md-6">
                <label class="form-label">Priority</label>
                <select class="form-select" id="rPriority">
                  ${['low','medium','high','urgent'].map(p => `<option value="${p}" ${(existing?.priority || 'medium') === p ? 'selected' : ''}>${p.charAt(0).toUpperCase()+p.slice(1)}</option>`).join('')}
                </select>
              </div>
              <div class="col-md-6">
                <label class="form-label">Status</label>
                <select class="form-select" id="rStatus">
                  ${['pending','approved','rejected','completed'].map(s => `<option value="${s}" ${(existing?.status || 'pending') === s ? 'selected' : ''}>${s.charAt(0).toUpperCase()+s.slice(1)}</option>`).join('')}
                </select>
              </div>
              <div class="col-md-6" id="newVehicleWrap">
                <label class="form-label">New Vehicle</label>
                <select class="form-select" id="rNewVehicle">
                  <option value="">Select New Vehicle</option>
                  ${vehiclesList.map(v => `<option value="${v.id}" ${existing && existing.new_vehicle_id === v.id ? 'selected' : ''}>${v.plate_number} - ${v.make} ${v.model}</option>`).join('')}
                </select>
                <small class="text-muted">Only applies when status is Approved</small>
              </div>
              <div class="col-md-6">
                <label class="form-label">Requested By</label>
                <input type="text" class="form-control" id="rRequestedBy" value="${existing?.requested_by || ''}">
              </div>
              <div class="col-12">
                <label class="form-label">Reason <span class="required">*</span></label>
                <textarea class="form-control" id="rReason" rows="2">${existing?.reason || ''}</textarea>
              </div>
              <div class="col-12">
                <label class="form-label">Notes</label>
                <textarea class="form-control" id="rNotes" rows="2">${existing?.notes || ''}</textarea>
              </div>
            </div>
            <div style="display:flex;gap:12px;justify-content:flex-end;margin-top:20px">
              <button class="btn-secondary-gray" id="cancelBtn">Cancel</button>
              <button class="btn-primary-green" id="saveBtn"><i class="bi bi-check-lg"></i> Save</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  document.getElementById('backBtn').addEventListener('click', () => renderReplacement());
  document.getElementById('cancelBtn').addEventListener('click', () => renderReplacement());
  document.getElementById('saveBtn').addEventListener('click', async () => {
    const payload = {
      agreement_id: document.getElementById('rAgreement').value || null,
      vehicle_id: document.getElementById('rVehicle').value || null,
      new_vehicle_id: document.getElementById('rNewVehicle').value || null,
      reason: document.getElementById('rReason').value,
      priority: document.getElementById('rPriority').value,
      status: document.getElementById('rStatus').value,
      requested_by: document.getElementById('rRequestedBy').value,
      notes: document.getElementById('rNotes').value
    };
    if (!payload.vehicle_id || !payload.reason) { showToast('Please fill required fields', 'error'); return; }

    let error;
    if (isEdit) { ({ error } = await supabase.from('replacement_requests').update(payload).eq('id', existing.id)); }
    else { ({ error } = await supabase.from('replacement_requests').insert(payload)); }
    if (error) { showToast(error.message, 'error'); return; }
    showToast(isEdit ? 'Request updated' : 'Request submitted');
    renderReplacement();
  });
}
