// ==========================================
// THE CHRONICLE - Host Shell Main Javascript
// ==========================================

import { globalState, authService, errorBoundary, analytics, featureFlags } from 'shared';

// Theme Management linked to global state
function initTheme() {
  globalState.subscribe('theme', (theme) => {
    document.documentElement.setAttribute('data-theme', theme);
  });
}

document.getElementById('theme-toggle').addEventListener('click', () => {
  const currentTheme = globalState.getState('theme');
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  globalState.setState('theme', newTheme);
  localStorage.setItem('theme', newTheme);
});

// Sync subscription status with header button in real-time
function initAuthHeaderSync() {
  const subBtn = document.getElementById('premium-subscribe-btn');
  if (!subBtn) return;

  authService.onAuthChange((status) => {
    if (status && status.active) {
      subBtn.textContent = 'CHRONICLE+ MEMBER';
      subBtn.href = '/premium';
      subBtn.style.borderColor = 'var(--accent-premium)';
      subBtn.style.color = 'var(--accent-premium)';
      subBtn.style.backgroundColor = 'transparent';
    } else {
      subBtn.textContent = 'SUBSCRIBE';
      subBtn.href = '/premium';
      subBtn.style.borderColor = 'var(--text-primary)';
      subBtn.style.color = 'var(--bg-secondary)';
      subBtn.style.backgroundColor = 'var(--text-primary)';
    }
  });
}

// Current Date Renderer
function updateHeaderDate() {
  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  const today = new Date();
  document.getElementById('current-date').textContent = today.toLocaleDateString('en-US', options);
}

// MFE Routes and configuration
const routes = {
  '/': {
    appName: 'homeApp',
    modulePath: 'homeApp/Home',
    title: 'The Chronicle | Home'
  },
  '/video': {
    appName: 'videoApp',
    modulePath: 'videoApp/Video',
    title: 'The Chronicle | Video'
  },
  '/live': {
    appName: 'liveApp',
    modulePath: 'liveApp/Live',
    title: 'The Chronicle | Live coverage'
  },
  '/premium': {
    appName: 'premiumApp',
    modulePath: 'premiumApp/Premium',
    title: 'The Chronicle | Premium'
  }
};

const loadingSkeleton = document.getElementById('mfe-loading-skeleton');
const mfeContainer = document.getElementById('mfe-content-root');

// Map enabling Vite static-analysis for dynamic remotes
async function loadRemoteModule(path) {
  // Trigger loading analytics
  analytics.trackEvent('MFE', 'load_start', path);
  
  try {
    switch (path) {
      case '/':
        return await import('homeApp/Home');
      case '/video':
        return await import('videoApp/Video');
      case '/live':
        return await import('liveApp/Live');
      case '/premium':
        return await import('premiumApp/Premium');
      default:
        return await import('homeApp/Home');
    }
  } catch (error) {
    analytics.trackEvent('MFE', 'load_failed', path);
    throw error;
  }
}

// Navigate to a route and handle remote mounting securely
async function navigate(path) {
  // Update state route
  globalState.setState('route', path);

  if (window.location.pathname !== path) {
    window.history.pushState(null, '', path);
  }

  updateNavbarActiveState(path);

  // Show skeleton loading view
  loadingSkeleton.style.display = 'block';
  mfeContainer.style.display = 'none';
  mfeContainer.innerHTML = '';

  const route = routes[path] || routes['/'];
  document.title = route.title;

  const retryFn = () => navigate(path);

  try {
    // Lazy-load remote MFE
    const remoteModule = await loadRemoteModule(path);
    
    loadingSkeleton.style.display = 'none';
    mfeContainer.style.display = 'block';
    
    const mountFn = remoteModule.mount || (remoteModule.default && remoteModule.default.mount);
    if (typeof mountFn === 'function') {
      // Execute mount inside our error boundary wrapper
      await errorBoundary.safeMount(mfeContainer, route.appName, mountFn, navigate, retryFn);
      analytics.trackEvent('MFE', 'mount_success', route.appName);
    } else {
      throw new Error(`Remote module for ${route.appName} does not export a 'mount' function.`);
    }

  } catch (error) {
    // Intercept bundle fetch errors or runtime compile failure
    loadingSkeleton.style.display = 'none';
    mfeContainer.style.display = 'block';
    errorBoundary.renderFallbackScreen(mfeContainer, route.appName, error, retryFn);
  }
}

function updateNavbarActiveState(path) {
  const links = {
    '/': document.getElementById('nav-home'),
    '/video': document.getElementById('nav-video'),
    '/live': document.getElementById('nav-live'),
    '/premium': document.getElementById('nav-premium')
  };

  Object.keys(links).forEach(key => {
    if (links[key]) {
      if (key === path) {
        links[key].classList.add('active');
        links[key].setAttribute('aria-current', 'page');
      } else {
        links[key].classList.remove('active');
        links[key].removeAttribute('aria-current');
      }
    }
  });
}

