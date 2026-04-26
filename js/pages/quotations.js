import { supabase } from '../supabase-client.js';
import { statusBadge, formatDate, showToast, loadingSpinner, emptyState } from '../utils.js';

let allItems = [];
let vehicleLines = [];
let filepondInstances = [];
let attachmentFiles = { commercial_register: null, vat_certificate: null, request_document: null };

const manufacturerModels = {
  Toyota: ['Camry', 'Corolla', 'Hilux', 'Land Cruiser', 'Hiace', 'RAV4', 'Fortuner', 'Yaris'],
  Honda: ['Civic', 'Accord', 'CR-V', 'HR-V', 'Pilot', 'City'],
  Nissan: ['Altima', 'Patrol', 'Sentra', 'X-Trail', 'Pathfinder', 'Sunny'],
  Hyundai: ['Tucson', 'Elantra', 'Sonata', 'Santa Fe', 'Accent', 'Creta'],
  BMW: ['3 Series', '5 Series', '7 Series', 'X3', 'X5', 'X7'],
  Mercedes: ['C-Class', 'E-Class', 'S-Class', 'GLC', 'GLE', 'GLS'],
  Ford: ['F-150', 'Explorer', 'Expedition', 'Escape', 'Taurus', 'Ranger'],
  Kia: ['Sportage', 'Optima', 'Sorento', 'Cerato', 'Seltos', 'Carnival'],
  GMC: ['Sierra', 'Yukon', 'Terrain', 'Acadia', 'Canyon'],
  Lexus: ['ES', 'IS', 'RX', 'LX', 'NX', 'GX'],
  Mitsubishi: ['Pajero', 'Outlander', 'Eclipse Cross', 'L200', 'ASX'],
  Chevrolet: ['Tahoe', 'Suburban', 'Silverado', 'Traverse', 'Blazer', 'Malibu']
};

const STATUS_OPTIONS = [
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Reject' },
  { value: 'draft', label: 'Draft' },
  { value: 'sent_to_customer', label: 'Send to customer' },
  { value: 'under_processing', label: 'Under Processing' },
];

export async function renderQuotations() {
  const container = document.getElementById('pageContent');
  container.innerHTML = loadingSpinner();

  const { data } = await supabase
    .from('quotations')
    .select('*')
    .order('created_at', { ascending: false });
  allItems = data || [];

  renderListView(container);
}

function cleanupAddView() {
  destroySelect2();
  filepondInstances.forEach(i => { try { i.destroy(); } catch (e) {} });
  filepondInstances = [];
}

function renderListView(container) {
  cleanupAddView();
  container.innerHTML = `
    <div class="fade-in">
      <div class="page-section" style="padding-top:32px">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:24px">
          <h1 style="font-size:24px;font-weight:700;margin:0">Request Quotations</h1>
          <button class="btn-primary-green" id="addQuotBtn"><i class="bi bi-plus-lg"></i> Add</button>
        </div>

        <div class="row g-3 mb-3">
          <div class="col-md-6">
            <label class="form-label">Request Quotations No.</label>
            <input type="text" class="form-control" id="quotSearchNum" placeholder="Request Quotations No.">
          </div>
          <div class="col-md-6">
            <label class="form-label">Status</label>
            <select class="form-select" id="quotStatusFilter">
              <option value="">All</option>
              ${STATUS_OPTIONS.map(s => `<option value="${s.value}">${s.label}</option>`).join('')}
            </select>
          </div>
        </div>
        <div style="text-align:center;margin-bottom:24px">
          <button class="btn-primary-green" id="quotSearchBtn"><i class="bi bi-search"></i> Search</button>
        </div>

        <div class="data-card">
          <div class="table-container" id="quotTableContainer">${buildTable(allItems)}</div>
          <div class="table-footer-info">
            <span>Showing ${allItems.length > 0 ? '1' : '0'} to ${allItems.length} of ${allItems.length} entries</span>
            <div class="pagination-links"><a>Previous</a><a>Next</a></div>
          </div>
        </div>
      </div>
    </div>
  `;

  document.getElementById('quotSearchBtn').addEventListener('click', filterRender);
  document.getElementById('quotSearchNum').addEventListener('keyup', (e) => { if (e.key === 'Enter') filterRender(); });
  document.getElementById('quotStatusFilter').addEventListener('change', filterRender);
  document.getElementById('addQuotBtn').addEventListener('click', () => renderAddView(container));
  bindTableActions(container);
}

