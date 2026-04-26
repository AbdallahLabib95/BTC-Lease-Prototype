import { supabase } from '../supabase-client.js';
import { statusBadge, formatDate, showToast, loadingSpinner, emptyState } from '../utils.js';

let allItems = [];
let agreementsList = [];
let driversList = [];

export async function renderDrivers(options = {}) {
  const container = document.getElementById('pageContent');
  container.innerHTML = loadingSpinner();

  const [
    { data: items, error: itemsError },
    { data: agreements, error: agreementsError },
    { data: vehicles, error: vehiclesError }
  ] = await Promise.all([
    supabase
      .from('driver_replacements')
      .select('*')
      .order('created_at', { ascending: false }),
    supabase
      .from('agreements')
      .select('id, agreement_number, client_name')
      .order('agreement_number'),
    supabase
      .from('vehicles')
      .select('assigned_driver')
  ]);

  if (itemsError) showToast(itemsError.message || 'Failed to load driver replacements', 'error');
  if (agreementsError) showToast(agreementsError.message || 'Failed to load agreements', 'error');
  if (vehiclesError) showToast(vehiclesError.message || 'Failed to load drivers', 'error');

  allItems = items || [];
  agreementsList = agreements || [];
  driversList = buildDriversList(allItems, vehicles || []);

  const view = options.view || 'list';
  const existing = options.id ? findDriverReplacementById(options.id) : null;

  if ((view === 'detail' || view === 'form') && options.id && !existing) {
    showToast('Driver replacement request not found', 'error');
    container.innerHTML = buildListPage(allItems);
    bindListEvents();
    return;
  }

  if (view === 'form') {
    container.innerHTML = buildFormPage(existing);
    bindFormEvents(existing);
    return;
  }

  if (view === 'detail') {
    container.innerHTML = buildDetailPage(existing);
    bindDetailEvents(existing);
    return;
  }

  container.innerHTML = buildListPage(allItems);
  bindListEvents();
}

function findDriverReplacementById(id) {
  return allItems.find(item => String(item.id) === String(id));
}

function buildDriversList(items, vehicles) {
  const names = [
    ...vehicles.map(v => v?.assigned_driver),
    ...items.map(i => i?.current_driver),
    ...items.map(i => i?.new_driver)
  ]
    .map(v => (v || '').trim())
    .filter(Boolean);

  return [...new Set(names)].sort((a, b) => a.localeCompare(b));
}

function getAgreementById(id) {
  return agreementsList.find(a => String(a.id) === String(id));
}

function buildListPage(items) {
  return `
    <div class="fade-in">
      <div class="page-hero">
        <h1>Replace Driver</h1>
        <p>Manage driver replacement requests</p>
      </div>

      <div class="page-section">
        <div class="data-card">
          <div class="data-card-header" style="display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap">
            <h3>Driver Replacement Requests</h3>
            <button type="button" class="btn-primary-green" id="addDriverBtn">
              <i class="bi bi-plus-lg me-1"></i>Add
            </button>
          </div>

          <div class="data-card-body">
            <div class="search-filter-bar mb-3">
              <div class="search-input-group">
                <i class="bi bi-search"></i>
                <input type="text" class="form-control" id="driverSearch" placeholder="Search...">
              </div>

              <select class="form-select filter-select" id="driverStatusFilter">
                <option value="">All Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>

          <div class="table-container" id="driverTableContainer">${buildTable(items)}</div>
        </div>
      </div>
    </div>
  `;
}

function buildTable(items) {
  if (!items.length) {
    return `
      <div class="data-card-body">
        ${emptyState('bi-person-badge', 'No Driver Replacements', 'Request a driver replacement when needed.')}
      </div>
    `;
  }

  return `
    <table class="data-table">
      <thead>
        <tr>
          <th>Agreement</th>
          <th>Driver</th>
          <th>Reason</th>
          <th>Status</th>
          <th>Date</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        ${items.map(item => {
          const agreement = getAgreementById(item.agreement_id);
          return `
            <tr>
              <td>
                ${agreement
                  ? `<strong>${escapeHtml(agreement.agreement_number)}</strong><br><small class="text-muted">${escapeHtml(agreement.client_name)}</small>`
                  : '-'}
              </td>
              <td>${escapeHtml(item.new_driver || item.current_driver || '-')}</td>
              <td><small>${escapeHtml(item.reason || '-')}</small></td>
              <td>${statusBadge(item.status || 'pending')}</td>
              <td>${formatDate(item.created_at)}</td>
              <td>
                <button class="btn-icon edit" data-view="${item.id}" title="View"><i class="bi bi-eye"></i></button>
                <button class="btn-icon edit" data-edit="${item.id}" title="Edit"><i class="bi bi-pencil"></i></button>
                <button class="btn-icon delete" data-delete="${item.id}" title="Delete"><i class="bi bi-trash"></i></button>
              </td>
            </tr>
          `;
        }).join('')}
      </tbody>
    </table>
  `;
}

