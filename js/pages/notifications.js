import { supabase } from '../supabase-client.js';
import { formatDate, showToast, loadingSpinner } from '../utils.js';

let allNotifications = [];

export async function renderNotifications() {
  const container = document.getElementById('pageContent');
  container.innerHTML = loadingSpinner();

  const [agreements, maintenance, incidents] = await Promise.all([
    supabase.from('agreements').select('*'),
    supabase.from('maintenance_schedules').select('*, vehicles(plate_number, make, model)'),
    supabase.from('incidents').select('*, vehicles(plate_number, make, model)')
  ]);

  const ag = agreements.data || [];
  const m = maintenance.data || [];
  const inc = incidents.data || [];

  allNotifications = [];

  ag.filter(a => {
    if (a.status !== 'active') return false;
    const diff = (new Date(a.end_date) - new Date()) / (1000 * 60 * 60 * 24);
    return diff <= 30 && diff > 0;
  }).forEach(a => {
    const days = Math.ceil((new Date(a.end_date) - new Date()) / (1000 * 60 * 60 * 24));
    allNotifications.push({
      id: a.id,
      message: `Agreement ${a.agreement_number} for ${a.client_name} expires in ${days} days`,
      date: a.end_date,
      type: 'agreement'
    });
  });

  m.filter(x => x.status === 'scheduled').forEach(item => {
    allNotifications.push({
      id: item.id,
      message: `${item.maintenance_type} scheduled for ${item.vehicles ? item.vehicles.make + ' ' + item.vehicles.model : 'vehicle'} on ${formatDate(item.scheduled_date)}`,
      date: item.scheduled_date,
      type: 'maintenance'
    });
  });

  inc.filter(x => x.status === 'reported' || x.status === 'under_review').forEach(item => {
    allNotifications.push({
      id: item.id,
      message: `Incident (${item.incident_type}) for ${item.vehicles ? item.vehicles.make + ' ' + item.vehicles.model : 'vehicle'} - ${item.status.replace('_', ' ')}`,
      date: item.incident_date,
      type: 'incident'
    });
  });

  allNotifications.sort((a, b) => new Date(b.date) - new Date(a.date));

  renderView(container);
}

function renderView(container) {
  container.innerHTML = `
    <div class="fade-in">
      <div class="page-section" style="padding-top:32px">
        <h1 style="font-size:24px;font-weight:700;margin-bottom:16px">Notifications</h1>

        <div style="display:flex;gap:12px;margin-bottom:24px">
          <button class="btn-primary-green" id="markAllReadBtn"><i class="bi bi-envelope-fill"></i> Mark All As Read</button>
          <button style="display:inline-flex;align-items:center;gap:8px;padding:10px 24px;background:var(--danger);color:#fff;border:none;border-radius:6px;font-size:14px;font-weight:600;cursor:pointer" id="deleteAllBtn"><i class="bi bi-trash-fill"></i> Delete All</button>
        </div>

        <div class="data-card">
          <div style="display:flex;justify-content:flex-end;padding:16px 16px 0">
            <div style="display:flex;align-items:center;gap:8px"><span style="font-size:14px;color:var(--text-secondary)">Search:</span><input type="text" class="form-control" id="notifSearch" style="width:200px;padding:6px 12px;font-size:13px"></div>
          </div>
          <div class="table-container" id="notifTableContainer">
            ${buildTable(allNotifications)}
          </div>
          <div class="table-footer-info" id="notifFooter">
            <span>Showing ${allNotifications.length > 0 ? '1' : '0'} to ${allNotifications.length} of ${allNotifications.length} entries</span>
            <div class="pagination-links"><a>Previous</a><a>Next</a></div>
          </div>
        </div>
      </div>
    </div>
  `;

  document.getElementById('markAllReadBtn').addEventListener('click', () => {
    showToast('All notifications marked as read');
  });

  document.getElementById('deleteAllBtn').addEventListener('click', () => {
    allNotifications = [];
    document.getElementById('notifTableContainer').innerHTML = buildTable([]);
    document.getElementById('notifFooter').querySelector('span').textContent = 'Showing 0 to 0 of 0 entries';
    showToast('All notifications deleted');
  });

  document.getElementById('notifSearch').addEventListener('input', function () {
    const q = this.value.toLowerCase();
    const filtered = allNotifications.filter(n => n.message.toLowerCase().includes(q));
    document.getElementById('notifTableContainer').innerHTML = buildTable(filtered);
  });

  document.querySelectorAll('#notifTableContainer [data-dismiss]').forEach(btn => {
    btn.addEventListener('click', () => {
      allNotifications = allNotifications.filter(n => n.id !== btn.dataset.dismiss);
      document.getElementById('notifTableContainer').innerHTML = buildTable(allNotifications);
      document.getElementById('notifFooter').querySelector('span').textContent = `Showing ${allNotifications.length > 0 ? '1' : '0'} to ${allNotifications.length} of ${allNotifications.length} entries`;
      showToast('Notification dismissed');
    });
  });
}

function buildTable(items) {
  return `
    <table class="data-table">
      <thead><tr><th>Notification</th><th>Date & Time</th><th>Action</th></tr></thead>
      <tbody>
        ${items.length === 0
          ? '<tr><td colspan="3" class="no-data-text">No data available in table</td></tr>'
          : items.map(n => `<tr>
              <td>${n.message}</td>
              <td>${formatDate(n.date)}</td>
              <td><button class="btn-icon delete" data-dismiss="${n.id}" title="Dismiss"><i class="bi bi-x-lg"></i></button></td>
            </tr>`).join('')}
      </tbody>
    </table>`;
}