function statusLabel(status) {
  const s = STATUS_OPTIONS.find(o => o.value === status);
  return `<span class="badge-status ${status}">${s ? s.label : (status || '-')}</span>`;
}

function buildTable(items) {
  if (items.length === 0) return `<div class="no-data-text">No data available in table</div>`;
  return `
    <table class="data-table">
      <thead><tr><th>Request Quotations No.</th><th>Client</th><th>Email</th><th>Date</th><th>Status</th><th>Action</th></tr></thead>
      <tbody>
        ${items.map(q => {
          const email = parseNotes(q.notes).email || '-';
          return `
          <tr>
            <td><strong>${q.quotation_number}</strong></td>
            <td>${q.client_name || '-'}</td>
            <td>${email}</td>
            <td>${formatDate(q.created_at)}</td>
            <td>${statusLabel(q.status)}</td>
            <td>
              <button class="btn-icon edit" data-view="${q.id}" title="View Details"><i class="bi bi-eye"></i></button>
              <button class="btn-icon delete" data-delete="${q.id}" title="Delete"><i class="bi bi-trash"></i></button>
            </td>
          </tr>`;
        }).join('')}
      </tbody>
    </table>`;
}

function parseNotes(notes) {
  try {
    return JSON.parse(notes || '{}');
  } catch {
    return { description: notes || '' };
  }
}