// Intercept clicks on links for SPA routing, and prefetch remote entries on mouse-hover
function interceptLinks() {
  document.addEventListener('click', (e) => {
    const target = e.target.closest('a');
    if (!target) return;
    
    const href = target.getAttribute('href');
    if (href && href.startsWith('/') && !href.startsWith('//') && !target.hasAttribute('download')) {
      e.preventDefault();
      navigate(href);
    }
  });

  // Preloading hover triggers for optimal INP / navigational speeds
  if (featureFlags.isEnabled('enablePreloading')) {
    document.addEventListener('mouseover', (e) => {
      const target = e.target.closest('a');
      if (!target) return;

      const href = target.getAttribute('href');
      if (href && routes[href]) {
        // Prefetch module in the background
        loadRemoteModule(href).catch(() => {});
      }
    }, { passive: true });
  }
}

window.addEventListener('popstate', () => {
  navigate(window.location.pathname);
});

// Offline detection and visual status sync
function initOfflineDetection() {
  const banner = document.getElementById('offline-banner');

  function updateStatus() {
    if (navigator.onLine) {
      banner.classList.add('hidden');
      // Trigger sync logic when returning online
      window.dispatchEvent(new CustomEvent('network:online'));
    } else {
      banner.classList.remove('hidden');
    }
  }

  window.addEventListener('online', updateStatus);
  window.addEventListener('offline', updateStatus);
  updateStatus();
}

// Service Worker Registration & Updates UI toast
function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js')
        .then(reg => {
          console.log('ServiceWorker registration successful with scope: ', reg.scope);

          // Handle updates
          reg.addEventListener('updatefound', () => {
            const newWorker = reg.installing;
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                showUpdateToast();
              }
            });
          });
        })
        .catch(err => {
          console.warn('ServiceWorker registration failed: ', err);
        });
    });
  }
}

// Render clean non-intrusive reload alert toast for SW updates
function showUpdateToast() {
  const toast = document.createElement('div');
  toast.style.cssText = `
    position: fixed; bottom: 24px; right: 24px; 
    background-color: var(--text-primary); color: var(--bg-secondary); 
    padding: 16px 24px; border-radius: 4px; z-index: 1000;
    box-shadow: var(--shadow-lg); font-family: var(--font-sans); font-size: 0.85rem;
    display: flex; align-items: center; gap: 16px; border: 1px solid var(--border-color);
  `;
  toast.innerHTML = `
    <span>A new version of The Chronicle is available.</span>
    <button id="toast-sw-reload-btn" style="color: var(--accent-premium); font-weight: 700; text-decoration: underline;">RELOAD</button>
  `;
  document.body.appendChild(toast);
  
  document.getElementById('toast-sw-reload-btn').addEventListener('click', () => {
    window.location.reload();
  });
}

// Core Web Vitals Visual HUD for developers/performance auditors
function initPerformanceOverlay() {
  if (!featureFlags.isEnabled('enablePerformanceOverlay')) return;
  
  const overlay = document.createElement('div');
  overlay.id = 'performance-vitals-overlay';
  overlay.style.cssText = `
    position: fixed; top: 12px; left: 12px; 
    background-color: rgba(9, 13, 22, 0.95); color: #fff;
    padding: 10px 14px; border-radius: 6px; font-family: monospace;
    font-size: 0.75rem; z-index: 9999; border: 1px solid rgba(255,255,255,0.1);
    pointer-events: none; line-height: 1.4;
  `;
  document.body.appendChild(overlay);

  analytics.onMetric((metrics) => {
    overlay.innerHTML = `
      <div style="font-weight:bold;margin-bottom:4px;color:var(--accent-premium)">VITALS HUD</div>
      <div>LCP: <span style="color:${metrics.LCP && metrics.LCP < 2500 ? '#4ade80' : '#f87171'}">${metrics.LCP ? metrics.LCP + 'ms' : 'loading...'}</span></div>
      <div>CLS: <span style="color:${metrics.CLS < 0.1 ? '#4ade80' : '#f87171'}">${metrics.CLS.toFixed(3)}</span></div>
      <div>FID: <span style="color:${metrics.FID && metrics.FID < 100 ? '#4ade80' : '#f87171'}">${metrics.FID ? metrics.FID + 'ms' : 'N/A'}</span></div>
      <div>INP: <span style="color:${metrics.INP && metrics.INP < 200 ? '#4ade80' : '#f87171'}">${metrics.INP ? metrics.INP + 'ms' : 'waiting...'}</span></div>
      <div>TTFB: <span>${metrics.TTFB ? metrics.TTFB + 'ms' : 'loading...'}</span></div>
    `;
  });
}

// Initialise core services
initTheme();
initAuthHeaderSync();
updateHeaderDate();
interceptLinks();
initOfflineDetection();
registerServiceWorker();
initPerformanceOverlay();

// Mount active route
navigate(window.location.pathname);
