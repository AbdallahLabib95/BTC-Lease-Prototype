export function formatCurrency(amount) {
  const n = Number(amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return `SAR ${n}`;
}

export function formatDate(dateStr) {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

export function statusBadge(status) {
  const label = (status || '').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  return `<span class="badge-status ${status}">${label}</span>`;
}

export function priorityBadge(priority) {
  return `<span class="badge-priority ${priority}">${(priority || '').toUpperCase()}</span>`;
}

export function severityBadge(severity) {
  return `<span class="badge-severity ${severity}">${(severity || '').toUpperCase()}</span>`;
}

export function showToast(message, type = 'success') {
  const Swal = window.Swal;
  if (!Swal) return;
  const icon = type === 'error' ? 'error' : type === 'warning' ? 'warning' : type === 'info' ? 'info' : 'success';
  Swal.fire({
    toast: true,
    position: 'top-end',
    icon,
    title: message,
    showConfirmButton: false,
    timer: 3000,
    timerProgressBar: true
  });
}

export async function showConfirm(message, title = 'Are you sure?', confirmText = 'Yes') {
  const Swal = window.Swal;
  if (!Swal) return window.confirm(message);
  const result = await Swal.fire({
    title,
    text: message,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#0f7b3e',
    cancelButtonColor: '#6b7280',
    confirmButtonText: confirmText,
    cancelButtonText: 'Cancel'
  });
  return result.isConfirmed;
}

export function showAlert(message, type = 'info', title = '') {
  const Swal = window.Swal;
  if (!Swal) { window.alert(message); return; }
  const icon = type === 'error' ? 'error' : type === 'warning' ? 'warning' : type === 'success' ? 'success' : 'info';
  Swal.fire({ title: title || undefined, text: message, icon, confirmButtonColor: '#0f7b3e' });
}

export function loadingSpinner() {
  return '<div class="loading-spinner"><div class="spinner"></div></div>';
}

export function emptyState(icon, title, desc) {
  return `<div class="empty-state"><i class="bi ${icon}"></i><h4>${title}</h4><p>${desc}</p></div>`;
}

export function plateBadge(plate) {
  return `<span class="vehicle-plate"><span class="plate-badge">${plate}</span></span>`;
}
