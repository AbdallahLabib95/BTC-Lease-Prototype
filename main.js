import 'bootstrap/dist/css/bootstrap.min.css';
import './style.css';
import * as bootstrap from 'bootstrap';

import { renderLogin } from './js/pages/login.js';
import { renderDashboard } from './js/pages/dashboard.js';
import { renderMaintenance } from './js/pages/maintenance.js';
import { renderReplacement } from './js/pages/replacement.js';
import { renderDrivers } from './js/pages/drivers.js';
import { renderIncidents } from './js/pages/incidents.js';
import { renderVehicleRequest } from './js/pages/vehicle-request.js';
import { renderAgreements } from './js/pages/agreements.js';
import { renderExtensions } from './js/pages/extensions.js';
import { renderEarlyTerminations } from './js/pages/early-terminations.js';
import { renderQuotations } from './js/pages/quotations.js';
import { renderInvoices } from './js/pages/invoices.js';
import { renderPurchaseOrder } from './js/pages/purchase-order.js';
import { renderTodoList } from './js/pages/todolist.js';
import { renderNotifications } from './js/pages/notifications.js';
import { renderFleet } from './js/pages/fleet.js';
import { supabase } from './js/supabase-client.js';
import { showToast } from './js/utils.js';

window.bootstrap = bootstrap;

const pageMap = {
  dashboard: { title: 'Dashboard', render: renderDashboard },
  maintenance: { title: 'Scheduled Maintenance', render: renderMaintenance },
  replacement: { title: 'Request Replacement', render: renderReplacement },
  drivers: { title: 'Replace Driver', render: renderDrivers },
  incidents: { title: 'Incident Coverage', render: renderIncidents },
  'vehicle-request': { title: 'Request New Vehicle', render: renderVehicleRequest },
  agreements: { title: 'Agreements', render: renderAgreements },
  extensions: { title: 'Extend Agreement Requests', render: renderExtensions },
  'early-terminations': { title: 'Early Termination Requests', render: renderEarlyTerminations },
  quotations: { title: 'Request Quotations', render: renderQuotations },
  invoices: { title: 'Invoices', render: renderInvoices },
  'purchase-order': { title: 'Purchase Order', render: renderPurchaseOrder },
  todolist: { title: 'To Do List', render: renderTodoList },
  notifications: { title: 'Notifications', render: renderNotifications },
  fleet: { title: 'Fleet Management', render: renderFleet }
};

let appInitialized = false;

function initApp() {
  if (sessionStorage.getItem('btc_logged_in') === 'true') {
    startApp();
  } else {
    renderLogin(startApp);
  }
}

function startApp() {
  appInitialized = true;
  buildAppShell();
  bindEvents();
  navigateTo('dashboard');
}

