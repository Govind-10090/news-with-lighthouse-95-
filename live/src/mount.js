// ==========================================
// Live MFE - Remote Component
// ==========================================

import { apiClient, analytics, UI } from 'shared';
import './style.css';

export function mount(container, navigate) {
  let websocketTimer = null;
  const abortController = new AbortController();
  const { signal } = abortController;

  // Render initial loading structure
  container.innerHTML = `
    <div class="live-mfe-container fade-in" id="live-content-target">
      ${UI.getHeroSkeleton()}
    </div>
  `;

  const contentTarget = document.getElementById('live-content-target');

  // Load feed metrics from apiClient
  apiClient.request('https://api.chronicle.com/live/feed', { signal })
    .then((liveFeedData) => {
      const initialTimeline = liveFeedData.timeline;
      const pendingAlert = liveFeedData.pending;

      contentTarget.innerHTML = `
        <!-- Live Header -->
        <header class="live-section-header" role="banner">
          <div class="live-title-row">
            <div class="live-indicator-badge" role="status" aria-live="polite">
              <span class="live-dot-pulse"></span>
              LIVE
            </div>
            <h2 class="live-title-main" style="color: var(--text-primary);">Climate Accord Plenary Debates</h2>
          </div>
          <div class="connection-pulse-indicator">
            <span class="wifi-dot"></span>
            <span>Feed Synchronized</span>
          </div>
        </header>

        <!-- Alert Banner Area (Initially Hidden) -->
        <div id="timeline-alert-banner-wrapper"></div>

        <!-- Timeline List -->
        <section class="timeline-container" id="timeline-items-wrapper" aria-label="Live updates timeline">
          ${initialTimeline.map((item, idx) => `
            <div class="timeline-item" tabindex="0" aria-label="Update at ${item.time}">
              <div class="timeline-node"></div>
              <div class="timeline-content-card">
                <div class="timeline-time-label">${item.time}</div>
                <h3 class="timeline-heading">${item.title}</h3>
                <p class="timeline-text">${item.text}</p>
                ${item.critical ? `<div class="critical-box" role="alert">${item.critical}</div>` : ''}
              </div>
            </div>
          `).join('')}
        </section>
        <div id="live-scroll-trigger" class="infinite-loading-container">
          <div class="loader-spinner"></div>
        </div>
      `;

      const alertWrapper = document.getElementById('timeline-alert-banner-wrapper');
      const itemsWrapper = document.getElementById('timeline-items-wrapper');

      const pendingPool = liveFeedData.pendingPool || [];
      let pendingIndex = 0;

      function scheduleNextUpdate() {
        if (pendingIndex >= pendingPool.length || signal.aborted) return;

        const nextAlert = pendingPool[pendingIndex];
        pendingIndex++;

        // Schedule next update dynamically between 8 to 12 seconds
        websocketTimer = setTimeout(() => {
          if (signal.aborted) return;

          analytics.trackEvent('LiveBlog', 'new_alert_received', nextAlert.title);

          // Display incoming real-time update banner
          alertWrapper.innerHTML = `
            <div class="realtime-alert-banner" id="incoming-alert-banner" role="button" tabindex="0" aria-label="New real-time update available. Click to view.">
              <span>● NEW REAL-TIME UPDATE: ${nextAlert.title.slice(0, 70)}... (${nextAlert.time})</span>
              <button style="color: white; font-weight: 800; font-size: 0.75rem; text-decoration: underline; cursor: pointer;">VIEW UPDATE</button>
            </div>
          `;

          const banner = document.getElementById('incoming-alert-banner');

          const triggerUpdate = () => {
            analytics.trackEvent('LiveBlog', 'view_alert_click', nextAlert.title);

            // Add card to the top of timeline
            const newCard = document.createElement('div');
            newCard.className = 'timeline-item new-alert-item';
            newCard.setAttribute('tabindex', '0');
            newCard.innerHTML = `
              <div class="timeline-node"></div>
              <div class="timeline-content-card">
                <div class="timeline-time-label">${nextAlert.time}</div>
                <h3 class="timeline-heading">${nextAlert.title}</h3>
                <p class="timeline-text">${nextAlert.text}</p>
                ${nextAlert.critical ? `<div class="critical-box" role="alert">${nextAlert.critical}</div>` : ''}
              </div>
            `;

            itemsWrapper.insertBefore(newCard, itemsWrapper.firstChild);

            // Smooth scroll to top of card container
            window.scrollTo({
              top: container.offsetTop - 120,
              behavior: 'smooth'
            });

            // Reset banner and schedule NEXT update
            alertWrapper.innerHTML = '';

            // Fade out ring highlight after 4 seconds
            setTimeout(() => {
              if (!signal.aborted) {
                newCard.classList.remove('new-alert-item');
              }
            }, 4000);

            // Schedule the next pending item in queue
            scheduleNextUpdate();
          };

          if (banner) {
            banner.addEventListener('click', triggerUpdate);
            UI.makeAccessibleButton(banner, 'View new real-time live update', triggerUpdate);
          }
        }, 8000 + Math.random() * 4000);
      }

      // Start the dynamic updates queue loop
      scheduleNextUpdate();

      // Initialize infinite scrolling for older historical updates
      let livePageIndex = 2;
      let isTriggerIntersecting = false;
      let isLoadingMore = false;

      const observerTrigger = document.getElementById('live-scroll-trigger');
      const observerOptions = {
        root: null,
        rootMargin: '0px 0px 400px 0px',
        threshold: 0.1
      };

      const scrollObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          isTriggerIntersecting = entry.isIntersecting;
          if (entry.isIntersecting && !signal.aborted) {
            loadMoreLiveUpdates();
          }
        });
      }, observerOptions);

      if (observerTrigger) {
        scrollObserver.observe(observerTrigger);
      }

      signal.addEventListener('abort', () => {
        scrollObserver.disconnect();
      });

      function loadMoreLiveUpdates() {
        if (isLoadingMore || signal.aborted) return;
        isLoadingMore = true;

        apiClient.request(`https://api.chronicle.com/live/feed?page=${livePageIndex}`, { signal })
          .then((olderItems) => {
            isLoadingMore = false;
            if (olderItems && olderItems.length > 0) {
              livePageIndex++;
              olderItems.forEach(item => {
                const newCard = document.createElement('div');
                newCard.className = 'timeline-item';
                newCard.setAttribute('tabindex', '0');
                newCard.setAttribute('aria-label', `Update at ${item.time}`);
                newCard.innerHTML = `
                  <div class="timeline-node"></div>
                  <div class="timeline-content-card">
                    <div class="timeline-time-label">${item.time}</div>
                    <h3 class="timeline-heading">${item.title}</h3>
                    <p class="timeline-text">${item.text}</p>
                    ${item.critical ? `<div class="critical-box" role="alert">${item.critical}</div>` : ''}
                  </div>
                `;
                itemsWrapper.appendChild(newCard);
              });

              // Check if still intersecting
              setTimeout(() => {
                if (!signal.aborted && isTriggerIntersecting) {
                  loadMoreLiveUpdates();
                }
              }, 150);
            }
          })
          .catch((err) => {
            isLoadingMore = false;
            if (err.name === 'AbortError') return;
            console.warn('Failed to load infinite scroll live items:', err);
          });
      }
    })
    .catch((err) => {
      if (err.name === 'AbortError') return;
      console.error('Failed to load live feed:', err);
      throw err;
    });

  // Return unmount callback to clear pending timeouts and abort controllers
  return () => {
    console.log('[Live MFE] Clearing websocket simulation triggers');
    abortController.abort();
    if (websocketTimer) {
      clearTimeout(websocketTimer);
    }
  };
}