function renderDetailView(container, q) {
  const meta = parseNotes(q.notes);
  const vehicles = meta.vehicles || [];

  container.innerHTML = `
    <div class="fade-in">
      <div class="page-section" style="padding-top:32px">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:24px">
          <div style="display:flex;align-items:center;gap:16px">
            <button class="btn-secondary-gray" id="backToListBtn" style="padding:8px 14px"><i class="bi bi-arrow-left"></i></button>
            <div>
              <h1 style="font-size:24px;font-weight:700;margin:0">${q.quotation_number}</h1>
              <span style="color:var(--text-muted);font-size:14px">Created ${formatDate(q.created_at)}</span>
            </div>
          </div>
          ${statusLabel(q.status)}
        </div>

        <div class="form-card mb-4" style="border-top:4px solid var(--primary)">
          <div class="form-card-body">
            <h3 class="form-card-title" style="margin-bottom:20px">Customer Information</h3>
            <div class="row g-3">
              <div class="col-md-4"><div style="font-size:12px;color:var(--text-muted)">Client Name</div><div style="font-weight:600">${q.client_name || '-'}</div></div>
              <div class="col-md-4"><div style="font-size:12px;color:var(--text-muted)">Company</div><div style="font-weight:600">${meta.company || '-'}</div></div>
              <div class="col-md-4"><div style="font-size:12px;color:var(--text-muted)">Email</div><div style="font-weight:600">${meta.email || '-'}</div></div>
              <div class="col-md-4"><div style="font-size:12px;color:var(--text-muted)">Phone</div><div style="font-weight:600">${meta.phone || '-'}</div></div>
              <div class="col-md-4"><div style="font-size:12px;color:var(--text-muted)">Region</div><div style="font-weight:600;text-transform:capitalize">${meta.region || '-'}</div></div>
              <div class="col-md-4"><div style="font-size:12px;color:var(--text-muted)">City</div><div style="font-weight:600;text-transform:capitalize">${meta.city || '-'}</div></div>
            </div>
          </div>
        </div>

        <div class="data-card mb-4">
          <div class="data-card-header" style="display:flex;justify-content:space-between;align-items:center">
            <h3>Requested Vehicles</h3>
            <span class="badge-status available">${vehicles.length} vehicle${vehicles.length !== 1 ? 's' : ''}</span>
          </div>
          <div class="table-container">
            ${vehicles.length === 0
              ? `<div class="data-card-body">${emptyState('bi-truck-front', 'No Vehicles', 'No vehicles linked to this quotation.')}</div>`
              : `<table class="data-table">
                  <thead>
                    <tr><th>#</th><th>Vehicle</th><th>Category</th><th>Subcategory</th><th>Year</th><th>Color</th><th>Qty</th><th>Rent Type</th><th>Additions</th></tr>
                  </thead>
                  <tbody>
                    ${vehicles.map((v, i) => `
                      <tr>
                        <td>${i + 1}</td>
                        <td><strong>${v.manufacturer || ''} ${v.model || ''}</strong></td>
                        <td style="text-transform:capitalize">${v.category || '-'}</td>
                        <td style="text-transform:capitalize">${v.subcategory || '-'}</td>
                        <td>${v.year || '-'}</td>
                        <td>${v.color || '-'}</td>
                        <td>${v.quantity || 1}</td>
                        <td>${(v.rentType || []).join(', ') || '-'}</td>
                        <td>${(v.additions || []).join(', ') || '-'}</td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>`}
          </div>
        </div>

        ${meta.description ? `
        <div class="form-card mb-4" style="border-top:4px solid var(--primary)">
          <div class="form-card-body">
            <h3 class="form-card-title" style="margin-bottom:12px">Description</h3>
            <p style="color:var(--text-secondary);margin:0;white-space:pre-wrap">${meta.description}</p>
          </div>
        </div>` : ''}
      </div>
    </div>
  `;

  document.getElementById('backToListBtn').addEventListener('click', () => renderQuotations());
}

function renderAddView(container) {
  vehicleLines = [];

  container.innerHTML = `
    <div class="fade-in">
      <div class="page-section" style="padding-top:32px">
        <h2 class="section-title">Customer Information</h2>
        <div class="form-card" style="border-top:4px solid var(--primary)">
          <div class="form-card-body">
            <div class="row g-3">
              <div class="col-md-6">
                <label class="form-label">Full Name <span class="required">*</span></label>
                <input type="text" class="form-control" id="qFullName">
              </div>
              <div class="col-md-6">
                <label class="form-label">Phone Number <span class="required">*</span></label>
                <div style="display:flex;gap:8px">
                  <input type="text" class="form-control" value="+966" style="max-width:80px" readonly>
                  <input type="text" class="form-control" id="qPhone" style="flex:1">
                </div>
              </div>
              <div class="col-md-6">
                <label class="form-label">Email <span class="required">*</span></label>
                <input type="email" class="form-control" id="qEmail" placeholder="customer@example.com">
              </div>
              <div class="col-md-6">
                <label class="form-label">Company Name <span class="required">*</span></label>
                <input type="text" class="form-control" id="qCompany">
              </div>
              <div class="col-md-6">
                <label class="form-label">Region <span class="required">*</span></label>
                <select class="form-select" id="qRegion">
                  <option value="">Select</option>
                  <option value="riyadh">Riyadh</option>
                  <option value="jeddah">Jeddah</option>
                  <option value="dammam">Dammam</option>
                  <option value="makkah">Makkah</option>
                  <option value="madinah">Madinah</option>
                </select>
              </div>
              <div class="col-md-6">
                <label class="form-label">City <span class="required">*</span></label>
                <select class="form-select" id="qCity">
                  <option value="">Select</option>
                  <option value="riyadh">Riyadh</option>
                  <option value="jeddah">Jeddah</option>
                  <option value="dammam">Dammam</option>
                  <option value="khobar">Al Khobar</option>
                  <option value="jubail">Jubail</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <h2 class="section-title">Vehicle Information</h2>
        <div class="form-card" style="border-top:4px solid var(--primary)">
          <div class="form-card-body">
            <div class="row g-3">
              <div class="col-md-3">
                <label class="form-label">Manufacturer <span class="required">*</span></label>
                <select class="form-select" id="qManufacturer">
                  <option value="">Select</option>
                  ${Object.keys(manufacturerModels).map(m => `<option value="${m}">${m}</option>`).join('')}
                </select>
              </div>
              <div class="col-md-3">
                <label class="form-label">Model <span class="required">*</span></label>
                <select class="form-select" id="qModel">
                  <option value="">Select</option>
                </select>
              </div>
              <div class="col-md-3">
                <label class="form-label">Category <span class="required">*</span></label>
                <select class="form-select" id="qCategory">
                  <option value="">Select</option>
                  <option value="sedan">Sedan</option>
                  <option value="suv">SUV</option>
                  <option value="truck">Truck</option>
                  <option value="van">Van</option>
                </select>
              </div>
              <div class="col-md-3">
                <label class="form-label">Subcategory <span class="required">*</span></label>
                <select class="form-select" id="qSubcategory">
                  <option value="">Select</option>
                  <option value="economy">Economy</option>
                  <option value="standard">Standard</option>
                  <option value="luxury">Luxury</option>
                  <option value="premium">Premium</option>
                </select>
              </div>
              <div class="col-md-3">
                <label class="form-label">Manufacturer Year <span class="required">*</span></label>
                <select class="form-select" id="qYear">
                  <option value="">Select</option>
                  <option value="2026">2026</option>
                  <option value="2025">2025</option>
                  <option value="2024">2024</option>
                  <option value="2023">2023</option>
                  <option value="2022">2022</option>
                </select>
              </div>
              <div class="col-md-3">
                <label class="form-label">Color <span class="required">*</span></label>
                <select class="form-select" id="qColor">
                  <option value="">Select</option>
                  <option value="White">White</option>
                  <option value="Black">Black</option>
                  <option value="Silver">Silver</option>
                  <option value="Gray">Gray</option>
                  <option value="Blue">Blue</option>
                  <option value="Red">Red</option>
                </select>
              </div>
              <div class="col-md-3">
                <label class="form-label">Quantity <span class="required">*</span></label>
                <input type="number" class="form-control" id="qQty" value="1" min="1">
              </div>
              <div class="col-md-3">
                <label class="form-label">Additions</label>
                <select class="form-select" id="qAdditions" multiple size="4" style="height:auto">
                  <option value="early_termination">Early Termination Penalty</option>
                  <option value="services_allowance">Services Allowance</option>
                  <option value="rent_diff">Rent Diff</option>
                  <option value="daily_rental">Daily Rental</option>
                  <option value="monthly_rental">Monthly Rental</option>
                </select>
              </div>
              <div class="col-md-4">
                <label class="form-label">Rent Type <span class="required">*</span></label>
                <select class="form-select" id="qRentType" multiple size="5" style="height:auto">
                  <option value="12">12 Month</option>
                  <option value="24">24 Month</option>
                  <option value="36">36 Month</option>
                  <option value="48">48 Month</option>
                  <option value="60">60 Month</option>
                </select>
              </div>
              <div class="col-md-8">
                <label class="form-label">Description</label>
                <textarea class="form-control" id="qLineDescription" rows="3" placeholder="Vehicle-specific notes"></textarea>
              </div>
              <div class="col-md-12" style="display:flex;justify-content:flex-end">
                <button class="btn-primary-green" id="addVehicleLineBtn" style="padding:12px 24px"><i class="bi bi-plus-lg"></i> Add Vehicle</button>
              </div>
            </div>
          </div>
        </div>

        <div class="data-card mt-3" id="vehicleLinesCard">
          <div class="data-card-header" style="display:flex;justify-content:space-between;align-items:center">
            <h3>Added Vehicles</h3>
            <span class="badge-status available" id="vehicleLineCount">0 vehicles</span>
          </div>
          <div class="table-container" id="vehicleLinesTable">
            <div class="data-card-body">${emptyState('bi-truck-front', 'No Vehicles Added', 'Use the form above to add vehicles to this quotation.')}</div>
          </div>
        </div>

        <div class="form-card mt-3" style="border-top:4px solid var(--primary)">
          <div class="form-card-body">
            <label class="form-label">General Description</label>
            <textarea class="form-control" id="qDescription" rows="4"></textarea>
          </div>
        </div>

        <h2 class="section-title">Attachments</h2>
        <div class="form-card" style="border-top:4px solid var(--primary)">
          <div class="form-card-body">
            <div class="row g-3">
              <div class="col-md-4">
                <label class="form-label">Commercial Register Document</label>
                <input type="file" class="filepond" id="qAttachCR" name="commercial_register" />
              </div>
              <div class="col-md-4">
                <label class="form-label">VAT Certificate Document</label>
                <input type="file" class="filepond" id="qAttachVAT" name="vat_certificate" />
              </div>
              <div class="col-md-4">
                <label class="form-label">Request Document</label>
                <input type="file" class="filepond" id="qAttachReq" name="request_document" />
              </div>
            </div>
          </div>
        </div>

        <div style="display:flex;gap:12px;justify-content:flex-end;margin-top:16px">
          <button class="btn-secondary-gray" id="cancelQuotBtn">Cancel</button>
          <button class="btn-primary-green" id="submitQuotBtn"><i class="bi bi-envelope"></i> Submit Quotation</button>
        </div>
      </div>
    </div>
  `;

  bindAddViewEvents(container);
}

function initSelect2() {
  if (typeof window.jQuery === 'undefined' || typeof window.jQuery.fn.select2 === 'undefined') return;
  const $ = window.jQuery;
  const selects = ['#qRegion', '#qCity', '#qManufacturer', '#qModel', '#qCategory', '#qSubcategory', '#qYear', '#qColor', '#qAdditions', '#qRentType'];
  selects.forEach(sel => {
    const el = $(sel);
    if (el.length && !el.hasClass('select2-hidden-accessible')) {
      el.select2({ width: '100%', placeholder: 'Select', allowClear: true });
    }
  });
}

function destroySelect2() {
  if (typeof window.jQuery === 'undefined' || typeof window.jQuery.fn.select2 === 'undefined') return;
  const $ = window.jQuery;
  $('.select2-hidden-accessible').each(function () {
    try { $(this).select2('destroy'); } catch (e) {}
  });
}

function initFilePond() {
  if (typeof window.FilePond === 'undefined') return;
  filepondInstances.forEach(i => { try { i.destroy(); } catch (e) {} });
  filepondInstances = [];

  if (window.FilePondPluginFileValidateType) window.FilePond.registerPlugin(window.FilePondPluginFileValidateType);
  if (window.FilePondPluginImagePreview) window.FilePond.registerPlugin(window.FilePondPluginImagePreview);

  const configs = [
    { id: 'qAttachCR', key: 'commercial_register' },
    { id: 'qAttachVAT', key: 'vat_certificate' },
    { id: 'qAttachReq', key: 'request_document' }
  ];

  configs.forEach(cfg => {
    const el = document.getElementById(cfg.id);
    if (!el) return;
    const pond = window.FilePond.create(el, {
      labelIdle: 'You can drag and drop <span class="filepond--label-action">Browse</span>',
      acceptedFileTypes: ['image/*', 'application/pdf'],
      allowMultiple: false,
      credits: false
    });
    pond.on('addfile', (err, item) => {
      if (!err && item) attachmentFiles[cfg.key] = { name: item.filename, size: item.fileSize, type: item.fileType };
    });
    pond.on('removefile', () => { attachmentFiles[cfg.key] = null; });
    filepondInstances.push(pond);
  });
}

function bindAddViewEvents(container) {
  attachmentFiles = { commercial_register: null, vat_certificate: null, request_document: null };
  initSelect2();
  initFilePond();

  document.getElementById('qManufacturer').addEventListener('change', (e) => {
    const modelSelect = document.getElementById('qModel');
    const models = manufacturerModels[e.target.value] || [];
    modelSelect.innerHTML = '<option value="">Select</option>' + models.map(m => `<option value="${m}">${m}</option>`).join('');
    if (window.jQuery) window.jQuery(modelSelect).trigger('change.select2');
  });

  document.getElementById('cancelQuotBtn').addEventListener('click', () => renderQuotations());

  document.getElementById('addVehicleLineBtn').addEventListener('click', () => {
    const line = {
      manufacturer: document.getElementById('qManufacturer').value,
      model: document.getElementById('qModel').value,
      category: document.getElementById('qCategory').value,
      subcategory: document.getElementById('qSubcategory').value,
      year: document.getElementById('qYear').value,
      color: document.getElementById('qColor').value,
      quantity: parseInt(document.getElementById('qQty').value) || 1,
      additions: getSelectedValues('qAdditions'),
      rentType: getSelectedValues('qRentType'),
      description: document.getElementById('qLineDescription').value || ''
    };

    if (!line.manufacturer || !line.model || !line.category || !line.subcategory || !line.year || !line.color) {
      showToast('Please fill all required vehicle fields', 'error');
      return;
    }
    if (line.rentType.length === 0) {
      showToast('Please select at least one Rent Type', 'error');
      return;
    }

    vehicleLines.push(line);
    showToast('Vehicle added');
    renderVehicleLinesTable();
    resetVehicleFields();
  });

  document.getElementById('submitQuotBtn').addEventListener('click', async () => {
    const fullName = document.getElementById('qFullName').value.trim();
    const email = document.getElementById('qEmail').value.trim();
    const phone = document.getElementById('qPhone').value.trim();
    const company = document.getElementById('qCompany').value.trim();
    const region = document.getElementById('qRegion').value;
    const city = document.getElementById('qCity').value;
    const description = document.getElementById('qDescription').value.trim();

    if (!fullName || !email) { showToast('Please fill name and email', 'error'); return; }
    if (!/^\S+@\S+\.\S+$/.test(email)) { showToast('Please enter a valid email', 'error'); return; }
    if (vehicleLines.length === 0) { showToast('Please add at least one vehicle', 'error'); return; }

    const btn = document.getElementById('submitQuotBtn');
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Submitting...';

    const num = `QOT-${new Date().getFullYear()}-${String(allItems.length + 1).padStart(3, '0')}`;
    const meta = { email, phone, company, region, city, description, vehicles: vehicleLines, attachments: attachmentFiles };

    const { error } = await supabase.from('quotations').insert({
      quotation_number: num,
      client_name: fullName,
      vehicle_type: vehicleLines[0]?.category || 'sedan',
      duration_months: parseInt(vehicleLines[0]?.rentType?.[0]) || 12,
      quantity: vehicleLines.reduce((s, v) => s + (v.quantity || 1), 0),
      estimated_rate: 0,
      total_amount: 0,
      status: 'sent_to_customer',
      notes: JSON.stringify(meta)
    });

    if (error) {
      btn.disabled = false;
      btn.innerHTML = '<i class="bi bi-envelope"></i> Submit Quotation';
      showToast(error.message, 'error');
      return;
    }

    try {
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-quotation-email`;
      const resp = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          to: email,
          fullName,
          company,
          phone,
          region,
          city,
          quotationNumber: num,
          vehicles: vehicleLines,
          description
        })
      });
      const result = await resp.json();
      if (!resp.ok) {
        showToast(`Saved but email failed: ${result.error || 'unknown'}`, 'warning');
      } else {
        showToast(`Quotation submitted and email sent to ${email}`);
      }
    } catch (e) {
      showToast(`Saved, but email delivery failed: ${e.message}`, 'warning');
    }

    renderQuotations();
  });
}