function buildAppShell() {
  const app = document.getElementById('app');
  app.innerHTML = `
    <nav class="site-navbar">
      <div class="navbar-container">
        <a href="#" class="brand" data-page="dashboard">
          <div class="brand-logo">
            <span class="brand-name">BTC</span>
            <span class="brand-tagline">Rent a Vehicle</span>
          </div>
        </a>
        <button class="mobile-toggle" id="mobileToggle"><i class="bi bi-list"></i></button>
        <ul class="nav-menu" id="navMenu">
          <li>
            <a href="#" data-page="dashboard">Dashboard <i class="bi bi-chevron-down caret"></i></a>
            <div class="dropdown-menu-custom">
              <a href="#" data-page="dashboard"><i class="bi bi-grid-1x2-fill"></i> Home</a>
              <a href="#" data-page="todolist"><i class="bi bi-list-check"></i> To Do List</a>
            </div>
          </li>
          <li><a href="#" data-page="agreements">Agreements</a></li>
          <li><a href="#" data-page="fleet">Fleet</a></li>
          <li>
            <a href="#">Services Request <i class="bi bi-chevron-down caret"></i></a>
            <div class="dropdown-menu-custom">
              <a href="#" data-page="replacement"><i class="bi bi-arrow-repeat"></i> Request Replacement</a>
              <a href="#" data-page="maintenance"><i class="bi bi-wrench-adjustable"></i> Scheduled Maintenance</a>
              <a href="#" data-page="drivers"><i class="bi bi-person-badge"></i> Replace Driver</a>
              <a href="#" data-page="incidents"><i class="bi bi-shield-exclamation"></i> Incident Coverage</a>
              <a href="#" data-page="vehicle-request"><i class="bi bi-plus-circle-fill"></i> Request New Vehicle</a>
              <a href="#" data-page="extensions"><i class="bi bi-calendar2-plus"></i> Extend Agreement Requests</a>
              <a href="#" data-page="early-terminations"><i class="bi bi-calendar2-x"></i> Early Termination Requests</a>
            </div>
          </li>
          <li><a href="#" data-page="quotations">Request Quotations</a></li>
          <li><a href="#" data-page="purchase-order">Purchase Order</a></li>
          <li><a href="#" data-page="invoices">Invoices</a></li>
        </ul>
        <div class="navbar-right">
          <div class="nav-profile-area">
            <span class="nav-profile-link"><i class="bi bi-person-circle"></i> My Profile <i class="bi bi-chevron-down caret"></i></span>
            <div class="dropdown-menu-custom profile-dropdown">
              <a href="#" id="clearDataBtn"><i class="bi bi-trash3"></i> Clear All Site Data</a>
              <a href="#" id="logoutBtn"><i class="bi bi-box-arrow-right"></i> Logout</a>
            </div>
          </div>
          <span class="nav-lang-btn">EN <i class="bi bi-chevron-down caret"></i></span>
          <span class="nav-notification"><i class="bi bi-bell-fill"></i></span>
        </div>
      </div>
    </nav>
    <div class="mobile-overlay" id="mobileOverlay"></div>
    <div id="pageContent" class="page-content"></div>
    <footer class="site-footer">
      <div class="footer-container">
        <div class="row g-4">
          <div class="col-lg-3 col-md-6">
            <h5><span class="footer-title-accent">Our</span> Services</h5>
            <div class="footer-title-underline"></div>
            <ul class="footer-links">
              <li><a href="#" data-page="quotations">Chauffeur Service</a></li>
              <li><a href="#" data-page="vehicle-request">Vehicle Leasing</a></li>
              <li><a href="#" data-page="maintenance">Maintenance Service</a></li>
            </ul>
          </div>
          <div class="col-lg-3 col-md-6">
            <h5><span class="footer-title-accent">Quick</span> Links</h5>
            <div class="footer-title-underline"></div>
            <ul class="footer-links">
              <li><a href="#" data-page="dashboard">Contact Us</a></li>
              <li><a href="#" data-page="dashboard">About Us</a></li>
              <li><a href="#" data-page="dashboard">Privacy Policy</a></li>
            </ul>
          </div>
          <div class="col-lg-3 col-md-6">
            <h5><span class="footer-title-accent">Call</span> Us</h5>
            <div class="footer-title-underline"></div>
            <ul class="footer-contact">
              <li><i class="bi bi-telephone-fill"></i> 9200 10 200</li>
              <li><i class="bi bi-envelope-fill"></i> info@btcrent.com</li>
              <li><i class="bi bi-geo-alt-fill"></i> Business District, Riyadh</li>
            </ul>
          </div>
          <div class="col-lg-3 col-md-6">
            <h5><span class="footer-title-accent">Follow</span> Us</h5>
            <div class="footer-title-underline"></div>
            <div class="footer-social">
              <a href="#" class="social-icon"><i class="bi bi-facebook"></i></a>
              <a href="#" class="social-icon"><i class="bi bi-twitter-x"></i></a>
              <a href="#" class="social-icon"><i class="bi bi-instagram"></i></a>
              <a href="#" class="social-icon"><i class="bi bi-linkedin"></i></a>
            </div>
          </div>
        </div>
        <div class="footer-bottom">
          &copy; ${new Date().getFullYear()} BTC Rent a Vehicle. All rights reserved.
        </div>
      </div>
    </footer>
  `;
}