function buildFormPage(existing = null) {
  const isEdit = !!existing;

  return `
    <div class="fade-in">
      <div class="page-hero">
        <h1>${isEdit ? 'Edit Driver Replacement' : 'New Driver Replacement'}</h1>
        <p>${isEdit ? 'Update the driver replacement request' : 'Create a new driver replacement request'}</p>
      </div>

      <div class="page-section">
        <div class="data-card">
          <div class="data-card-header" style="display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap">
            <h3>${isEdit ? 'Edit Request' : 'Driver Replacement Form'}</h3>
            <button type="button" class="btn-secondary-gray" id="backToDriversBtn">
              <i class="bi bi-arrow-left me-1"></i>Back
            </button>
          </div>

          <div class="data-card-body">
            <form id="driverPageForm">
              <div class="mb-3">
                <label class="form-label">Agreement <span class="required">*</span></label>
                <select class="form-select" id="dAgreement" required>
                  <option value="">Select Agreement</option>
                  ${agreementsList.map(a => `
                    <option value="${a.id}" ${existing && String(existing.agreement_id) === String(a.id) ? 'selected' : ''}>
                      ${escapeHtml(a.agreement_number)} - ${escapeHtml(a.client_name)}
                    </option>
                  `).join('')}
                </select>
              </div>

              <div class="mb-3">
                <label class="form-label">Driver <span class="required">*</span></label>
                <select class="form-select" id="dDriver" required>
                  <option value="">Select Driver</option>
                  ${
                    driversList.length
                      ? driversList.map(driver => `
                          <option value="${escapeHtml(driver)}" ${(existing && (existing.new_driver || existing.current_driver) === driver) ? 'selected' : ''}>
                            ${escapeHtml(driver)}
                          </option>
                        `).join('')
                      : '<option value="" disabled>No drivers found</option>'
                  }
                </select>
              </div>

              <div class="mb-3">
                <label class="form-label">Reason <span class="required">*</span></label>
                <textarea class="form-control" id="dReason" rows="3" placeholder="Enter reason" required>${escapeHtml(existing?.reason || '')}</textarea>
              </div>

              <div class="d-flex justify-content-end gap-2 mt-4">
                <button type="button" class="btn-secondary-gray" id="cancelDriverBtn">Cancel</button>
                <button type="submit" class="btn-primary-green" id="saveDriverBtn">
                  <i class="bi bi-check2 me-1"></i>${isEdit ? 'Update' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  `;
}

