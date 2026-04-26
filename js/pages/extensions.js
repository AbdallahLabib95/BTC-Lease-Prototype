import { supabase } from '../supabase-client.js';
import { statusBadge, formatDate, showToast, loadingSpinner, emptyState } from '../utils.js';

let allItems = [];
let agreementsList = [];

function parseTerms(terms) {
  try {
    return JSON.parse(terms || '{}');
  } catch {
    return {};
  }
}

function escapeHtml(value) {
  return String(value || '')
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}

function toInputDate(value) {
  if (!value) return '';
  try {
    return new Date(value).toISOString().slice(0, 10);
  } catch {
    return '';
  }
}

function calculateDurationDays(startDate, endDate) {
  if (!startDate || !endDate) return 0;

  const start = new Date(startDate);
  const end = new Date(endDate);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 0;

  const diff = end.getTime() - start.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  return days >= 0 ? days : 0;
}

function findRequestById(id) {
  return allItems.find(item => String(item.id) === String(id));
}

function findAgreementById(id) {
  return agreementsList.find(item => String(item.id) === String(id));
}

function getAgreementForRequest(item) {
  return item?.agreements || findAgreementById(item?.agreement_id);
}

function getVehicleText(agreement) {
  const t = parseTerms(agreement?.terms);
  const vehicleType = t.type || t.category || t.body_type || t.vehicle_type || '';
  return `${t.make || '-'} ${t.model || '-'}${vehicleType ? ` - ${vehicleType}` : ''}`;
}

function getPlateText(agreement) {
  const t = parseTerms(agreement?.terms);
  return t.plate || '-';
}

function getDuration(item) {
  return calculateDurationDays(item?.pickup_date, item?.return_date);
}

function buildVehicleCard(agreement) {
  if (!agreement) {
    return `
      <div class="agreement-request-vehicle-card">
        <div class="agreement-request-vehicle-icon">
          <i class="bi bi-car-front-fill"></i>
        </div>
        <div>
          <div style="font-size:22px;font-weight:700;color:#111827;margin-bottom:8px">Select Agreement</div>
          <div style="font-size:16px;color:#6b7280">Choose an agreement to load vehicle details.</div>
        </div>
      </div>
    `;
  }

  return `
    <div class="agreement-request-vehicle-card">
      <div class="agreement-request-vehicle-icon">
        <i class="bi bi-car-front-fill"></i>
      </div>

      <div>
        <div style="font-size:28px;font-weight:700;color:#111827;margin-bottom:8px">
          ${escapeHtml(agreement.agreement_number)}
        </div>
        <div style="font-size:18px;font-weight:600;color:#374151;margin-bottom:10px">
          Vehicle:
          <span style="color:#4b7bd2">${escapeHtml(getVehicleText(agreement))}</span>
        </div>
        <div style="font-size:18px;font-weight:600;color:#374151">
          Plate Number:
          <span style="color:#4b7bd2">${escapeHtml(getPlateText(agreement))}</span>
        </div>
      </div>
    </div>
  `;
}

