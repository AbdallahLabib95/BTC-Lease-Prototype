import { supabase } from '../supabase-client.js';
import { statusBadge, formatDate, formatCurrency, showToast, loadingSpinner, emptyState } from '../utils.js';

let allItems = [];
let vehiclesList = [];
let filepondInstances = [];
let attachmentsMeta = [];

export async function renderMaintenance() {
  const container = document.getElementById('pageContent');
  container.innerHTML = loadingSpinner();

  const [{ data: items }, { data: vehicles }] = await Promise.all([
    supabase.from('maintenance_schedules').select('*, vehicles(plate_number, make, model)').order('scheduled_date', { ascending: true }),
    supabase.from('vehicles').select('id, plate_number, make, model')
  ]);
  allItems = items || [];
  vehiclesList = vehicles || [];

  renderListView(container);
}

function cleanupFilePond() {
  filepondInstances.forEach(i => { try { i.destroy(); } catch (e) {} });
  filepondInstances = [];
}

function renderListView(container) {
  cleanupFilePond();
  container.innerHTML = `
    <div class="fade-in">
      <div class="page-hero">
        <h1>Scheduled Maintenance</h1>
        <p>Track and manage vehicle maintenance schedules</p>
      </div>
      <div class="page-section">
        <div class="data-card">
          <div class="data-card-header" style="display:flex;align-items:center;justify-content:space-between">
            <h3>Maintenance Records</h3>
            <button class="btn-primary-green" id="addMaintBtn"><i class="bi bi-plus-lg"></i> Add</button>
          </div>
          <div class="data-card-body">
            <div class="search-filter-bar mb-3">
              <div class="search-input-group">
                <i class="bi bi-search"></i>
                <input type="text" class="form-control" id="maintSearch" placeholder="Search...">
              </div>
              <select class="form-select filter-select" id="maintStatusFilter">
                <option value="">All Status</option>
                <option value="scheduled">Scheduled</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>
          <div class="table-container" id="maintTableContainer">${buildTable(allItems)}</div>
        </div>
      </div>
    </div>
  `;

  document.getElementById('maintSearch').addEventListener('input', filterRender);
  document.getElementById('maintStatusFilter').addEventListener('change', filterRender);
  document.getElementById('addMaintBtn').addEventListener('click', () => renderFormView(container, null));
  bindTableActions(container);
}

function buildTable(items) {
  if (items.length === 0) return `<div class="data-card-body">${emptyState('bi-wrench-adjustable', 'No Maintenance Scheduled', 'Schedule maintenance for your vehicles.')}</div>`;
  return `
    <table class="data-table">
      <thead><tr><th>Vehicle</th><th>Date</th><th>Status</th><th>Cost</th><th>Notes</th><th>Actions</th></tr></thead>
      <tbody>
        ${items.map(m => `
          <tr>
            <td>${m.vehicles ? `${m.vehicles.make} ${m.vehicles.model}<br><small class="text-muted">${m.vehicles.plate_number}</small>` : '-'}</td>
            <td>${formatDate(m.scheduled_date)}</td>
            <td>${statusBadge(m.status)}</td>
            <td>${formatCurrency(m.cost)}</td>
            <td><small>${m.notes || '-'}</small></td>
            <td>
              <button class="btn-icon edit" data-view="${m.id}" title="View"><i class="bi bi-eye"></i></button>
              <button class="btn-icon edit" data-edit="${m.id}" title="Edit"><i class="bi bi-pencil"></i></button>
              <button class="btn-icon delete" data-delete="${m.id}" title="Delete"><i class="bi bi-trash"></i></button>
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>`;
}

function filterRender() {
  const container = document.getElementById('pageContent');
  const q = (document.getElementById('maintSearch').value || '').toLowerCase();
  const st = document.getElementById('maintStatusFilter').value;
  const filtered = allItems.filter(m => {
    const text = `${m.maintenance_type || ''} ${m.notes || ''} ${m.vehicles ? m.vehicles.plate_number + ' ' + m.vehicles.make + ' ' + m.vehicles.model : ''}`.toLowerCase();
    return (!q || text.includes(q)) && (!st || m.status === st);
  });
  document.getElementById('maintTableContainer').innerHTML = buildTable(filtered);
  bindTableActions(container);
}

function bindTableActions(container) {
  document.querySelectorAll('#maintTableContainer [data-view]').forEach(btn => {
    btn.addEventListener('click', () => {
      const r = allItems.find(x => x.id === btn.dataset.view);
      if (r) renderDetailView(container, r);
    });
  });
  document.querySelectorAll('#maintTableContainer [data-edit]').forEach(btn => {
    btn.addEventListener('click', () => {
      const r = allItems.find(x => x.id === btn.dataset.edit);
      if (r) renderFormView(container, r);
    });
  });
  document.querySelectorAll('#maintTableContainer [data-delete]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const res = await window.Swal.fire({ title: 'Delete this maintenance record?', icon: 'warning', showCancelButton: true, confirmButtonColor: '#dc3545', confirmButtonText: 'Delete', cancelButtonText: 'Cancel' });
      if (!res.isConfirmed) return;
      const { error } = await supabase.from('maintenance_schedules').delete().eq('id', btn.dataset.delete);
      if (error) { showToast(error.message, 'error'); return; }
      showToast('Maintenance deleted');
      renderMaintenance();
    });
  });
}

function renderDetailView(container, r) {
  const attachments = Array.isArray(r.attachments) ? r.attachments : [];
  container.innerHTML = `
    <div class="fade-in">
      <div class="page-section" style="padding-top:32px">
        <div style="display:flex;align-items:center;gap:16px;margin-bottom:24px">
          <button class="btn-secondary-gray" id="backBtn" style="padding:8px 14px"><i class="bi bi-arrow-left"></i></button>
          <h1 style="font-size:24px;font-weight:700;margin:0">Maintenance Details</h1>
          ${statusBadge(r.status)}
        </div>
        <div class="form-card" style="border-top:4px solid var(--primary)">
          <div class="form-card-body">
            <div class="row g-3">
              <div class="col-md-6"><div style="font-size:12px;color:var(--text-muted)">Vehicle</div><div style="font-weight:600">${r.vehicles ? r.vehicles.make + ' ' + r.vehicles.model + ' (' + r.vehicles.plate_number + ')' : '-'}</div></div>
              <div class="col-md-6"><div style="font-size:12px;color:var(--text-muted)">Date</div><div style="font-weight:600">${formatDate(r.scheduled_date)}</div></div>
              <div class="col-12"><div style="font-size:12px;color:var(--text-muted)">Notes</div><div>${r.notes || '-'}</div></div>
              ${attachments.length ? `<div class="col-12"><div style="font-size:12px;color:var(--text-muted);margin-bottom:8px">Attachments</div>${attachments.map(a => `<span class="badge-status available" style="margin-right:6px"><i class="bi bi-paperclip"></i> ${a.name}</span>`).join('')}</div>` : ''}
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
  document.getElementById('backBtn').addEventListener('click', () => renderMaintenance());
}