function getSelectedValues(id) {
  const el = document.getElementById(id);
  if (!el) return [];
  return Array.from(el.selectedOptions).map(o => o.value);
}

function resetVehicleFields() {
  document.getElementById('qManufacturer').value = '';
  document.getElementById('qModel').innerHTML = '<option value="">Select</option>';
  document.getElementById('qCategory').value = '';
  document.getElementById('qSubcategory').value = '';
  document.getElementById('qYear').value = '';
  document.getElementById('qColor').value = '';
  document.getElementById('qQty').value = '1';
  document.getElementById('qLineDescription').value = '';
  Array.from(document.getElementById('qAdditions').options).forEach(o => o.selected = false);
  Array.from(document.getElementById('qRentType').options).forEach(o => o.selected = false);
}

function renderVehicleLinesTable() {
  const countEl = document.getElementById('vehicleLineCount');
  countEl.textContent = `${vehicleLines.length} vehicle${vehicleLines.length !== 1 ? 's' : ''}`;

  const tableContainer = document.getElementById('vehicleLinesTable');
  if (vehicleLines.length === 0) {
    tableContainer.innerHTML = `<div class="data-card-body">${emptyState('bi-truck-front', 'No Vehicles Added', 'Use the form above to add vehicles to this quotation.')}</div>`;
    return;
  }

  tableContainer.innerHTML = `
    <table class="data-table">
      <thead>
        <tr><th>#</th><th>Vehicle</th><th>Category</th><th>Subcategory</th><th>Year</th><th>Color</th><th>Qty</th><th>Rent Type</th><th>Additions</th><th>Action</th></tr>
      </thead>
      <tbody>
        ${vehicleLines.map((v, i) => `
          <tr>
            <td>${i + 1}</td>
            <td><strong>${v.manufacturer} ${v.model}</strong></td>
            <td style="text-transform:capitalize">${v.category}</td>
            <td style="text-transform:capitalize">${v.subcategory}</td>
            <td>${v.year}</td>
            <td>${v.color}</td>
            <td>${v.quantity}</td>
            <td>${(v.rentType || []).join(', ')}</td>
            <td>${(v.additions || []).join(', ') || '-'}</td>
            <td><button class="btn-icon delete" data-remove-line="${i}" title="Remove"><i class="bi bi-trash"></i></button></td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;

  document.querySelectorAll('[data-remove-line]').forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = parseInt(btn.dataset.removeLine);
      vehicleLines.splice(idx, 1);
      showToast('Vehicle removed');
      renderVehicleLinesTable();
    });
  });
}

