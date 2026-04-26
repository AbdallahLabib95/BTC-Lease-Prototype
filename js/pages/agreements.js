import { supabase } from '../supabase-client.js';
import { loadingSpinner, emptyState, showToast } from '../utils.js';

let allItems = [];
let currentTerminationFile = null;
let terminationPond = null;

function parseTerms(terms) {
  try {
    return JSON.parse(terms || '{}');
  } catch {
    return {};
  }
}

function fmtDate(d) {
  if (!d) return '-';
  try {
    return new Date(d).toISOString().slice(0, 10);
  } catch {
    return d;
  }
}

function toInputDate(d) {
  if (!d) return '';
  try {
    return new Date(d).toISOString().slice(0, 10);
  } catch {
    return '';
  }
}

function uniqueValues(arr) {
  return Array.from(new Set(arr.filter(Boolean)));
}

function escapeHtml(s) {
  return String(s || '').replace(/[&<>"']/g, c => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[c]));
}

function findAgreementById(id) {
  return allItems.find(item => String(item.id) === String(id));
}

function buildProjectValue(agreement) {
  if (!agreement) return '-';
  const client = agreement.client_name || 'Project';
  const number = agreement.agreement_number || '';
  return `Frame ${client}\\${number}`;
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

function destroyTerminationPond() {
  if (terminationPond) {
    terminationPond.destroy();
    terminationPond = null;
  }
  currentTerminationFile = null;
}

function goToPage(page) {
  const link = document.querySelector(`[data-page="${page}"]`);
  if (link) link.click();
}

export async function renderAgreements(options = {}) {
  destroyTerminationPond();

  const container = document.getElementById('pageContent');
  container.innerHTML = loadingSpinner();

  const { data, error } = await supabase
    .from('agreements')
    .select('*')
    .order('agreement_number', { ascending: false });

  if (error) {
    container.innerHTML = `
      <div class="page-section" style="padding-top:32px">
        <div class="data-card" style="padding:32px">
          ${emptyState('bi-exclamation-triangle', 'Failed to load agreements', error.message || 'Please try again.')}
        </div>
      </div>
    `;
    return;
  }

  allItems = data || [];

  const view = options.view || 'list';
  const agreement = options.id ? findAgreementById(options.id) : null;

  if ((view === 'extend' || view === 'termination') && options.id && !agreement) {
    showToast('Agreement not found', 'error');
    container.innerHTML = buildListPage(allItems);
    bindListEvents();
    return;
  }

  if (view === 'extend') {
    container.innerHTML = buildExtendAgreementPage(agreement);
    bindExtendAgreementEvents(agreement);
    return;
  }

  if (view === 'termination') {
    container.innerHTML = buildEarlyTerminationPage(agreement);
    bindEarlyTerminationEvents(agreement);
    return;
  }

  container.innerHTML = buildListPage(allItems);
  bindListEvents();
}

function buildListPage(items) {
  const projectOptions = uniqueValues(allItems.map(a => a.client_name)).sort();
  const driverOptions = uniqueValues(allItems.map(a => parseTerms(a.terms).driver)).sort();

  return `
    <style>
      .agreements-grid { overflow: visible !important; }
      .agreement-card { position: relative; overflow: visible !important; z-index: 1; }
      .agreement-card.service-menu-open { z-index: 50; }
      .agreement-card-body, .agreement-card-action-row { overflow: visible !important; }

      .agreement-service-menu {
        position: relative;
        display: inline-block;
      }

      .agreement-service-menu summary {
        list-style: none;
        cursor: pointer !important;
      }

      .agreement-service-menu summary::-webkit-details-marker {
        display: none;
      }

      .agreement-service-dropdown {
        position: absolute;
        right: 0;
        top: calc(100% + 8px);
        min-width: 220px;
        background: #fff;
        border: 1px solid #e5e7eb;
        border-radius: 12px;
        box-shadow: 0 12px 30px rgba(0,0,0,0.12);
        padding: 8px;
        z-index: 999;
      }

      .agreement-service-option {
        width: 100%;
        border: 0;
        background: transparent;
        text-align: left;
        padding: 10px 12px;
        border-radius: 10px;
        font-weight: 600;
        color: #374151;
        cursor: pointer !important;
      }

      .agreement-service-option:hover {
        background: #f3f4f6;
      }

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
        <h1>Agreements</h1>
        <p>Browse agreements and launch service requests</p>
      </div>

      <div class="page-section">
        <div class="agreements-filter-card">
          <div class="agreements-filter-header">
            <i class="bi bi-caret-down-fill"></i> Agreements
          </div>

          <div class="agreements-filter-body">
            <div class="row g-3">
              <div class="col-md-4">
                <label class="form-label">Status</label>
                <select class="form-select" id="agrStatusFilter">
                  <option value="">All</option>
                  <option value="open">Open</option>
                  <option value="closed">Closed</option>
                </select>
              </div>

              <div class="col-md-4">
                <label class="form-label">Project Name</label>
                <select class="form-select" id="agrProjectFilter">
                  <option value="">All</option>
                  ${projectOptions.map(p => `<option value="${escapeHtml(p)}">${escapeHtml(p)}</option>`).join('')}
                </select>
              </div>

              <div class="col-md-4">
                <label class="form-label">Driver</label>
                <select class="form-select" id="agrDriverFilter">
                  <option value="">All</option>
                  ${driverOptions.map(d => `<option value="${escapeHtml(d)}">${escapeHtml(d)}</option>`).join('')}
                </select>
              </div>

              <div class="col-md-4">
                <label class="form-label"><i class="bi bi-file-earmark-text"></i> Purchase Order Number</label>
                <input type="text" class="form-control" id="agrPoFilter" placeholder="Purchase Order Number">
              </div>

              <div class="col-md-4">
                <label class="form-label"><i class="bi bi-car-front"></i> Plate Number</label>
                <input type="text" class="form-control" id="agrPlateFilter" placeholder="Plate Number">
              </div>

              <div class="col-md-4" style="display:flex;align-items:flex-end;justify-content:flex-end">
                <button class="btn-filter-red" id="agrFilterBtn"><i class="bi bi-funnel"></i> Filter</button>
              </div>
            </div>
          </div>
        </div>

        <div class="agreements-grid" id="agreementsGrid">${buildCards(items)}</div>
      </div>
    </div>
  `;
}

function buildCards(items) {
  if (items.length === 0) {
    return `<div class="data-card" style="grid-column:1/-1;padding:40px">${emptyState('bi-file-earmark-text', 'No Agreements', 'Try adjusting your filters.')}</div>`;
  }

  return items.map(a => {
    const t = parseTerms(a.terms);
    const status = (a.status || 'open').toLowerCase();
    const statusLabel = status.charAt(0).toUpperCase() + status.slice(1);

    return `
      <div class="agreement-card">
        <div class="agreement-card-header">
          <i class="bi bi-file-earmark-text-fill"></i>
          <strong>${escapeHtml(a.agreement_number)} - ${escapeHtml(t.make || '-')} - ${escapeHtml(t.model || '-')}</strong>
        </div>

        <div class="agreement-card-body">
          <div class="agreement-row"><span class="agreement-icon">#</span><span class="agreement-label">Agreement No. :</span> ${escapeHtml(a.agreement_number)}</div>
          <div class="agreement-row"><i class="bi bi-car-front"></i><span class="agreement-label">Plate Number:</span> ${escapeHtml(t.plate || '-')}</div>
          <div class="agreement-row"><i class="bi bi-calendar-event"></i><span class="agreement-label">PickupDate :</span> ${fmtDate(a.start_date)}</div>
          <div class="agreement-row"><i class="bi bi-calendar-check"></i><span class="agreement-label">Return Date :</span> ${fmtDate(a.end_date)}</div>
          <div class="agreement-row"><i class="bi bi-person"></i><span class="agreement-label">Driver Name :</span> ${escapeHtml(t.driver || '-')}</div>
          <div class="agreement-row"><i class="bi bi-flag"></i><span class="agreement-label">Status :</span> ${statusLabel}</div>
          <div class="agreement-row"><i class="bi bi-file-earmark-text"></i><span class="agreement-label">Purchase Order Number :</span> ${t.po ? escapeHtml(t.po) : '<span style="color:#6b7280">No Data Found</span>'}</div>
        </div>

        <div class="agreement-card-action-row">
          <span>Request Delivery Note Report</span>
          <button type="button" class="btn-outline-red-add" data-delivery-note="${a.id}">
            <i class="bi bi-plus-circle"></i> Add
          </button>
        </div>

        <div class="agreement-card-action-row">
          <span>Choose Service Name</span>
          <details class="agreement-service-menu" data-service-menu>
            <summary class="btn-red-service">
              <i class="bi bi-tools"></i> Service <i class="bi bi-caret-down-fill"></i>
            </summary>

            <div class="agreement-service-dropdown">
              <button type="button" class="agreement-service-option" data-service-action="extend" data-id="${a.id}">
                Extend Agreement
              </button>
              <button type="button" class="agreement-service-option" data-service-action="termination" data-id="${a.id}">
                Early Termination
              </button>
            </div>
          </details>
        </div>
      </div>
    `;
  }).join('');
}

function buildExtendAgreementPage(agreement) {
  const t = parseTerms(agreement.terms);
  const pickupDate = toInputDate(agreement.start_date);
  const returnDate = toInputDate(agreement.end_date);
  const duration = calculateDurationDays(pickupDate, returnDate);
  const vehicleType = t.type || t.category || t.body_type || t.vehicle_type || '';

  return `
    <div class="fade-in">
      <div class="page-hero">
        <h1>Extend Agreement</h1>
        <p>Create an extend agreement request</p>
      </div>

      <div class="page-section">
        <div class="data-card">
          <div class="data-card-header" style="display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap">
            <h3>Extend Agreement Request</h3>
            <button type="button" class="btn-secondary-gray" id="backToAgreementsBtn">
              <i class="bi bi-arrow-left me-1"></i>Back
            </button>
          </div>

          <div class="data-card-body">
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
                  <span style="color:#4b7bd2">
                    ${escapeHtml(t.make || '-')} - ${escapeHtml(t.model || '-')}${vehicleType ? ` - ${escapeHtml(vehicleType)}` : ''}
                  </span>
                </div>
                <div style="font-size:18px;font-weight:600;color:#374151">
                  Plate Number:
                  <span style="color:#4b7bd2">${escapeHtml(t.plate || '-')}</span>
                </div>
              </div>
            </div>

            <form id="extendAgreementForm">
              <div class="row g-3">
                <div class="col-md-4">
                  <label class="form-label">Pickup Date <span class="required">*</span></label>
                  <input type="date" class="form-control" id="extPickupDate" value="${pickupDate}" disabled>
                </div>

                <div class="col-md-4">
                  <label class="form-label">Return Date <span class="required">*</span></label>
                  <input type="date" class="form-control" id="extReturnDate" value="${returnDate}" required>
                </div>

                <div class="col-md-4">
                  <label class="form-label">Duration <span class="required">*</span></label>
                  <input type="number" class="form-control" id="extDuration" value="${duration}" readonly>
                </div>
              </div>

              <div class="d-flex justify-content-end gap-2 mt-4">
                <button type="button" class="btn-secondary-gray" id="cancelExtendBtn">Cancel</button>
                <button type="submit" class="btn-primary-green" id="saveExtendBtn">
                  <i class="bi bi-check2 me-1"></i>Save
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  `;
}

function buildEarlyTerminationPage(agreement) {
  const customerName = agreement.client_name || '';
  const projectValue = buildProjectValue(agreement);

  return `
    <div class="fade-in">
      <div class="page-hero">
        <h1>Early Termination</h1>
        <p>Create an early termination request</p>
      </div>

      <div class="page-section">
        <div class="data-card">
          <div class="data-card-header" style="display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap">
            <h3>Early Termination Request</h3>
            <button type="button" class="btn-secondary-gray" id="backToAgreementsBtn">
              <i class="bi bi-arrow-left me-1"></i>Back
            </button>
          </div>

          <div class="data-card-body">
            <form id="earlyTerminationForm">
              <div class="row g-3">
                <div class="col-md-4">
                  <label class="form-label">Termination Date <span class="required">*</span></label>
                  <input type="date" class="form-control" id="terminationDate" required>
                </div>

                <div class="col-md-4">
                  <label class="form-label">Customer Name</label>
                  <input type="text" class="form-control" id="terminationCustomer" value="${escapeHtml(customerName)}" disabled>
                </div>

                <div class="col-md-4">
                  <label class="form-label">Project</label>
                  <input type="text" class="form-control" id="terminationProject" value="${escapeHtml(projectValue)}">
                </div>

                <div class="col-md-6">
                  <label class="form-label">Note</label>
                  <textarea class="form-control" id="terminationNote" rows="4" placeholder="Write note"></textarea>
                </div>

                <div class="col-md-6">
                  <label class="form-label">Upload</label>
                  <div class="filepond-wrapper">
                    <input type="file" id="terminationUpload" name="terminationUpload">
                  </div>
                </div>
              </div>

              <div class="d-flex justify-content-end gap-2 mt-4">
                <button type="button" class="btn-secondary-gray" id="cancelTerminationBtn">Cancel</button>
                <button type="submit" class="btn-primary-green" id="saveTerminationBtn">
                  <i class="bi bi-check2 me-1"></i>Save
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  `;
}

function bindListEvents() {
  document.getElementById('agrFilterBtn').addEventListener('click', applyFilters);
  document.getElementById('agrPlateFilter').addEventListener('keyup', e => {
    if (e.key === 'Enter') applyFilters();
  });
  document.getElementById('agrPoFilter').addEventListener('keyup', e => {
    if (e.key === 'Enter') applyFilters();
  });

  bindAgreementCardEvents();
}

function bindAgreementCardEvents() {
  document.querySelectorAll('[data-service-action]').forEach(btn => {
    btn.addEventListener('click', e => {
      e.preventDefault();

      const id = btn.dataset.id;
      const action = btn.dataset.serviceAction;

      if (action === 'extend') {
        renderAgreements({ view: 'extend', id });
        return;
      }

      if (action === 'termination') {
        renderAgreements({ view: 'termination', id });
      }
    });
  });

  document.querySelectorAll('[data-delivery-note]').forEach(btn => {
    btn.addEventListener('click', () => {
      showToast('Request Delivery Note Report is not implemented yet');
    });
  });

  document.querySelectorAll('[data-service-menu]').forEach(menu => {
    menu.addEventListener('toggle', () => {
      const card = menu.closest('.agreement-card');
      if (!card) return;
      card.classList.toggle('service-menu-open', menu.open);
    });
  });

  document.addEventListener('click', closeAllServiceMenusOnOutsideClick, { once: true });
}

function closeAllServiceMenusOnOutsideClick(event) {
  if (event.target.closest('[data-service-menu]')) {
    document.addEventListener('click', closeAllServiceMenusOnOutsideClick, { once: true });
    return;
  }

  document.querySelectorAll('[data-service-menu]').forEach(menu => {
    menu.open = false;
    const card = menu.closest('.agreement-card');
    if (card) card.classList.remove('service-menu-open');
  });

  document.addEventListener('click', closeAllServiceMenusOnOutsideClick, { once: true });
}

function bindExtendAgreementEvents(agreement) {
  const backBtn = document.getElementById('backToAgreementsBtn');
  const cancelBtn = document.getElementById('cancelExtendBtn');
  const returnDateInput = document.getElementById('extReturnDate');
  const pickupDateInput = document.getElementById('extPickupDate');
  const durationInput = document.getElementById('extDuration');
  const form = document.getElementById('extendAgreementForm');

  const updateDuration = () => {
    durationInput.value = calculateDurationDays(pickupDateInput.value, returnDateInput.value);
  };

  if (backBtn) backBtn.addEventListener('click', () => renderAgreements());
  if (cancelBtn) cancelBtn.addEventListener('click', () => renderAgreements());

  if (returnDateInput) {
    returnDateInput.addEventListener('input', updateDuration);
    returnDateInput.addEventListener('change', updateDuration);
  }

  if (form) {
    form.addEventListener('submit', async e => {
      e.preventDefault();
      await handleExtendAgreementSubmit(agreement);
    });
  }
}

function bindEarlyTerminationEvents(agreement) {
  const backBtn = document.getElementById('backToAgreementsBtn');
  const cancelBtn = document.getElementById('cancelTerminationBtn');
  const form = document.getElementById('earlyTerminationForm');
  const fileInput = document.getElementById('terminationUpload');

  if (backBtn) backBtn.addEventListener('click', () => renderAgreements());
  if (cancelBtn) cancelBtn.addEventListener('click', () => renderAgreements());

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
      await handleEarlyTerminationSubmit(agreement);
    });
  }
}

