import { supabase } from '../supabase-client.js';
import { loadingSpinner, emptyState } from '../utils.js';

let allVehicles = [];
let selectedCategories = new Set();
let selectedManufacturers = new Set();

const DEFAULT_IMAGES = {
  sedan: 'https://images.pexels.com/photos/112460/pexels-photo-112460.jpeg?auto=compress&cs=tinysrgb&w=400',
  suv: 'https://images.pexels.com/photos/1638459/pexels-photo-1638459.jpeg?auto=compress&cs=tinysrgb&w=400',
  truck: 'https://images.pexels.com/photos/2533092/pexels-photo-2533092.jpeg?auto=compress&cs=tinysrgb&w=400',
  van: 'https://images.pexels.com/photos/1149137/pexels-photo-1149137.jpeg?auto=compress&cs=tinysrgb&w=400',
  convertible: 'https://images.pexels.com/photos/210019/pexels-photo-210019.jpeg?auto=compress&cs=tinysrgb&w=400',
};

export async function renderFleet() {
  const container = document.getElementById('pageContent');
  container.innerHTML = loadingSpinner();

  const { data } = await supabase.from('vehicles').select('*').order('created_at', { ascending: false });
  allVehicles = data || [];
  selectedCategories = new Set();
  selectedManufacturers = new Set();

  container.innerHTML = `
    <div class="fade-in">
      <div class="page-section" style="padding-top:24px">
        <div style="background:#f5f6f8;border-radius:6px;padding:14px 20px;text-align:center;margin-bottom:24px">
          <h2 style="margin:0;font-size:18px;font-weight:700;color:#2874a6">Fleet Management</h2>
        </div>

        <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;margin-bottom:20px">
          <div style="display:flex;gap:12px;flex-wrap:wrap;align-items:center">
            <div class="search-input-group" style="min-width:260px">
              <i class="bi bi-search"></i>
              <input type="text" class="form-control" id="fleetSearch" placeholder="Search by plate, make, model...">
            </div>
            <select class="form-select filter-select" id="fleetStatusFilter" style="min-width:160px">
              <option value="">All Status</option>
              <option value="available">Available</option>
              <option value="rented">Rented</option>
              <option value="maintenance">Maintenance</option>
              <option value="retired">Retired</option>
            </select>
          </div>
        </div>

        <div class="fleet-layout">
          <aside class="fleet-sidebar">
            <div class="fleet-filter-card">
              <h4 class="fleet-filter-title">Vehicle Type</h4>
              <div id="categoryFilters"></div>
            </div>
            <div class="fleet-filter-card">
              <h4 class="fleet-filter-title">Manufacturer</h4>
              <div id="manufacturerFilters"></div>
            </div>
          </aside>

          <div class="fleet-content" id="fleetContent"></div>
        </div>
      </div>
    </div>
  `;

  renderFilters();
  renderVehicleCards();
  bindFleetEvents();
}

function renderFilters() {
  const categories = {};
  const manufacturers = {};
  allVehicles.forEach(v => {
    if (v.category) categories[v.category] = (categories[v.category] || 0) + 1;
    if (v.make) manufacturers[v.make] = (manufacturers[v.make] || 0) + 1;
  });

  document.getElementById('categoryFilters').innerHTML = Object.keys(categories).length === 0
    ? '<div style="font-size:13px;color:var(--text-muted);padding:6px 0">No categories yet</div>'
    : Object.entries(categories).map(([cat, count]) => `
      <label class="fleet-checkbox">
        <input type="checkbox" value="${cat}" data-filter="category" ${selectedCategories.has(cat) ? 'checked' : ''}>
        <span style="text-transform:capitalize">${cat}</span>
        <span class="fleet-count">${count}</span>
      </label>
    `).join('');

  document.getElementById('manufacturerFilters').innerHTML = Object.keys(manufacturers).length === 0
    ? '<div style="font-size:13px;color:var(--text-muted);padding:6px 0">No manufacturers yet</div>'
    : Object.entries(manufacturers).sort((a,b) => b[1]-a[1]).map(([make, count]) => `
      <label class="fleet-checkbox">
        <input type="checkbox" value="${make}" data-filter="manufacturer" ${selectedManufacturers.has(make) ? 'checked' : ''}>
        <span>${make}</span>
        <span class="fleet-count">${count}</span>
      </label>
    `).join('');

  document.querySelectorAll('.fleet-checkbox input').forEach(cb => {
    cb.addEventListener('change', () => {
      const set = cb.dataset.filter === 'category' ? selectedCategories : selectedManufacturers;
      if (cb.checked) set.add(cb.value); else set.delete(cb.value);
      renderVehicleCards();
    });
  });
}