function buildDetailPage(item) {
  const agreement = getAgreementById(item.agreement_id);

  return `
    <div class="fade-in">
      <div class="page-hero">
        <h1>Driver Replacement Details</h1>
        <p>Review the request information</p>
      </div>

      <div class="page-section">
        <div class="data-card">
          <div class="data-card-header" style="display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap">
            <h3>Request Information</h3>
            <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
              ${statusBadge(item.status || 'pending')}
              <button type="button" class="btn-primary-green" id="editDriverBtn">
                <i class="bi bi-pencil me-1"></i>Edit
              </button>
              <button type="button" class="btn-secondary-gray" id="backToDriversBtn">
                <i class="bi bi-arrow-left me-1"></i>Back
              </button>
            </div>
          </div>

          <div class="data-card-body">
            <div class="row g-3">
              <div class="col-md-6">
                <div style="font-size:12px;color:var(--text-muted)">Agreement</div>
                <div style="font-weight:600">
                  ${agreement ? `${escapeHtml(agreement.agreement_number)} - ${escapeHtml(agreement.client_name)}` : '-'}
                </div>
              </div>

              <div class="col-md-6">
                <div style="font-size:12px;color:var(--text-muted)">Driver</div>
                <div style="font-weight:600">${escapeHtml(item.new_driver || item.current_driver || '-')}</div>
              </div>

              <div class="col-md-6">
                <div style="font-size:12px;color:var(--text-muted)">Status</div>
                <div>${statusBadge(item.status || 'pending')}</div>
              </div>

              <div class="col-md-6">
                <div style="font-size:12px;color:var(--text-muted)">Date</div>
                <div style="font-weight:600">${formatDate(item.created_at)}</div>
              </div>

              <div class="col-12">
                <div style="font-size:12px;color:var(--text-muted)">Reason</div>
                <div>${escapeHtml(item.reason || '-')}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

function bindListEvents() {
  const addBtn = document.getElementById('addDriverBtn');
  const searchInput = document.getElementById('driverSearch');
  const statusFilter = document.getElementById('driverStatusFilter');

  if (addBtn) {
    addBtn.addEventListener('click', () => renderDrivers({ view: 'form' }));
  }

  if (searchInput) {
    searchInput.addEventListener('input', filterRender);
  }

  if (statusFilter) {
    statusFilter.addEventListener('change', filterRender);
  }

  bindTableActions();
}

function bindTableActions() {
  document.querySelectorAll('#driverTableContainer [data-view]').forEach(btn => {
    btn.addEventListener('click', () => {
      renderDrivers({ view: 'detail', id: btn.dataset.view });
    });
  });

  document.querySelectorAll('#driverTableContainer [data-edit]').forEach(btn => {
    btn.addEventListener('click', () => {
      renderDrivers({ view: 'form', id: btn.dataset.edit });
    });
  });

  document.querySelectorAll('#driverTableContainer [data-delete]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const result = await window.Swal.fire({
        title: 'Delete this request?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#dc3545',
        confirmButtonText: 'Delete',
        cancelButtonText: 'Cancel'
      });

      if (!result.isConfirmed) return;

      const { error } = await supabase
        .from('driver_replacements')
        .delete()
        .eq('id', btn.dataset.delete);

      if (error) {
        showToast(error.message || 'Failed to delete request', 'error');
        return;
      }

      showToast('Request deleted');
      renderDrivers();
    });
  });
}

function bindFormEvents(existing = null) {
  const backBtn = document.getElementById('backToDriversBtn');
  const cancelBtn = document.getElementById('cancelDriverBtn');
  const form = document.getElementById('driverPageForm');

  if (backBtn) {
    backBtn.addEventListener('click', () => {
      if (existing) renderDrivers({ view: 'detail', id: existing.id });
      else renderDrivers();
    });
  }

  if (cancelBtn) {
    cancelBtn.addEventListener('click', () => {
      if (existing) renderDrivers({ view: 'detail', id: existing.id });
      else renderDrivers();
    });
  }

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      await handleSave(existing);
    });
  }
}

function bindDetailEvents(existing) {
  const backBtn = document.getElementById('backToDriversBtn');
  const editBtn = document.getElementById('editDriverBtn');

  if (backBtn) {
    backBtn.addEventListener('click', () => renderDrivers());
  }

  if (editBtn && existing) {
    editBtn.addEventListener('click', () => renderDrivers({ view: 'form', id: existing.id }));
  }
}

async function handleSave(existing = null) {
  const saveBtn = document.getElementById('saveDriverBtn');
  const agreementId = document.getElementById('dAgreement').value;
  const driver = document.getElementById('dDriver').value;
  const reason = document.getElementById('dReason').value.trim();

  if (!agreementId || !driver || !reason) {
    showToast('Please fill in all required fields', 'error');
    return;
  }

  if (saveBtn) {
    saveBtn.disabled = true;
    saveBtn.innerHTML = `<i class="bi bi-hourglass-split me-1"></i>${existing ? 'Updating...' : 'Saving...'}`;
  }

  const payload = {
    agreement_id: agreementId,
    new_driver: driver,
    reason
  };

  let error;

  if (existing) {
    ({ error } = await supabase
      .from('driver_replacements')
      .update(payload)
      .eq('id', existing.id));
  } else {
    payload.status = 'pending';
    ({ error } = await supabase
      .from('driver_replacements')
      .insert([payload]));
  }

  if (error) {
    showToast(error.message || `Failed to ${existing ? 'update' : 'create'} driver replacement`, 'error');

    if (saveBtn) {
      saveBtn.disabled = false;
      saveBtn.innerHTML = `<i class="bi bi-check2 me-1"></i>${existing ? 'Update' : 'Save'}`;
    }

    return;
  }

  showToast(existing ? 'Driver replacement updated' : 'Driver replacement created');
  renderDrivers();
}

function filterRender() {
  const q = (document.getElementById('driverSearch')?.value || '').toLowerCase();
  const st = document.getElementById('driverStatusFilter')?.value || '';

  const filtered = allItems.filter(item => {
    const agreement = getAgreementById(item.agreement_id);

    const text = `
      ${item.new_driver || ''}
      ${item.current_driver || ''}
      ${item.reason || ''}
      ${agreement ? agreement.agreement_number : ''}
      ${agreement ? agreement.client_name : ''}
    `.toLowerCase();

    return (!q || text.includes(q)) && (!st || (item.status || 'pending') === st);
  });

  const tableContainer = document.getElementById('driverTableContainer');
  if (tableContainer) {
    tableContainer.innerHTML = buildTable(filtered);
    bindTableActions();
  }
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}