function renderFormView(container, existing) {
  const isEdit = !!existing;
  attachmentsMeta = isEdit && Array.isArray(existing.attachments) ? [...existing.attachments] : [];

  container.innerHTML = `
    <div class="fade-in">
      <div class="page-section" style="padding-top:32px">
        <div style="display:flex;align-items:center;gap:16px;margin-bottom:24px">
          <button class="btn-secondary-gray" id="backBtn" style="padding:8px 14px"><i class="bi bi-arrow-left"></i></button>
          <h1 style="font-size:24px;font-weight:700;margin:0">${isEdit ? 'Edit' : 'Add'} Maintenance</h1>
        </div>
        <div class="form-card" style="border-top:4px solid var(--primary)">
          <div class="form-card-body">
            <div class="row g-3">
              <div class="col-md-6">
                <label class="form-label">Vehicle <span class="required">*</span></label>
                <select class="form-select" id="mVehicle">
                  <option value="">Select Vehicle</option>
                  ${vehiclesList.map(v => `<option value="${v.id}" ${existing && existing.vehicle_id === v.id ? 'selected' : ''}>${v.plate_number} - ${v.make} ${v.model}</option>`).join('')}
                </select>
              </div>
              <div class="col-md-6">
                <label class="form-label">Date <span class="required">*</span></label>
                <input type="date" class="form-control" id="mDate" value="${existing?.scheduled_date || ''}">
              </div>
              <div class="col-12">
                <label class="form-label">Notes</label>
                <textarea class="form-control" id="mNotes" rows="3">${existing?.notes || ''}</textarea>
              </div>
              <div class="col-12">
                <label class="form-label">Attachments</label>
                <input type="file" class="filepond" id="mAttach" multiple />
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

  initFilePond('mAttach', attachmentsMeta);

  document.getElementById('backBtn').addEventListener('click', () => renderMaintenance());
  document.getElementById('cancelBtn').addEventListener('click', () => renderMaintenance());
  document.getElementById('saveBtn').addEventListener('click', async () => {
    const payload = {
      vehicle_id: document.getElementById('mVehicle').value || null,
      scheduled_date: document.getElementById('mDate').value || null,
      notes: document.getElementById('mNotes').value,
      attachments: attachmentsMeta,
      maintenance_type: existing?.maintenance_type || 'General Service',
      status: existing?.status || 'scheduled',
      cost: existing?.cost ?? 0
    };
    if (!payload.vehicle_id || !payload.scheduled_date) { showToast('Please fill required fields', 'error'); return; }

    let error;
    if (isEdit) { ({ error } = await supabase.from('maintenance_schedules').update(payload).eq('id', existing.id)); }
    else { ({ error } = await supabase.from('maintenance_schedules').insert(payload)); }
    if (error) { showToast(error.message, 'error'); return; }
    cleanupFilePond();
    showToast(isEdit ? 'Maintenance updated' : 'Maintenance scheduled');
    renderMaintenance();
  });
}

function initFilePond(id, metaArr) {
  cleanupFilePond();
  if (typeof window.FilePond === 'undefined') return;
  if (window.FilePondPluginFileValidateType) window.FilePond.registerPlugin(window.FilePondPluginFileValidateType);
  if (window.FilePondPluginImagePreview) window.FilePond.registerPlugin(window.FilePondPluginImagePreview);

  const el = document.getElementById(id);
  if (!el) return;
  const pond = window.FilePond.create(el, {
    labelIdle: 'You can drag and drop <span class="filepond--label-action">Browse</span>',
    allowMultiple: true,
    credits: false
  });
  pond.on('addfile', (err, item) => {
    if (!err && item) metaArr.push({ name: item.filename, size: item.fileSize, type: item.fileType });
  });
  pond.on('removefile', (err, item) => {
    if (err || !item) return;
    const idx = metaArr.findIndex(m => m.name === item.filename);
    if (idx > -1) metaArr.splice(idx, 1);
  });
  filepondInstances.push(pond);
}