function filterRender() {
  const q = (document.getElementById('quotSearchNum').value || '').toLowerCase();
  const st = document.getElementById('quotStatusFilter').value;
  const filtered = allItems.filter(item => {
    const text = `${item.quotation_number} ${item.client_name}`.toLowerCase();
    return (!q || text.includes(q)) && (!st || item.status === st);
  });
  const container = document.getElementById('pageContent');
  document.getElementById('quotTableContainer').innerHTML = buildTable(filtered);
  bindTableActions(container);
}

function bindTableActions(container) {
  document.querySelectorAll('#quotTableContainer [data-view]').forEach(btn => {
    btn.addEventListener('click', () => {
      const q = allItems.find(x => x.id === btn.dataset.view);
      if (!q) return;
      renderDetailView(container, q);
    });
  });
  document.querySelectorAll('#quotTableContainer [data-delete]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const res = await window.Swal.fire({ title: 'Delete this quotation?', icon: 'warning', showCancelButton: true, confirmButtonColor: '#dc3545', confirmButtonText: 'Delete', cancelButtonText: 'Cancel' });
      if (!res.isConfirmed) return;
      const { error } = await supabase.from('quotations').delete().eq('id', btn.dataset.delete);
      if (error) { showToast(error.message, 'error'); return; }
      showToast('Quotation deleted');
      renderQuotations();
    });
  });
}
