export function renderLogin(onLogin) {
  const app = document.getElementById('app');

  app.innerHTML = `
    <div class="login-page">
      <div class="login-bg-shapes">
        <div class="login-shape login-shape-1"></div>
        <div class="login-shape login-shape-2"></div>
        <div class="login-shape login-shape-3"></div>
      </div>
      <div class="login-container">
        <div class="login-card">
          <div class="login-header">
            <div class="login-logo">
              <div class="login-logo-icon">
                <i class="bi bi-truck"></i>
              </div>
              <div class="login-brand">
                <span class="login-brand-name">BTC</span>
                <span class="login-brand-tagline">Rent a Vehicle</span>
              </div>
            </div>
            <h1 class="login-title">Welcome Back</h1>
            <p class="login-subtitle">Sign in to manage your fleetssssss</p>
          </div>
          <form id="loginForm" class="login-form">
            <div class="login-field">
              <label class="login-label" for="loginEmail">
                <i class="bi bi-envelope"></i> Email Address
              </label>
              <input type="text" id="loginEmail" class="login-input" placeholder="Enter your email" value="admin@btcrent.com" autocomplete="off">
            </div>
            <div class="login-field">
              <label class="login-label" for="loginPassword">
                <i class="bi bi-lock"></i> Password
              </label>
              <div class="login-password-wrap">
                <input type="password" id="loginPassword" class="login-input" placeholder="Enter your password" value="admin123" autocomplete="off">
                <button type="button" class="login-eye-btn" id="togglePassword">
                  <i class="bi bi-eye"></i>
                </button>
              </div>
            </div>
            <div class="login-options">
              <label class="login-checkbox-label">
                <input type="checkbox" checked> <span>Remember me</span>
              </label>
              <a href="#" class="login-forgot" onclick="event.preventDefault()">Forgot password?</a>
            </div>
            <button type="submit" class="login-btn" id="loginBtn">
              <span class="login-btn-text">Sign In</span>
              <i class="bi bi-arrow-right"></i>
            </button>
          </form>
          <div class="login-footer">
            <p>&copy; ${new Date().getFullYear()} BTC Rent a Vehicle. All rights reserved.</p>
          </div>
        </div>
      </div>
    </div>
  `;

  document.getElementById('togglePassword').addEventListener('click', () => {
    const pw = document.getElementById('loginPassword');
    const icon = document.querySelector('#togglePassword i');
    if (pw.type === 'password') {
      pw.type = 'text';
      icon.className = 'bi bi-eye-slash';
    } else {
      pw.type = 'password';
      icon.className = 'bi bi-eye';
    }
  });

  document.getElementById('loginForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const btn = document.getElementById('loginBtn');
    btn.classList.add('login-btn-loading');
    btn.innerHTML = '<span class="login-spinner"></span> Signing in...';

    setTimeout(() => {
      sessionStorage.setItem('btc_logged_in', 'true');
      onLogin();
    }, 800);
  });
}
