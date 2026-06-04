// ==========================================
// Home MFE - Remote Component
// ==========================================

import { apiClient, VirtualFeedManager, UI, analytics } from 'shared';
import './style.css';

export function mount(container, navigate) {
  let infiniteIndex = 0;
  let virtualFeed = null;
  let isTriggerIntersecting = false;
  const abortController = new AbortController();
  const { signal } = abortController;

  // Render initial frame skeleton layout
  container.innerHTML = `
    <div class="fade-in" id="home-view-wrapper">
      <div id="home-initial-skeleton-wrapper">
        ${UI.getHeroSkeleton()}
      </div>
      <div id="home-main-content-target" style="display: none;"></div>
    </div>
  `;

  const skeletonWrapper = document.getElementById('home-initial-skeleton-wrapper');
  const mainContentTarget = document.getElementById('home-main-content-target');

  // Load initial editorial batch from apiClient
  apiClient.request('https://api.chronicle.com/home/initial', { signal })
    .then((data) => {
      // Remove skeleton & display target
      skeletonWrapper.style.display = 'none';
      mainContentTarget.style.display = 'block';

      mainContentTarget.innerHTML = `
        <!-- Main Grid -->
        <section class="editorial-grid">
          <!-- Lead Story -->
          <article class="lead-story editorial-card" id="lead-story-card" tabindex="0">
            <div class="card-img-wrapper">
              <img class="card-img" src="${data.lead.image}" alt="Lead story landscape" width="100%" height="auto">
            </div>
            <div class="card-category">${data.lead.category}</div>
            <h2 class="card-title">${data.lead.title}</h2>
            <div class="card-meta">
              <span class="card-author">By ${data.lead.author}</span>
              <span>●</span>
              <span>${data.lead.readTime}</span>
            </div>
            <p class="card-snippet">${data.lead.snippet}</p>
          </article>

          <!-- Sidebar Latest News -->
          <aside class="latest-feed">
            <h3 class="sidebar-title">LATEST NEWS</h3>
            <div class="sidebar-list">
              ${data.sidebar.map((item, idx) => `
                <div class="sidebar-item" data-sidebar-idx="${idx}" tabindex="0">
                  <div class="sidebar-time">
                    <span class="sidebar-dot"></span>
                    ${item.time}
                  </div>
                  <h4 class="sidebar-heading">${item.title}</h4>
                </div>
              `).join('')}
            </div>
          </aside>
        </section>

        <!-- Opinion Section -->
        <section class="opinion-section">
          <h3 class="section-label">OPINION & PERSPECTIVES</h3>
          <div class="opinion-grid">
            ${data.opinions.map((opinion, idx) => `
              <div class="opinion-card" tabindex="0" data-opinion-idx="${idx}">
                <p class="opinion-quote">"${opinion.quote}"</p>
                <div class="opinion-author-meta">
                  <img class="opinion-avatar" src="${opinion.avatar}" alt="${opinion.author}" loading="lazy" width="28" height="28">
                  <span class="opinion-author-name">${opinion.author}</span>
                </div>
              </div>
            `).join('')}
          </div>
        </section>

        <!-- Infinite News Stream Section -->
        <section style="margin-top: 4rem;">
          <h3 class="section-label">THE CHRONICLE FEED</h3>
          <div class="infinite-feed" id="feed-articles-container">
            <!-- Dynamically loaded virtualized articles appear here -->
          </div>
          <div id="infinite-scroll-trigger" class="infinite-loading-container">
            <div class="loader-spinner"></div>
          </div>
        </section>
      `;

      // Set accessible keyboard and click triggers on main components
      const leadCard = document.getElementById('lead-story-card');
      const leadHandler = () => {
        analytics.trackEvent('Article', 'click_lead', data.lead.title);
        navigate('/premium');
      };
      leadCard.addEventListener('click', leadHandler);
      UI.makeAccessibleButton(leadCard, `Lead Story: ${data.lead.title}`, leadHandler);

      document.querySelectorAll('.sidebar-item').forEach(item => {
        const title = item.querySelector('.sidebar-heading').textContent;
        const sideHandler = () => {
          analytics.trackEvent('Article', 'click_sidebar', title);
          navigate('/live');
        };
        item.addEventListener('click', sideHandler);
        UI.makeAccessibleButton(item, `Latest News Update: ${title}`, sideHandler);
      });

      // Initialize Virtualized Infinite Scroll
      initInfiniteScroll(mainContentTarget, signal);
    })
    .catch((err) => {
      if (err.name === 'AbortError') return;
      console.error('Failed to load initial home items:', err);
      throw err; // propagates to errorBoundary fallback
    });

  function initInfiniteScroll(rootEl, signal) {
    const observerTrigger = document.getElementById('infinite-scroll-trigger');
    const feedContainer = document.getElementById('feed-articles-container');

    if (!observerTrigger || !feedContainer) return;

    // Instantiate virtualizer recycler
    virtualFeed = new VirtualFeedManager(feedContainer, (cardEl, article) => {
      // Rendering function inside the virtual scroll recycler
      cardEl.className = `editorial-card fade-in ${article.premium ? 'premium-card' : ''}`;
      cardEl.setAttribute('tabindex', '0');
      cardEl.innerHTML = `
        <div class="card-img-wrapper">
          <img class="card-img" src="${article.image}" alt="${article.title}" loading="lazy" width="100%" height="auto">
        </div>
        <div class="card-category">
          ${article.premium ? `
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="currentColor" style="margin-right: 2px;"><path d="M2 4l3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14v2H5v-2z"/></svg>
          ` : ''}
          ${article.category}
        </div>
        <h3 class="card-title" style="font-size: 1.25rem;">${article.title}</h3>
        <div class="card-meta">
          <span class="card-author">By ${article.author}</span>
          <span>●</span>
          <span>${article.readTime}</span>
        </div>
        <p class="card-snippet" style="font-size: 0.85rem;">${article.snippet}</p>
      `;
      
      // Accessibility attributes setup
      UI.makeAccessibleButton(cardEl, `${article.premium ? 'Premium ' : ''}Article: ${article.title}`, () => {
        analytics.trackEvent('Article', 'click_feed', article.title);
        navigate('/premium');
      });
    });

    const observerOptions = {
      root: null,
      rootMargin: '0px 0px 400px 0px', // Trigger load slightly before entering screen
      threshold: 0.1
    };

    const scrollObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        isTriggerIntersecting = entry.isIntersecting;
        if (entry.isIntersecting && !signal.aborted) {
          loadMoreFeedItems(signal);
        }
      });
    }, observerOptions);

    scrollObserver.observe(observerTrigger);

    // Save scrollObserver reference in our abort signal listener to disconnect on unmount
    signal.addEventListener('abort', () => {
      scrollObserver.disconnect();
    });
  }

  let isLoadingMore = false;

  // Load next batch using our api client wrapper
  function loadMoreFeedItems(signal) {
    if (isLoadingMore) return;
    isLoadingMore = true;

    const currentIdx = infiniteIndex;
    infiniteIndex++;

    // Add visual skeleton card before starting request
    const feedContainer = document.getElementById('feed-articles-container');
    const tempSkeleton = document.createElement('div');
    tempSkeleton.className = 'skeleton-card';
    tempSkeleton.innerHTML = UI.getCardSkeleton();
    feedContainer.appendChild(tempSkeleton);

    apiClient.request(`https://api.chronicle.com/home/articles/${currentIdx}`, { signal })
      .then((article) => {
        isLoadingMore = false;
        // Remove skeleton card
        if (tempSkeleton.parentNode) {
          feedContainer.removeChild(tempSkeleton);
        }

        if (article) {
          // Append recycled virtualized card item
          virtualFeed.appendItem(article, () => {
            analytics.trackEvent('Article', 'click_feed', article.title);
            navigate('/premium');
          });

          // Auto-load next item if the trigger is still intersecting
          setTimeout(() => {
            if (!signal.aborted && isTriggerIntersecting) {
              loadMoreFeedItems(signal);
            }
          }, 150);
        }
      })
      .catch((err) => {
        isLoadingMore = false;
        if (err.name === 'AbortError') return;
        if (tempSkeleton.parentNode) {
          feedContainer.removeChild(tempSkeleton);
        }
        console.warn('Failed to load infinite scroll article:', err);
      });
  }

  // Return MFE unmount lifecycle cleanup callback
  return () => {
    console.log('[Home MFE] Triggering unmount lifecycle cleanup');
    abortController.abort();
    if (virtualFeed) {
      virtualFeed.destroy();
    }
  };
}
