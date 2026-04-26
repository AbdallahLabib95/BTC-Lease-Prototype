import { formatDate, loadingSpinner } from '../utils.js';

const DUMMY_PURCHASE_ORDERS = [
  { quotation_number: 'QOT-2025-001', po_number: 'PO-2025-001', po_date: '2025-01-15', rent_type: '12 months', created_date: '2025-01-10' },
  { quotation_number: 'QOT-2025-002', po_number: 'PO-2025-002', po_date: '2025-01-22', rent_type: '24 months', created_date: '2025-01-20' },
  { quotation_number: 'QOT-2025-003', po_number: 'PO-2025-003', po_date: '2025-02-05', rent_type: '36 months', created_date: '2025-02-01' },
  { quotation_number: 'QOT-2025-004', po_number: 'PO-2025-004', po_date: '2025-02-12', rent_type: '12 months', created_date: '2025-02-08' },
  { quotation_number: 'QOT-2024-099', po_number: 'PO-2024-099', po_date: '2024-12-28', rent_type: '12 months', created_date: '2024-12-20' },
  { quotation_number: 'QOT-2024-098', po_number: 'PO-2024-098', po_date: '2024-12-15', rent_type: '24 months', created_date: '2024-12-10' },
  { quotation_number: 'QOT-2024-097', po_number: 'PO-2024-097', po_date: '2024-11-30', rent_type: '12 months', created_date: '2024-11-25' }
];

let allItems = [];

export async function renderPurchaseOrder() {
  const container = document.getElementById('pageContent');
  container.innerHTML = loadingSpinner();

  allItems = [...DUMMY_PURCHASE_ORDERS];

  const today = new Date().toISOString().split('T')[0];

  container.innerHTML = `
    <div class="fade-in">
      <div class="page-section" style="padding-top:32px">
        <h1 style="font-size:24px;font-weight:700;margin-bottom:24px">Purchase Order</h1>

        <div class="row g-3 mb-3">
          <div class="col-md-4">
            <label class="form-label">Price Quotations Number</label>
            <input type="text" class="form-control" id="poSearchQuot" placeholder="Price Quotations Number">
          </div>
          <div class="col-md-4">
            <label class="form-label">Purchase Order Number</label>
            <input type="text" class="form-control" id="poSearchPo" placeholder="Purchase Order Number">
          </div>
          <div class="col-md-4">
            <label class="form-label">Created Date</label>
            <input type="date" class="form-control" id="poCreatedDate" value="${today}">
          </div>
        </div>
        <div style="text-align:center;margin-bottom:24px">
          <button class="btn-primary-green" id="poSearchBtn"><i class="bi bi-search"></i> Search</button>
        </div>

        <div class="data-card">
          <div class="table-container" id="poTableContainer">${buildTable(allItems)}</div>
          <div class="table-footer-info">
            <span>Showing 1 to ${allItems.length} of ${allItems.length} entries</span>
            <div class="pagination-links"><a>Previous</a><a>Next</a></div>
          </div>
        </div>
      </div>
    </div>
  `;

  document.getElementById('poSearchBtn').addEventListener('click', filterRender);
}

function buildTable(items) {
  if (items.length === 0) return `<div class="no-data-text">No data available in table</div>`;
  return `
    <table class="data-table">
      <thead><tr><th>#</th><th>Price Quotations Number</th><th>Purchase Order Number</th><th>PO Date</th><th>Rent Type</th><th>Created Date</th><th>Action</th></tr></thead>
      <tbody>
        ${items.map((q, i) => `
          <tr>
            <td>${i + 1}</td>
            <td><strong>${q.quotation_number}</strong></td>
            <td>${q.po_number}</td>
            <td>${formatDate(q.po_date)}</td>
            <td>${q.rent_type}</td>
            <td>${formatDate(q.created_date)}</td>
            <td>
              <button class="btn-icon edit" title="View"><i class="bi bi-eye"></i></button>
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>`;
}

function filterRender() {
  const q = (document.getElementById('poSearchQuot').value || '').toLowerCase();
  const p = (document.getElementById('poSearchPo').value || '').toLowerCase();
  const filtered = allItems.filter(item => {
    const qMatch = !q || item.quotation_number.toLowerCase().includes(q);
    const pMatch = !p || item.po_number.toLowerCase().includes(p);
    return qMatch && pMatch;
  });
  document.getElementById('poTableContainer').innerHTML = buildTable(filtered);
}