function getFilteredVehicles() {
  const search = (document.getElementById('fleetSearch')?.value || '').toLowerCase();
  const status = document.getElementById('fleetStatusFilter')?.value || '';
  return allVehicles.filter(v => {
    const matchSearch = !search || `${v.plate_number || ''} ${v.make || ''} ${v.model || ''}`.toLowerCase().includes(search);
    const matchStatus = !status || v.status === status;
    const matchCategory = selectedCategories.size === 0 || selectedCategories.has(v.category);
    const matchMake = selectedManufacturers.size === 0 || selectedManufacturers.has(v.make);
    return matchSearch && matchStatus && matchCategory && matchMake;
  });
}

function statusTag(status) {
  const map = {
    available: { bg: '#1a6b3c', text: 'Available' },
    rented: { bg: '#1a6b3c', text: 'Rented' },
    maintenance: { bg: '#e67e22', text: 'Maintenance' },
    retired: { bg: '#7d8388', text: 'Retired' },
  };
  const s = map[status] || map.available;
  return `<span style="background:${s.bg};color:#fff;padding:3px 12px;border-radius:4px;font-size:11px;font-weight:600">${s.text}</span>`;
}

function formatDate(d) {
  if (!d) return '—';
  try { return new Date(d).toISOString().slice(0,10); } catch { return d; }
}

function renderVehicleCards() {
  const container = document.getElementById('fleetContent');
  if (!container) return;
  const vehicles = getFilteredVehicles();

  if (vehicles.length === 0) {
    container.innerHTML = `<div class="data-card" style="padding:40px">${emptyState('bi-truck-front', 'No Vehicles Found', 'Try adjusting filters.')}</div>`;
    return;
  }

  container.innerHTML = vehicles.map(v => {
    const img = v.image_url || DEFAULT_IMAGES[v.category] || DEFAULT_IMAGES.sedan;
    return `
      <div class="fleet-vehicle-card">
        <div class="fleet-vehicle-img">
          <img src="${img}" alt="${v.make} ${v.model}" onerror="this.src='${DEFAULT_IMAGES.sedan}'">
        </div>
        <div class="fleet-vehicle-info">
          <div class="fleet-vehicle-header">
            <h3 class="fleet-vehicle-title">${v.make || '—'} - ${v.model || '—'}</h3>
            ${statusTag(v.status)}
          </div>
          <div class="fleet-vehicle-grid">
            <div><span class="fleet-label">Manufacturer Year :</span> <span class="fleet-value">${v.year || '—'}</span></div>
            <div><span class="fleet-label">Plate Number :</span> <span class="fleet-value">${v.plate_number || '—'}</span></div>
            <div><span class="fleet-label">Mileage :</span> <span class="fleet-value">${(v.mileage || 0).toLocaleString()}</span></div>
            <div><span class="fleet-label">Movement In :</span> <span class="fleet-value">${formatDate(v.movement_in)}</span></div>
            <div><span class="fleet-label">Insurance :</span> <span class="fleet-value">${v.insurance ?? '—'}</span></div>
            <div><span class="fleet-label">Movement Out :</span> <span class="fleet-value">${formatDate(v.movement_out)}</span></div>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function bindFleetEvents() {
  document.getElementById('fleetSearch').addEventListener('input', renderVehicleCards);
  document.getElementById('fleetStatusFilter').addEventListener('change', renderVehicleCards);
}
