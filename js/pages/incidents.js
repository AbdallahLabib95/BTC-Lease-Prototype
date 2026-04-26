import { supabase } from '../supabase-client.js';
import { statusBadge, severityBadge, formatDate, formatCurrency, showToast, loadingSpinner, emptyState } from '../utils.js';

let allItems = [];
let vehiclesList = [];
let filepondInstances = [];
let attachmentsMeta = [];

const CITY_OPTIONS = ['Riyadh', 'Jeddah', 'Dammam', 'Makkah', 'Madinah', 'Al Khobar', 'Jubail', 'Tabuk', 'Abha', 'Hail'];

export async function renderIncidents() {
  const container = document.getElementById('pageContent');
  container.innerHTML = loadingSpinner();

  const [{ data: items }, { data: vehicles }] = await Promise.all([
    supabase.from('incidents').select('*, vehicles(plate_number, make, model)').order('created_at', { ascending: false }),
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
        <h1>Incident Coverage</h1>
        <p>Report and track vehicle incidents and insurance claims</p>
      </div>
      <div class="page-section">
        <div class="data-card">
          <div class="data-card-header" style="display:flex;align-items:center;justify-content:space-between">
            <h3>Incident Coverage Management</h3>
            <button class="btn-primary-green" id="addIncBtn"><i class="bi bi-plus-lg"></i> Add</button>
          </div>
          <div class="data-card-body">
            <div class="search-filter-bar mb-3">
              <div class="search-input-group">
                <i class="bi bi-search"></i>
                <input type="text" class="form-control" id="incSearch" placeholder="Search incidents...">
              </div>
              <select class="form-select filter-select" id="incStatusFilter">
                <option value="">All Status</option>
                <option value="reported">Reported</option>
                <option value="under_review">Under Review</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </select>
            </div>
          </div>
          <div class="table-container" id="incTableContainer">${buildTable(allItems)}</div>
        </div>
      </div>
    </div>
  `;

  document.getElementById('incSearch').addEventListener('input', filterRender);
  document.getElementById('incStatusFilter').addEventListener('change', filterRender);
  document.getElementById('addIncBtn').addEventListener('click', () => renderFormView(container, null));
  bindTableActions(container);
}

function buildTable(items) {
  if (items.length === 0) return `<div class="data-card-body">${emptyState('bi-shield-exclamation', 'No Incidents', 'No incidents have been reported.')}</div>`;
  return `
    <table class="data-table">
      <thead><tr><th>Vehicle</th><th>Date</th><th>City</th><th>Accident Place</th><th>Severity</th><th>Description</th><th>Insurance</th><th>Cost</th><th>Status</th><th>Actions</th></tr></thead>
      <tbody>
        ${items.map(i => `
          <tr>
            <td>${i.vehicles ? `${i.vehicles.make} ${i.vehicles.model}<br><small class="text-muted">${i.vehicles.plate_number}</small>` : '-'}</td>
            <td>${formatDate(i.incident_date)}</td>
            <td>${i.city || '-'}</td>
            <td>${i.accident_place || '-'}</td>
            <td>${severityBadge(i.severity)}</td>
            <td style="max-width:200px"><small>${i.description || ''}</small></td>
            <td>${i.insurance_claim ? `<span class="badge-status active">Yes</span><br><small>${i.claim_number || ''}</small>` : '<span class="text-muted">No</span>'}</td>
            <td>${formatCurrency(i.estimated_cost)}</td>
            <td>${statusBadge(i.status)}</td>
            <td>
              <button class="btn-icon edit" data-view="${i.id}" title="View"><i class="bi bi-eye"></i></button>
              <button class="btn-icon edit" data-edit="${i.id}" title="Edit"><i class="bi bi-pencil"></i></button>
              <button class="btn-icon delete" data-delete="${i.id}" title="Delete"><i class="bi bi-trash"></i></button>
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>`;
}

function filterRender() {
  const container = document.getElementById('pageContent');
  const q = (document.getElementById('incSearch').value || '').toLowerCase();
  const st = document.getElementById('incStatusFilter').value;
  const filtered = allItems.filter(i => {
    const text = `${i.description || ''} ${i.claim_number || ''} ${i.city || ''} ${i.accident_place || ''} ${i.vehicles ? i.vehicles.plate_number + ' ' + i.vehicles.make : ''}`.toLowerCase();
    return (!q || text.includes(q)) && (!st || i.status === st);
  });
  document.getElementById('incTableContainer').innerHTML = buildTable(filtered);
  bindTableActions(container);
}

function bindTableActions(container) {
  document.querySelectorAll('#incTableContainer [data-view]').forEach(btn => {
    btn.addEventListener('click', () => {
      const r = allItems.find(x => x.id === btn.dataset.view);
      if (r) renderDetailView(container, r);
    });
  });
  document.querySelectorAll('#incTableContainer [data-edit]').forEach(btn => {
    btn.addEventListener('click', () => {
      const r = allItems.find(x => x.id === btn.dataset.edit);
      if (r) renderFormView(container, r);
    });
  });
  document.querySelectorAll('#incTableContainer [data-delete]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const res = await window.Swal.fire({ title: 'Delete this incident?', icon: 'warning', showCancelButton: true, confirmButtonColor: '#dc3545', confirmButtonText: 'Delete', cancelButtonText: 'Cancel' });
      if (!res.isConfirmed) return;
      const { error } = await supabase.from('incidents').delete().eq('id', btn.dataset.delete);
      if (error) { showToast(error.message, 'error'); return; }
      showToast('Incident deleted');
      renderIncidents();
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
          <h1 style="font-size:24px;font-weight:700;margin:0">Incident Details</h1>
          ${statusBadge(r.status)}
        </div>
        <div class="form-card" style="border-top:4px solid var(--primary)">
          <div class="form-card-body">
            <div class="row g-3">
              <div class="col-md-4"><div style="font-size:12px;color:var(--text-muted)">Vehicle</div><div style="font-weight:600">${r.vehicles ? r.vehicles.make + ' ' + r.vehicles.model + ' (' + r.vehicles.plate_number + ')' : '-'}</div></div>
              <div class="col-md-4"><div style="font-size:12px;color:var(--text-muted)">Date</div><div style="font-weight:600">${formatDate(r.incident_date)}</div></div>
              <div class="col-md-4"><div style="font-size:12px;color:var(--text-muted)">City</div><div style="font-weight:600">${r.city || '-'}</div></div>
              <div class="col-md-8"><div style="font-size:12px;color:var(--text-muted)">Accident Place</div><div style="font-weight:600">${r.accident_place || '-'}</div></div>
              <div class="col-md-4"><div style="font-size:12px;color:var(--text-muted)">Severity</div><div>${severityBadge(r.severity)}</div></div>
              <div class="col-12">
                <fieldset class="damage-fieldset">
                  <legend>Damage Types Observed</legend>
                  <div class="damage-check-grid">
                    <label class="damage-check"><input type="checkbox" ${r.damage_types?.engine ? 'checked' : ''} disabled> <span>Is There Any Damage To The Engine?</span></label>
                    <label class="damage-check"><input type="checkbox" ${r.damage_types?.chassis ? 'checked' : ''} disabled> <span>Is There Any Damage To The Chassis?</span></label>
                    <label class="damage-check"><input type="checkbox" ${r.damage_types?.transmission_box ? 'checked' : ''} disabled> <span>Is There Any Damage To The Transmission Box ?</span></label>
                    <label class="damage-check"><input type="checkbox" ${r.damage_types?.can_be_repaired ? 'checked' : ''} disabled> <span>Can It Be Repaired ?</span></label>
                  </div>
                </fieldset>
              </div>
              <div class="col-12"><div style="font-size:12px;color:var(--text-muted)">Notes</div><div>${r.notes || '-'}</div></div>
              <div class="col-12"><div style="font-size:12px;color:var(--text-muted)">Description</div><div>${r.description || '-'}</div></div>
              ${attachments.length ? `<div class="col-12"><div style="font-size:12px;color:var(--text-muted);margin-bottom:8px">Attachments</div>${attachments.map(a => `<span class="badge-status available" style="margin-right:6px"><i class="bi bi-paperclip"></i> ${a.name}</span>`).join('')}</div>` : ''}
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
  document.getElementById('backBtn').addEventListener('click', () => renderIncidents());
}

function renderFormView(container, existing) {
  const isEdit = !!existing;
  attachmentsMeta = isEdit && Array.isArray(existing.attachments) ? [...existing.attachments] : [];

  container.innerHTML = `
    <div class="fade-in">
      <div class="page-section" style="padding-top:32px">
        <div style="display:flex;align-items:center;gap:16px;margin-bottom:24px">
          <button class="btn-secondary-gray" id="backBtn" style="padding:8px 14px"><i class="bi bi-arrow-left"></i></button>
          <h1 style="font-size:24px;font-weight:700;margin:0">${isEdit ? 'Edit' : 'Add'} Incident</h1>
        </div>
        <div class="form-card" style="border-top:4px solid var(--primary)">
          <div class="form-card-body">
            <div class="row g-3">
              <div class="col-md-6">
                <label class="form-label">Vehicle <span class="required">*</span></label>
                <select class="form-select" id="iVehicle">
                  <option value="">Select Vehicle</option>
                  ${vehiclesList.map(v => `<option value="${v.id}" ${existing && existing.vehicle_id === v.id ? 'selected' : ''}>${v.plate_number} - ${v.make} ${v.model}</option>`).join('')}
                </select>
              </div>
              <div class="col-md-6">
                <label class="form-label">City <span class="required">*</span></label>
                <select class="form-select" id="iCity">
                  <option value="">Select City</option>
                  ${CITY_OPTIONS.map(c => `<option value="${c}" ${existing && existing.city === c ? 'selected' : ''}>${c}</option>`).join('')}
                </select>
              </div>
              <div class="col-md-8">
                <label class="form-label">Accident Place <span class="required">*</span></label>
                <input type="text" class="form-control" id="iPlace" value="${existing?.accident_place || ''}" placeholder="e.g. King Fahd Rd near Exit 12">
              </div>
              <div class="col-md-4">
                <label class="form-label">Date <span class="required">*</span></label>
                <input type="date" class="form-control" id="iDate" value="${existing?.incident_date || ''}">
              </div>
              <div class="col-12">
                <fieldset class="damage-fieldset">
                  <legend>Damage Types Observed</legend>
                  <div class="damage-check-grid">
                    <label class="damage-check"><input type="checkbox" id="dmgEngine" ${existing?.damage_types?.engine ? 'checked' : ''}> <span>Is There Any Damage To The Engine?</span></label>
                    <label class="damage-check"><input type="checkbox" id="dmgChassis" ${existing?.damage_types?.chassis ? 'checked' : ''}> <span>Is There Any Damage To The Chassis?</span></label>
                    <label class="damage-check"><input type="checkbox" id="dmgTransmission" ${existing?.damage_types?.transmission_box ? 'checked' : ''}> <span>Is There Any Damage To The Transmission Box ?</span></label>
                    <label class="damage-check"><input type="checkbox" id="dmgRepairable" ${existing?.damage_types?.can_be_repaired ? 'checked' : ''}> <span>Can It Be Repaired ?</span></label>
                  </div>
                </fieldset>
              </div>
              <div class="col-12">
                <label class="form-label">Notes</label>
                <textarea class="form-control" id="iNotes" rows="3">${existing?.notes || ''}</textarea>
              </div>
              <div class="col-12">
                <label class="form-label">Attachments</label>
                <input type="file" class="filepond" id="iAttach" multiple />
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

  initFilePond('iAttach', attachmentsMeta);

  document.getElementById('backBtn').addEventListener('click', () => renderIncidents());
  document.getElementById('cancelBtn').addEventListener('click', () => renderIncidents());
  document.getElementById('saveBtn').addEventListener('click', async () => {
    const damage_types = {
      engine: document.getElementById('dmgEngine').checked,
      chassis: document.getElementById('dmgChassis').checked,
      transmission_box: document.getElementById('dmgTransmission').checked,
      can_be_repaired: document.getElementById('dmgRepairable').checked
    };
    const payload = {
      vehicle_id: document.getElementById('iVehicle').value || null,
      city: document.getElementById('iCity').value,
      accident_place: document.getElementById('iPlace').value,
      incident_date: document.getElementById('iDate').value || null,
      notes: document.getElementById('iNotes').value,
      attachments: attachmentsMeta,
      damage_types,
      description: existing?.description || document.getElementById('iNotes').value || 'Incident report',
      incident_type: existing?.incident_type || 'accident',
      severity: existing?.severity || 'minor',
      status: existing?.status || 'reported'
    };
    if (!payload.vehicle_id || !payload.city || !payload.incident_date) { showToast('Please fill required fields', 'error'); return; }

    let error;
    if (isEdit) { ({ error } = await supabase.from('incidents').update(payload).eq('id', existing.id)); }
    else { ({ error } = await supabase.from('incidents').insert(payload)); }
    if (error) { showToast(error.message, 'error'); return; }
    cleanupFilePond();
    showToast(isEdit ? 'Incident updated' : 'Incident reported');
    renderIncidents();
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