function navigateTo(page) {
  if (!pageMap[page]) return;

  document.querySelectorAll('.nav-menu > li > a').forEach(a => a.classList.remove('active'));

  const directLink = document.querySelector(`.nav-menu > li > a[data-page="${page}"]`);
  if (directLink) {
    directLink.classList.add('active');
  } else {
    const dropdownLink = document.querySelector(`.nav-menu .dropdown-menu-custom a[data-page="${page}"]`);
    if (dropdownLink) {
      const parentA = dropdownLink.closest('li').querySelector(':scope > a');
      if (parentA) parentA.classList.add('active');
    }
  }

  closeMobileMenu();
  window.scrollTo({ top: 0, behavior: 'smooth' });
  pageMap[page].render();
}

function closeMobileMenu() {
  const navMenu = document.getElementById('navMenu');
  const overlay = document.getElementById('mobileOverlay');
  if (navMenu) navMenu.classList.remove('show');
  if (overlay) overlay.classList.remove('show');
  document.querySelectorAll('.nav-menu > li').forEach(li => li.classList.remove('open'));
}

async function handleClearAllData() {
  const Swal = window.Swal;
  const res = await Swal.fire({
    title: 'Clear All Data?',
    text: 'This will permanently delete ALL data from the database (vehicles, agreements, quotations, invoices, incidents, etc). Continue?',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#dc3545',
    cancelButtonColor: '#6b7280',
    confirmButtonText: 'Yes, clear all',
    cancelButtonText: 'Cancel'
  });
  if (!res.isConfirmed) return;

  const tables = [
    'quotation_vehicles',
    'invoices',
    'early_terminations',
    'agreement_extensions',
    'agreements',
    'quotations',
    'vehicle_requests',
    'incidents',
    'driver_replacements',
    'replacement_requests',
    'maintenance_schedules',
    'vehicles'
  ];

  try {
    for (const t of tables) {
      const { error } = await supabase.from(t).delete().neq('id', '00000000-0000-0000-0000-000000000000');
      if (error) throw new Error(`${t}: ${error.message}`);
    }
    showToast('All site data cleared');
    navigateTo('dashboard');
  } catch (err) {
    showToast(err.message || 'Failed to clear data', 'error');
  }
}

function handleLogout() {
  sessionStorage.removeItem('btc_logged_in');
  appInitialized = false;
  renderLogin(startApp);
}

function bindEvents() {
  document.addEventListener('click', e => {
    const logoutBtn = e.target.closest('#logoutBtn');
    if (logoutBtn) {
      e.preventDefault();
      handleLogout();
      return;
    }

    const clearBtn = e.target.closest('#clearDataBtn');
    if (clearBtn) {
      e.preventDefault();
      handleClearAllData();
      return;
    }

    if (!appInitialized) return;

    const pageLink = e.target.closest('[data-page]');
    if (pageLink) {
      e.preventDefault();
      navigateTo(pageLink.dataset.page);
      return;
    }

    if (window.innerWidth < 992) {
      const dropdownParent = e.target.closest('.nav-menu > li');
      if (dropdownParent && dropdownParent.querySelector('.dropdown-menu-custom')) {
        const directA = dropdownParent.querySelector(':scope > a');
        if (e.target.closest('a') === directA && !directA.dataset.page) {
          e.preventDefault();
          dropdownParent.classList.toggle('open');
          return;
        }
      }
    }

    const profileArea = e.target.closest('.nav-profile-area');
    if (profileArea) {
      profileArea.classList.toggle('open');
      return;
    }
    document.querySelectorAll('.nav-profile-area').forEach(el => el.classList.remove('open'));
  });

  document.getElementById('mobileToggle').addEventListener('click', () => {
    document.getElementById('navMenu').classList.toggle('show');
    document.getElementById('mobileOverlay').classList.toggle('show');
  });

  document.getElementById('mobileOverlay').addEventListener('click', closeMobileMenu);

  document.querySelector('.nav-notification').addEventListener('click', () => {
    navigateTo('notifications');
  });
}

initApp();