export async function renderExtensions(options = {}) {
  const container = document.getElementById('pageContent');
  container.innerHTML = loadingSpinner();

  const [
    { data: items, error: itemsError },
    { data: agreements, error: agreementsError }
  ] = await Promise.all([
    supabase
      .from('agreement_extensions')
      .select('*, agreements(id, agreement_number, client_name, start_date, end_date, terms)')
      .order('created_at', { ascending: false }),
    supabase
      .from('agreements')
      .select('id, agreement_number, client_name, start_date, end_date, terms')
      .order('agreement_number')
  ]);

  // Normalize items: map DB columns to UI field names
  // DB has: requested_end_date, reason, new_monthly_rate
  // UI uses: pickup_date, return_date
  const normalizedItems = (items || []).map(item => ({
    ...item,
    pickup_date: item.pickup_date || (item.agreements ? item.agreements.start_date : null),
    return_date: item.return_date || item.requested_end_date || null,
  }));

  if (itemsError) showToast(itemsError.message || 'Failed to load extension requests', 'error');
  if (agreementsError) showToast(agreementsError.message || 'Failed to load agreements', 'error');

  allItems = normalizedItems;
  agreementsList = agreements || [];

  const view = options.view || 'list';
  const existing = options.id ? findRequestById(options.id) : null;

  if ((view === 'detail' || view === 'form') && options.id && !existing) {
    showToast('Extension request not found', 'error');
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

function buildListPage(items) {
  return `
    <style>
      .agreement-request-vehicle-card {
        background: #fff;
        border-radius: 18px;
        border-left: 6px solid #4b7bd2;
        box-shadow: 0 8px 22px rgba(15, 23, 42, 0.06);
        padding: 22px;
        display: flex;
        align-items: center;
        gap: 22px;
        margin-bottom: 24px;
      }

      .agreement-request-vehicle-icon {
        width: 90px;
        height: 90px;
        border-radius: 50%;
        background: #eef4ff;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #1f3b57;
        font-size: 40px;
        flex-shrink: 0;
      }
    </style>

    <div class="fade-in">
      <div class="page-hero">
        <h1>Extend Agreement Requests</h1>
        <p>Manage saved agreement extension requests</p>
      </div>

      <div class="page-section">
        <div class="data-card">
          <div class="data-card-header" style="display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap">
            <h3>Extension Requests</h3>
            <button type="button" class="btn-primary-green" id="addExtensionBtn">
              <i class="bi bi-plus-lg me-1"></i>Add
            </button>
          </div>

          <div class="data-card-body">
            <div class="search-filter-bar mb-3">
              <div class="search-input-group">
                <i class="bi bi-search"></i>
                <input type="text" class="form-control" id="extensionSearch" placeholder="Search...">
              </div>

              <select class="form-select filter-select" id="extensionStatusFilter">
                <option value="">All Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>

          <div class="table-container" id="extensionTableContainer">${buildTable(items)}</div>
        </div>
      </div>
    </div>
  `;
}

function buildTable(items) {
  if (!items.length) {
    return `
      <div class="data-card-body">
        ${emptyState('bi-calendar2-plus', 'No Extension Requests', 'Create a new extend agreement request.')}
      </div>
    `;
  }

  return `
    <table class="data-table">
      <thead>
        <tr>
          <th>Agreement</th>
          <th>Vehicle</th>
          <th>Pickup Date</th>
          <th>Return Date</th>
          <th>Duration</th>
          <th>Status</th>
          <th>Date</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        ${items.map(item => {
          const agreement = getAgreementForRequest(item);
          return `
            <tr>
              <td>
                ${agreement
                  ? `<strong>${escapeHtml(agreement.agreement_number)}</strong><br><small class="text-muted">${escapeHtml(agreement.client_name)}</small>`
                  : '-'}
              </td>
              <td>
                ${agreement
                  ? `${escapeHtml(getVehicleText(agreement))}<br><small class="text-muted">${escapeHtml(getPlateText(agreement))}</small>`
                  : '-'}
              </td>
              <td>${item.pickup_date ? escapeHtml(toInputDate(item.pickup_date)) : '-'}</td>
              <td>${item.return_date ? escapeHtml(toInputDate(item.return_date)) : '-'}</td>
              <td>${getDuration(item)}</td>
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
  const selectedAgreement = existing ? getAgreementForRequest(existing) : null;
  const pickupDate = existing?.pickup_date ? toInputDate(existing.pickup_date) : toInputDate(selectedAgreement?.start_date);
  const returnDate = existing?.return_date ? toInputDate(existing.return_date) : toInputDate(selectedAgreement?.end_date);
  const duration = calculateDurationDays(pickupDate, returnDate);

  return `
    <style>
      .agreement-request-vehicle-card {
        background: #fff;
        border-radius: 18px;
        border-left: 6px solid #4b7bd2;
        box-shadow: 0 8px 22px rgba(15, 23, 42, 0.06);
        padding: 22px;
        display: flex;
        align-items: center;
        gap: 22px;
        margin-bottom: 24px;
      }

      .agreement-request-vehicle-icon {
        width: 90px;
        height: 90px;
        border-radius: 50%;
        background: #eef4ff;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #1f3b57;
        font-size: 40px;
        flex-shrink: 0;
      }
    </style>

    <div class="fade-in">
      <div class="page-hero">
        <h1>${isEdit ? 'Edit Extend Agreement Request' : 'New Extend Agreement Request'}</h1>
        <p>${isEdit ? 'Update the request details' : 'Create a new extend agreement request'}</p>
      </div>

      <div class="page-section">
        <div class="data-card">
          <div class="data-card-header" style="display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap">
            <h3>${isEdit ? 'Edit Request' : 'Extend Agreement Form'}</h3>
            <button type="button" class="btn-secondary-gray" id="backToExtensionsBtn">
              <i class="bi bi-arrow-left me-1"></i>Back
            </button>
          </div>

          <div class="data-card-body">
            <form id="extensionForm">
              <div class="mb-3">
                <label class="form-label">Agreement <span class="required">*</span></label>
                <select class="form-select" id="extensionAgreement" required>
                  <option value="">Select Agreement</option>
                  ${agreementsList.map(agreement => `
                    <option value="${agreement.id}" ${selectedAgreement && String(selectedAgreement.id) === String(agreement.id) ? 'selected' : ''}>
                      ${escapeHtml(agreement.agreement_number)} - ${escapeHtml(agreement.client_name)}
                    </option>
                  `).join('')}
                </select>
              </div>

              <div id="extensionVehicleCard">${buildVehicleCard(selectedAgreement)}</div>

              <div class="row g-3">
                <div class="col-md-4">
                  <label class="form-label">Pickup Date <span class="required">*</span></label>
                  <input type="date" class="form-control" id="extensionPickupDate" value="${pickupDate}" disabled>
                </div>

                <div class="col-md-4">
                  <label class="form-label">Return Date <span class="required">*</span></label>
                  <input type="date" class="form-control" id="extensionReturnDate" value="${returnDate}" required>
                </div>

                <div class="col-md-4">
                  <label class="form-label">Duration <span class="required">*</span></label>
                  <input type="number" class="form-control" id="extensionDuration" value="${duration}" readonly>
                </div>

                <div class="col-md-4">
                  <label class="form-label">Status</label>
                  <select class="form-select" id="extensionStatus">
                    ${['pending', 'approved', 'rejected', 'completed'].map(status => `
                      <option value="${status}" ${(existing?.status || 'pending') === status ? 'selected' : ''}>
                        ${status.charAt(0).toUpperCase() + status.slice(1)}
                      </option>
                    `).join('')}
                  </select>
                </div>
              </div>

              <div class="d-flex justify-content-end gap-2 mt-4">
                <button type="button" class="btn-secondary-gray" id="cancelExtensionBtn">Cancel</button>
                <button type="submit" class="btn-primary-green" id="saveExtensionBtn">
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
  const agreement = getAgreementForRequest(item);

  return `
    <style>
      .agreement-request-vehicle-card {
        background: #fff;
        border-radius: 18px;
        border-left: 6px solid #4b7bd2;
        box-shadow: 0 8px 22px rgba(15, 23, 42, 0.06);
        padding: 22px;
        display: flex;
        align-items: center;
        gap: 22px;
        margin-bottom: 24px;
      }

      .agreement-request-vehicle-icon {
        width: 90px;
        height: 90px;
        border-radius: 50%;
        background: #eef4ff;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #1f3b57;
        font-size: 40px;
        flex-shrink: 0;
      }
    </style>

    <div class="fade-in">
      <div class="page-hero">
        <h1>Extend Agreement Request Details</h1>
        <p>Review the request information</p>
      </div>

      <div class="page-section">
        <div class="data-card">
          <div class="data-card-header" style="display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap">
            <h3>Request Information</h3>
            <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
              ${statusBadge(item.status || 'pending')}
              <button type="button" class="btn-primary-green" id="editExtensionBtn">
                <i class="bi bi-pencil me-1"></i>Edit
              </button>
              <button type="button" class="btn-secondary-gray" id="backToExtensionsBtn">
                <i class="bi bi-arrow-left me-1"></i>Back
              </button>
            </div>
          </div>

          <div class="data-card-body">
            ${buildVehicleCard(agreement)}

            <div class="row g-3">
              <div class="col-md-6">
                <div style="font-size:12px;color:var(--text-muted)">Agreement</div>
                <div style="font-weight:600">
                  ${agreement ? `${escapeHtml(agreement.agreement_number)} - ${escapeHtml(agreement.client_name)}` : '-'}
                </div>
              </div>

              <div class="col-md-6">
                <div style="font-size:12px;color:var(--text-muted)">Status</div>
                <div>${statusBadge(item.status || 'pending')}</div>
              </div>

              <div class="col-md-4">
                <div style="font-size:12px;color:var(--text-muted)">Pickup Date</div>
                <div style="font-weight:600">${item.pickup_date ? escapeHtml(toInputDate(item.pickup_date)) : '-'}</div>
              </div>

              <div class="col-md-4">
                <div style="font-size:12px;color:var(--text-muted)">Return Date</div>
                <div style="font-weight:600">${item.return_date ? escapeHtml(toInputDate(item.return_date)) : '-'}</div>
              </div>

              <div class="col-md-4">
                <div style="font-size:12px;color:var(--text-muted)">Duration</div>
                <div style="font-weight:600">${getDuration(item)}</div>
              </div>

              <div class="col-md-6">
                <div style="font-size:12px;color:var(--text-muted)">Created At</div>
                <div style="font-weight:600">${formatDate(item.created_at)}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

function bindListEvents() {
  const addBtn = document.getElementById('addExtensionBtn');
  const searchInput = document.getElementById('extensionSearch');
  const statusFilter = document.getElementById('extensionStatusFilter');

  if (addBtn) addBtn.addEventListener('click', () => renderExtensions({ view: 'form' }));
  if (searchInput) searchInput.addEventListener('input', filterRender);
  if (statusFilter) statusFilter.addEventListener('change', filterRender);

  bindTableActions();
}

function bindTableActions() {
  document.querySelectorAll('#extensionTableContainer [data-view]').forEach(btn => {
    btn.addEventListener('click', () => renderExtensions({ view: 'detail', id: btn.dataset.view }));
  });

  document.querySelectorAll('#extensionTableContainer [data-edit]').forEach(btn => {
    btn.addEventListener('click', () => renderExtensions({ view: 'form', id: btn.dataset.edit }));
  });

  document.querySelectorAll('#extensionTableContainer [data-delete]').forEach(btn => {
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
        .from('agreement_extensions')
        .delete()
        .eq('id', btn.dataset.delete);

      if (error) {
        showToast(error.message || 'Failed to delete request', 'error');
        return;
      }

      showToast('Extension request deleted');
      renderExtensions();
    });
  });
}

function bindFormEvents(existing = null) {
  const backBtn = document.getElementById('backToExtensionsBtn');
  const cancelBtn = document.getElementById('cancelExtensionBtn');
  const form = document.getElementById('extensionForm');
  const agreementSelect = document.getElementById('extensionAgreement');
  const returnDateInput = document.getElementById('extensionReturnDate');
  const pickupDateInput = document.getElementById('extensionPickupDate');
  const durationInput = document.getElementById('extensionDuration');

  const refreshSelectedAgreement = () => {
    const agreement = findAgreementById(agreementSelect.value);
    const vehicleCard = document.getElementById('extensionVehicleCard');

    if (vehicleCard) {
      vehicleCard.innerHTML = buildVehicleCard(agreement);
    }

    const pickup = toInputDate(agreement?.start_date);
    pickupDateInput.value = pickup;

    if (!existing || String(existing.agreement_id) !== String(agreement?.id)) {
      returnDateInput.value = toInputDate(agreement?.end_date);
    }

    durationInput.value = calculateDurationDays(pickupDateInput.value, returnDateInput.value);
  };

  const refreshDuration = () => {
    durationInput.value = calculateDurationDays(pickupDateInput.value, returnDateInput.value);
  };

  if (backBtn) {
    backBtn.addEventListener('click', () => {
      if (existing) renderExtensions({ view: 'detail', id: existing.id });
      else renderExtensions();
    });
  }

  if (cancelBtn) {
    cancelBtn.addEventListener('click', () => {
      if (existing) renderExtensions({ view: 'detail', id: existing.id });
      else renderExtensions();
    });
  }

  if (agreementSelect) agreementSelect.addEventListener('change', refreshSelectedAgreement);
  if (returnDateInput) {
    returnDateInput.addEventListener('input', refreshDuration);
    returnDateInput.addEventListener('change', refreshDuration);
  }

  if (form) {
    form.addEventListener('submit', async e => {
      e.preventDefault();
      await handleSave(existing);
    });
  }
}

function bindDetailEvents(existing) {
  const backBtn = document.getElementById('backToExtensionsBtn');
  const editBtn = document.getElementById('editExtensionBtn');

  if (backBtn) backBtn.addEventListener('click', () => renderExtensions());
  if (editBtn && existing) editBtn.addEventListener('click', () => renderExtensions({ view: 'form', id: existing.id }));
}

async function handleSave(existing = null) {
  const saveBtn = document.getElementById('saveExtensionBtn');
  const agreementId = document.getElementById('extensionAgreement').value;
  const pickupDate = document.getElementById('extensionPickupDate').value;
  const returnDate = document.getElementById('extensionReturnDate').value;
  const status = document.getElementById('extensionStatus').value;

  if (!agreementId || !returnDate) {
    showToast('Please fill in all required fields', 'error');
    return;
  }

  if (saveBtn) {
    saveBtn.disabled = true;
    saveBtn.innerHTML = `<i class="bi bi-hourglass-split me-1"></i>${existing ? 'Updating...' : 'Saving...'}`;
  }

  const payload = {
    agreement_id: agreementId,
    requested_end_date: returnDate || null,
    reason: 'Extension request',
    new_monthly_rate: 0,
    status
  };

  let error;

  if (existing) {
    ({ error } = await supabase
      .from('agreement_extensions')
      .update(payload)
      .eq('id', existing.id));
  } else {
    ({ error } = await supabase
      .from('agreement_extensions')
      .insert([payload]));
  }

  if (error) {
    showToast(error.message || `Failed to ${existing ? 'update' : 'create'} request`, 'error');
    if (saveBtn) {
      saveBtn.disabled = false;
      saveBtn.innerHTML = `<i class="bi bi-check2 me-1"></i>${existing ? 'Update' : 'Save'}`;
    }
    return;
  }

  showToast(existing ? 'Extension request updated' : 'Extension request created');
  renderExtensions();
}

function filterRender() {
  const q = (document.getElementById('extensionSearch')?.value || '').toLowerCase();
  const st = document.getElementById('extensionStatusFilter')?.value || '';

  const filtered = allItems.filter(item => {
    const agreement = getAgreementForRequest(item);
    const text = `
      ${agreement ? agreement.agreement_number : ''}
      ${agreement ? agreement.client_name : ''}
      ${agreement ? getVehicleText(agreement) : ''}
      ${agreement ? getPlateText(agreement) : ''}
      ${item.return_date || ''}
      ${item.pickup_date || ''}
      ${item.status || ''}
    `.toLowerCase();

    return (!q || text.includes(q)) && (!st || (item.status || 'pending') === st);
  });

  const tableContainer = document.getElementById('extensionTableContainer');
  if (tableContainer) {
    tableContainer.innerHTML = buildTable(filtered);
    bindTableActions();
  }
}