async function handleExtendAgreementSubmit(agreement) {
  const saveBtn = document.getElementById('saveExtendBtn');
  const pickupDate = document.getElementById('extPickupDate').value;
  const returnDate = document.getElementById('extReturnDate').value;

  if (!returnDate) {
    showToast('Please select return date', 'error');
    return;
  }

  if (saveBtn) {
    saveBtn.disabled = true;
    saveBtn.innerHTML = '<i class="bi bi-hourglass-split me-1"></i>Saving...';
  }

  const { error } = await supabase
    .from('agreement_extensions')
    .insert([{
      agreement_id: agreement.id,
      requested_end_date: returnDate || null,
      reason: 'Extension request',
      new_monthly_rate: 0,
      status: 'pending'
    }]);

  if (error) {
    showToast(error.message || 'Failed to save extension request', 'error');
    if (saveBtn) {
      saveBtn.disabled = false;
      saveBtn.innerHTML = '<i class="bi bi-check2 me-1"></i>Save';
    }
    return;
  }

  showToast('Extension request saved');
  const link = document.querySelector('[data-page="extensions"]');
  if (link) link.click();
}

async function handleEarlyTerminationSubmit(agreement) {
  const saveBtn = document.getElementById('saveTerminationBtn');
  const terminationDate = document.getElementById('terminationDate').value;
  const customerName = document.getElementById('terminationCustomer').value;
  const project = document.getElementById('terminationProject').value.trim();
  const note = document.getElementById('terminationNote').value.trim();

  if (!terminationDate) {
    showToast('Please select termination date', 'error');
    return;
  }

  if (saveBtn) {
    saveBtn.disabled = true;
    saveBtn.innerHTML = '<i class="bi bi-hourglass-split me-1"></i>Saving...';
  }

  // Store early termination data in the agreement's terms JSON
  const { data: currentAgreement, error: fetchError } = await supabase
    .from('agreements')
    .select('id, terms')
    .eq('id', agreement.id)
    .maybeSingle();

  if (fetchError || !currentAgreement) {
    showToast(fetchError?.message || 'Failed to fetch agreement', 'error');
    if (saveBtn) {
      saveBtn.disabled = false;
      saveBtn.innerHTML = '<i class="bi bi-check2 me-1"></i>Save';
    }
    return;
  }

  let terms = {};
  try { terms = JSON.parse(currentAgreement.terms || '{}'); } catch(e) {}
  terms._early_termination = {
    termination_date: terminationDate,
    customer_name: customerName || null,
    project: project || null,
    note: note || null,
    attachment_name: currentTerminationFile?.name || null,
    status: 'pending',
    created_at: new Date().toISOString()
  };

  const { error } = await supabase
    .from('agreements')
    .update({ terms: JSON.stringify(terms) })
    .eq('id', agreement.id);

  if (error) {
    showToast(error.message || 'Failed to save early termination request', 'error');
    if (saveBtn) {
      saveBtn.disabled = false;
      saveBtn.innerHTML = '<i class="bi bi-check2 me-1"></i>Save';
    }
    return;
  }

  showToast('Early termination request saved');
  goToPage('early-terminations');
}

function applyFilters() {
  const status = document.getElementById('agrStatusFilter').value;
  const project = document.getElementById('agrProjectFilter').value;
  const driver = document.getElementById('agrDriverFilter').value;
  const po = (document.getElementById('agrPoFilter').value || '').toLowerCase();
  const plate = (document.getElementById('agrPlateFilter').value || '').toLowerCase();

  const filtered = allItems.filter(a => {
    const t = parseTerms(a.terms);

    if (status && a.status !== status) return false;
    if (project && a.client_name !== project) return false;
    if (driver && (t.driver || '') !== driver) return false;
    if (po && !(t.po || '').toLowerCase().includes(po)) return false;
    if (plate && !(t.plate || '').toLowerCase().includes(plate)) return false;

    return true;
  });

  document.getElementById('agreementsGrid').innerHTML = buildCards(filtered);
  bindAgreementCardEvents();
}