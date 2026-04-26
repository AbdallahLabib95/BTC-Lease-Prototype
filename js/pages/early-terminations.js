import { supabase } from '../supabase-client.js';
import { statusBadge, formatDate, showToast, loadingSpinner, emptyState } from '../utils.js';

let allItems = [];
let agreementsList = [];
let terminationPond = null;
let currentTerminationFile = null;

function parseTerms(terms) {
  try {
    return JSON.parse(terms || '{}');
  } catch {
    return {};
  }
}

function buildTermsJson(existingTerms, terminationData) {
  const base = parseTerms(existingTerms);
  return JSON.stringify({ ...base, _early_termination: terminationData });
}

function extractTerminationData(terms) {
  const parsed = parseTerms(terms);
  return parsed._early_termination || null;
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

function buildProjectValue(agreement) {
  if (!agreement) return '';
  const client = agreement.client_name || 'Project';
  const number = agreement.agreement_number || '';
  return `Frame ${client}\\${number}`;
}

function findRequestById(id) {
  return allItems.find(item => String(item.id) === String(id));
}

function findAgreementById(id) {
  return agreementsList.find(item => String(item.id) === String(id));
}

function getAgreementForRequest(item) {
  return item?._sourceAgreement || findAgreementById(item?.agreement_id);
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

function destroyPond() {
  if (terminationPond) {
    terminationPond.destroy();
    terminationPond = null;
  }
  currentTerminationFile = null;
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

export async function renderEarlyTerminations(options = {}) {
  destroyPond();

  const container = document.getElementById('pageContent');
  container.innerHTML = loadingSpinner();

  const { data: agreements, error: agreementsError } = await supabase
    .from('agreements')
    .select('id, agreement_number, client_name, start_date, end_date, terms, status, created_at')
    .order('created_at', { ascending: false });

  if (agreementsError) {
    showToast(agreementsError.message || 'Failed to load agreements', 'error');
  }

  agreementsList = agreements || [];

  // Extract early termination requests from agreements
  // These are agreements with _early_termination data in their terms JSON
  allItems = agreementsList
    .filter(agreement => {
      const td = extractTerminationData(agreement.terms);
      return td !== null;
    })
    .map(agreement => {
      const td = extractTerminationData(agreement.terms);
      return {
        id: agreement.id,
        agreement_id: agreement.id,
        termination_date: td.termination_date || null,
        customer_name: td.customer_name || agreement.client_name || '',
        project: td.project || '',
        note: td.note || '',
        attachment_name: td.attachment_name || '',
        status: td.status || 'pending',
        created_at: td.created_at || agreement.created_at,
        _sourceAgreement: agreement,
      };
    });

  const view = options.view || 'list';
  const existing = options.id ? findRequestById(options.id) : null;

  if ((view === 'detail' || view === 'form') && options.id && !existing) {
    showToast('Early termination request not found', 'error');
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

      .filepond-wrapper {
        width: 100%;
      }

      .filepond--root {
        margin-bottom: 0;
      }

      .filepond--panel-root {
        border-radius: 14px;
      }
    </style>

    <div class="fade-in">
      <div class="page-hero">
        <h1>Early Termination Requests</h1>
        <p>Manage saved early termination requests</p>
      </div>

      <div class="page-section">
        <div class="data-card">
          <div class="data-card-header" style="display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap">
            <h3>Early Termination Requests</h3>
            <button type="button" class="btn-primary-green" id="addTerminationBtn">
              <i class="bi bi-plus-lg me-1"></i>Add
            </button>
          </div>

          <div class="data-card-body">
            <div class="search-filter-bar mb-3">
              <div class="search-input-group">
                <i class="bi bi-search"></i>
                <input type="text" class="form-control" id="terminationSearch" placeholder="Search...">
              </div>

              <select class="form-select filter-select" id="terminationStatusFilter">
                <option value="">All Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>

          <div class="table-container" id="terminationTableContainer">${buildTable(items)}</div>
        </div>
      </div>
    </div>
  `;
}

function buildTable(items) {
  if (!items.length) {
    return `
      <div class="data-card-body">
        ${emptyState('bi-calendar2-x', 'No Early Termination Requests', 'Create a new early termination request.')}
      </div>
    `;
  }

  return `
    <table class="data-table">
      <thead>
        <tr>
          <th>Agreement</th>
          <th>Customer</th>
          <th>Project</th>
          <th>Termination Date</th>
          <th>Attachment</th>
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
              <td>${escapeHtml(item.customer_name || agreement?.client_name || '-')}</td>
              <td>${escapeHtml(item.project || '-')}</td>
              <td>${item.termination_date ? escapeHtml(toInputDate(item.termination_date)) : '-'}</td>
              <td>${escapeHtml(item.attachment_name || '-')}</td>
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

      .filepond-wrapper {
        width: 100%;
      }

      .filepond--root {
        margin-bottom: 0;
      }

      .filepond--panel-root {
        border-radius: 14px;
      }
    </style>

    <div class="fade-in">
      <div class="page-hero">
        <h1>${isEdit ? 'Edit Early Termination Request' : 'New Early Termination Request'}</h1>
        <p>${isEdit ? 'Update the request details' : 'Create a new early termination request'}</p>
      </div>

      <div class="page-section">
        <div class="data-card">
          <div class="data-card-header" style="display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap">
            <h3>${isEdit ? 'Edit Request' : 'Early Termination Form'}</h3>
            <button type="button" class="btn-secondary-gray" id="backToTerminationsBtn">
              <i class="bi bi-arrow-left me-1"></i>Back
            </button>
          </div>

          <div class="data-card-body">
            <form id="terminationForm">
              <div class="mb-3">
                <label class="form-label">Agreement <span class="required">*</span></label>
                <select class="form-select" id="terminationAgreement" required>
                  <option value="">Select Agreement</option>
                  ${agreementsList.map(agreement => `
                    <option value="${agreement.id}" ${selectedAgreement && String(selectedAgreement.id) === String(agreement.id) ? 'selected' : ''}>
                      ${escapeHtml(agreement.agreement_number)} - ${escapeHtml(agreement.client_name)}
                    </option>
                  `).join('')}
                </select>
              </div>

              <div id="terminationVehicleCard">${buildVehicleCard(selectedAgreement)}</div>

              <div class="row g-3">
                <div class="col-md-4">
                  <label class="form-label">Termination Date <span class="required">*</span></label>
                  <input type="date" class="form-control" id="terminationDate" value="${existing?.termination_date ? toInputDate(existing.termination_date) : ''}" required>
                </div>

                <div class="col-md-4">
                  <label class="form-label">Customer Name</label>
                  <input type="text" class="form-control" id="terminationCustomer" value="${escapeHtml(existing?.customer_name || selectedAgreement?.client_name || '')}" disabled>
                </div>

                <div class="col-md-4">
                  <label class="form-label">Project</label>
                  <input type="text" class="form-control" id="terminationProject" value="${escapeHtml(existing?.project || buildProjectValue(selectedAgreement))}">
                </div>

                <div class="col-md-6">
                  <label class="form-label">Note</label>
                  <textarea class="form-control" id="terminationNote" rows="4" placeholder="Write note">${escapeHtml(existing?.note || '')}</textarea>
                </div>

                <div class="col-md-6">
                  <label class="form-label">Upload</label>
                  <div class="filepond-wrapper">
                    <input type="file" id="terminationUpload" name="terminationUpload">
                  </div>
                  ${existing?.attachment_name ? `<small class="text-muted d-block mt-2">Current file: ${escapeHtml(existing.attachment_name)}</small>` : ''}
                </div>

                <div class="col-md-4">
                  <label class="form-label">Status</label>
                  <select class="form-select" id="terminationStatus">
                    ${['pending', 'approved', 'rejected', 'completed'].map(status => `
                      <option value="${status}" ${(existing?.status || 'pending') === status ? 'selected' : ''}>
                        ${status.charAt(0).toUpperCase() + status.slice(1)}
                      </option>
                    `).join('')}
                  </select>
                </div>
              </div>

              <div class="d-flex justify-content-end gap-2 mt-4">
                <button type="button" class="btn-secondary-gray" id="cancelTerminationBtn">Cancel</button>
                <button type="submit" class="btn-primary-green" id="saveTerminationBtn">
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
        <h1>Early Termination Request Details</h1>
        <p>Review the request information</p>
      </div>

      <div class="page-section">
        <div class="data-card">
          <div class="data-card-header" style="display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap">
            <h3>Request Information</h3>
            <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
              ${statusBadge(item.status || 'pending')}
              <button type="button" class="btn-primary-green" id="editTerminationBtn">
                <i class="bi bi-pencil me-1"></i>Edit
              </button>
              <button type="button" class="btn-secondary-gray" id="backToTerminationsBtn">
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
                <div style="font-size:12px;color:var(--text-muted)">Customer Name</div>
                <div style="font-weight:600">${escapeHtml(item.customer_name || agreement?.client_name || '-')}</div>
              </div>

              <div class="col-md-6">
                <div style="font-size:12px;color:var(--text-muted)">Project</div>
                <div style="font-weight:600">${escapeHtml(item.project || '-')}</div>
              </div>

              <div class="col-md-6">
                <div style="font-size:12px;color:var(--text-muted)">Termination Date</div>
                <div style="font-weight:600">${item.termination_date ? escapeHtml(toInputDate(item.termination_date)) : '-'}</div>
              </div>

              <div class="col-md-6">
                <div style="font-size:12px;color:var(--text-muted)">Attachment</div>
                <div style="font-weight:600">${escapeHtml(item.attachment_name || '-')}</div>
              </div>

              <div class="col-md-6">
                <div style="font-size:12px;color:var(--text-muted)">Status</div>
                <div>${statusBadge(item.status || 'pending')}</div>
              </div>

              <div class="col-12">
                <div style="font-size:12px;color:var(--text-muted)">Note</div>
                <div>${escapeHtml(item.note || '-')}</div>
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
  const addBtn = document.getElementById('addTerminationBtn');
  const searchInput = document.getElementById('terminationSearch');
  const statusFilter = document.getElementById('terminationStatusFilter');

  if (addBtn) addBtn.addEventListener('click', () => renderEarlyTerminations({ view: 'form' }));
  if (searchInput) searchInput.addEventListener('input', filterRender);
  if (statusFilter) statusFilter.addEventListener('change', filterRender);

  bindTableActions();
}

function bindTableActions() {
  document.querySelectorAll('#terminationTableContainer [data-view]').forEach(btn => {
    btn.addEventListener('click', () => renderEarlyTerminations({ view: 'detail', id: btn.dataset.view }));
  });

  document.querySelectorAll('#terminationTableContainer [data-edit]').forEach(btn => {
    btn.addEventListener('click', () => renderEarlyTerminations({ view: 'form', id: btn.dataset.edit }));
  });

  document.querySelectorAll('#terminationTableContainer [data-delete]').forEach(btn => {
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

      // Remove the _early_termination data from the agreement's terms
      const item = findRequestById(btn.dataset.delete);
      if (!item) return;

      const agreement = getAgreementForRequest(item);
      if (!agreement) return;

      const baseTerms = parseTerms(agreement.terms);
      delete baseTerms._early_termination;

      const { error } = await supabase
        .from('agreements')
        .update({ terms: JSON.stringify(baseTerms) })
        .eq('id', agreement.id);

      if (error) {
        showToast(error.message || 'Failed to delete request', 'error');
        return;
      }

      showToast('Early termination request deleted');
      renderEarlyTerminations();
    });
  });
}

function bindFormEvents(existing = null) {
  const backBtn = document.getElementById('backToTerminationsBtn');
  const cancelBtn = document.getElementById('cancelTerminationBtn');
  const form = document.getElementById('terminationForm');
  const agreementSelect = document.getElementById('terminationAgreement');
  const customerInput = document.getElementById('terminationCustomer');
  const projectInput = document.getElementById('terminationProject');
  const fileInput = document.getElementById('terminationUpload');

  const refreshSelectedAgreement = () => {
    const agreement = findAgreementById(agreementSelect.value);
    const vehicleCard = document.getElementById('terminationVehicleCard');

    if (vehicleCard) {
      vehicleCard.innerHTML = buildVehicleCard(agreement);
    }

    customerInput.value = agreement?.client_name || '';
    projectInput.value = buildProjectValue(agreement);
  };

  if (backBtn) {
    backBtn.addEventListener('click', () => {
      if (existing) renderEarlyTerminations({ view: 'detail', id: existing.id });
      else renderEarlyTerminations();
    });
  }

  if (cancelBtn) {
    cancelBtn.addEventListener('click', () => {
      if (existing) renderEarlyTerminations({ view: 'detail', id: existing.id });
      else renderEarlyTerminations();
    });
  }

  if (agreementSelect) {
    agreementSelect.addEventListener('change', refreshSelectedAgreement);
  }

  if (fileInput) {
    if (window.FilePond) {
      terminationPond = window.FilePond.create(fileInput, {
        allowMultiple: false,
        allowReorder: false,
        instantUpload: false,
        storeAsFile: true,
        credits: false,
        labelIdle: 'Drag & Drop your file or <span class="filepond--label-action">Browse</span>',
        onupdatefiles: fileItems => {
          currentTerminationFile = fileItems[0]?.file || null;
        }
      });
    } else {
      showToast('FilePond library is not loaded', 'error');
    }
  }

  if (form) {
    form.addEventListener('submit', async e => {
      e.preventDefault();
      await handleSave(existing);
    });
  }
}

function bindDetailEvents(existing) {
  const backBtn = document.getElementById('backToTerminationsBtn');
  const editBtn = document.getElementById('editTerminationBtn');

  if (backBtn) backBtn.addEventListener('click', () => renderEarlyTerminations());
  if (editBtn && existing) editBtn.addEventListener('click', () => renderEarlyTerminations({ view: 'form', id: existing.id }));
}

async function handleSave(existing = null) {
  const saveBtn = document.getElementById('saveTerminationBtn');
  const agreementId = document.getElementById('terminationAgreement').value;
  const terminationDate = document.getElementById('terminationDate').value;
  const customerName = document.getElementById('terminationCustomer').value;
  const project = document.getElementById('terminationProject').value.trim();
  const note = document.getElementById('terminationNote').value.trim();
  const status = document.getElementById('terminationStatus').value;

  if (!agreementId || !terminationDate) {
    showToast('Please fill in all required fields', 'error');
    return;
  }

  if (saveBtn) {
    saveBtn.disabled = true;
    saveBtn.innerHTML = `<i class="bi bi-hourglass-split me-1"></i>${existing ? 'Updating...' : 'Saving...'}`;
  }

  // Fetch the current agreement to get its terms
  const { data: agreement, error: fetchError } = await supabase
    .from('agreements')
    .select('id, terms')
    .eq('id', agreementId)
    .maybeSingle();

  if (fetchError || !agreement) {
    showToast(fetchError?.message || 'Failed to fetch agreement', 'error');
    if (saveBtn) {
      saveBtn.disabled = false;
      saveBtn.innerHTML = `<i class="bi bi-check2 me-1"></i>${existing ? 'Update' : 'Save'}`;
    }
    return;
  }

  const terminationData = {
    termination_date: terminationDate,
    customer_name: customerName || null,
    project: project || null,
    note: note || null,
    attachment_name: currentTerminationFile?.name || existing?.attachment_name || null,
    status,
    created_at: existing?.created_at || new Date().toISOString(),
  };

  const newTerms = buildTermsJson(agreement.terms, terminationData);

  const { error } = await supabase
    .from('agreements')
    .update({ terms: newTerms })
    .eq('id', agreementId);

  if (error) {
    showToast(error.message || `Failed to ${existing ? 'update' : 'create'} request`, 'error');
    if (saveBtn) {
      saveBtn.disabled = false;
      saveBtn.innerHTML = `<i class="bi bi-check2 me-1"></i>${existing ? 'Update' : 'Save'}`;
    }
    return;
  }

  showToast(existing ? 'Early termination request updated' : 'Early termination request created');
  renderEarlyTerminations();
}

function filterRender() {
  const q = (document.getElementById('terminationSearch')?.value || '').toLowerCase();
  const st = document.getElementById('terminationStatusFilter')?.value || '';

  const filtered = allItems.filter(item => {
    const agreement = getAgreementForRequest(item);

    const text = `
      ${agreement ? agreement.agreement_number : ''}
      ${agreement ? agreement.client_name : ''}
      ${agreement ? getVehicleText(agreement) : ''}
      ${agreement ? getPlateText(agreement) : ''}
      ${item.customer_name || ''}
      ${item.project || ''}
      ${item.note || ''}
      ${item.attachment_name || ''}
      ${item.termination_date || ''}
      ${item.status || ''}
    `.toLowerCase();

    return (!q || text.includes(q)) && (!st || (item.status || 'pending') === st);
  });

  const tableContainer = document.getElementById('terminationTableContainer');
  if (tableContainer) {
    tableContainer.innerHTML = buildTable(filtered);
    bindTableActions();
  }
}
