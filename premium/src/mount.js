// ==========================================
// Premium MFE - Remote Component
// ==========================================

import { apiClient, authService, analytics, UI, VirtualFeedManager } from 'shared';
import './style.css';

export function mount(container, navigate) {
  let selectedPlanId = 'plan-annual';
  let virtualFeed = null;
  const abortController = new AbortController();
  const { signal } = abortController;

  // Render initial loading state
  container.innerHTML = `
    <div class="premium-container fade-in" id="premium-content-target">
      ${UI.getHeroSkeleton()}
    </div>
  `;

  const contentTarget = document.getElementById('premium-content-target');

  // Load plans and article dynamic from apiClient
  Promise.all([
    apiClient.request('https://api.chronicle.com/premium/plans', { signal }),
    apiClient.request('https://api.chronicle.com/premium/article', { signal })
  ])
    .then(([pricingPlans, premiumArticle]) => {
      // If already logged in / subscribed, bypass paywall immediately
      const isSubscribed = authService.isSubscribed();
      renderPremiumContent(pricingPlans, premiumArticle, isSubscribed);
    })
    .catch((err) => {
      if (err.name === 'AbortError') return;
      console.error('Failed to load premium plans or article:', err);
      throw err;
    });

  function renderPremiumContent(pricingPlans, article, isSubscribed) {
    contentTarget.innerHTML = `
      <!-- Article Header -->
      <header class="premium-article-header" role="banner">
        <div class="premium-tag">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor" style="margin-right: 4px; fill: var(--accent-premium);"><path d="M2 4l3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14v2H5v-2z"/></svg>
          ${article.tag}
        </div>
        <h1 class="premium-article-title">${article.title}</h1>
        <div class="card-meta" style="font-size: 0.8rem; border-top: 1px solid var(--border-color); padding-top: 12px;">
          <span class="card-author" style="color: var(--text-primary);">By ${article.author}</span>
          <span>●</span>
          <span>${article.date}</span>
          <span>●</span>
          <span>${article.readTime || '12 min read'}</span>
        </div>
      </header>

      <!-- First Part (Publicly Visible) -->
      <section class="public-content" aria-label="Article introduction" style="font-family: var(--font-serif); font-size: 1.15rem; line-height: 1.7; color: var(--text-primary); margin-bottom: 24px;">
        ${article.publicParagraphs.map(p => `<p style="margin-bottom: 20px;">${p}</p>`).join('')}
      </section>

      <!-- Paywall Truncated Area (Displayed only if NOT subscribed) -->
      <div id="paywall-truncated-wrapper" class="paywall-fade-mask" style="font-family: var(--font-serif); font-size: 1.15rem; line-height: 1.7; color: var(--text-primary); pointer-events: none; display: ${isSubscribed ? 'none' : 'block'};">
        ${article.truncatedParagraphs.map(p => `<p style="margin-bottom: 20px;">${p}</p>`).join('')}
      </div>

      <!-- Paywall Interactive Subscriber Box (Displayed only if NOT subscribed) -->
      <section class="paywall-card" id="paywall-cta-card" style="display: ${isSubscribed ? 'none' : 'flex'};">
        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--accent-premium)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="margin-bottom: 16px;"><path d="M2 4l3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14v2H5v-2z"/></svg>
        <h2 class="paywall-title">Continue Reading with Chronicle+</h2>
        <p class="paywall-subtitle">Support independent journalism. Unlock this premium investigation and gain unlimited access to our entire catalog.</p>

        <!-- Dynamic Plan Selector -->
        <div class="pricing-grid" role="radiogroup" aria-label="Subscription plans">
          ${pricingPlans.map(plan => `
            <div class="pricing-card ${plan.id === selectedPlanId ? 'active' : ''}" id="${plan.id}" tabindex="0" role="radio" aria-checked="${plan.id === selectedPlanId ? 'true' : 'false'}">
              <span class="plan-name">${plan.name}</span>
              <span class="plan-price">${plan.price}</span>
              <span class="plan-period">${plan.period}</span>
            </div>
          `).join('')}
        </div>

        <!-- Unlock Form -->
        <form class="paywall-form" id="subscription-unlock-form">
          <div class="form-row">
            <input type="email" class="email-input" placeholder="Enter your email" required id="sub-email-input" aria-label="Email address for subscription">
            <button type="submit" class="btn-unlock">UNLOCK NOW</button>
          </div>
          <p class="form-terms">
            Cancel anytime. By subscribing, you agree to our Terms of Service and Privacy Policy.
          </p>
        </form>
      </section>

      <!-- Complete Unlocked Content View (Displayed only if subscribed) -->
      <section class="unlocked-view" id="paywall-unlocked-section" style="font-family: var(--font-serif); font-size: 1.15rem; line-height: 1.7; color: var(--text-primary); display: ${isSubscribed ? 'block' : 'none'};">
        
        <!-- Welcome Success Banner -->
        <div id="unlocked-banner" style="background-color: rgba(180, 83, 9, 0.08); border: 1px solid var(--accent-premium); border-radius: 4px; padding: 16px 20px; display: flex; align-items: center; gap: 12px; font-family: var(--font-sans); font-size: 0.9rem; color: var(--accent-premium); font-weight: 600; margin-bottom: 32px;" role="status">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>
          <span id="unlocked-banner-text">Chronicle+ Membership Active. You have unlocked this investigation.</span>
        </div>

        ${article.unlockedParagraphs.slice(0, 2).map(p => `<p style="margin-bottom: 20px;">${p}</p>`).join('')}
        
        <!-- Premium Pullquote -->
        <blockquote style="border-left: 3px solid var(--accent-premium); padding-left: 24px; font-style: italic; font-size: 1.35rem; color: var(--accent-premium); margin: 32px 0; line-height: 1.5; font-weight: 500;">
          "${article.pullquote}"
        </blockquote>

        ${article.unlockedParagraphs.slice(2).map(p => `<p style="margin-bottom: 20px;">${p}</p>`).join('')}
      </section>

      <!-- More Premium Articles Feed -->
      <section style="margin-top: 4rem; border-top: 2px solid var(--border-color); padding-top: 2rem;">
        <h3 class="section-label">MORE FROM CHRONICLE+</h3>
        <div class="infinite-feed" id="premium-feed-container">
          <!-- Dynamically loaded preview cards appear here -->
        </div>
        <div id="premium-scroll-trigger" class="infinite-loading-container">
          <div class="loader-spinner"></div>
        </div>
      </section>
    `;

    // Bind pricing selector cards
    const monthlyCard = document.getElementById('plan-monthly');
    const annualCard = document.getElementById('plan-annual');

    function selectPlan(planId) {
      selectedPlanId = planId;
      if (selectedPlanId === 'plan-monthly') {
        monthlyCard.classList.add('active');
        monthlyCard.setAttribute('aria-checked', 'true');
        annualCard.classList.remove('active');
        annualCard.setAttribute('aria-checked', 'false');
      } else {
        annualCard.classList.add('active');
        annualCard.setAttribute('aria-checked', 'true');
        monthlyCard.classList.remove('active');
        monthlyCard.setAttribute('aria-checked', 'false');
      }
      analytics.trackEvent('Subscription', 'select_plan', planId);
    }

    if (monthlyCard && annualCard) {
      monthlyCard.addEventListener('click', () => selectPlan('plan-monthly'));
      annualCard.addEventListener('click', () => selectPlan('plan-annual'));

      // Keyboard support for ARIA radio buttons
      UI.makeAccessibleButton(monthlyCard, 'Choose Monthly Access', () => selectPlan('plan-monthly'));
      UI.makeAccessibleButton(annualCard, 'Choose Annual Pass', () => selectPlan('plan-annual'));
    }

    // Bind submission form
    const form = document.getElementById('subscription-unlock-form');
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('sub-email-input').value;
        
        if (email) {
          if (navigator.onLine) {
            submitSubscription(email);
          } else {
            // Queue subscription offline
            queueSubscriptionOffline(email);
          }
        }
      });
    }

    // Destroy previous virtual feed if it exists
    if (virtualFeed) {
      virtualFeed.destroy();
      virtualFeed = null;
    }

    // Initialize Virtualized scroll grid for premium related articles
    const premiumFeedContainer = document.getElementById('premium-feed-container');
    virtualFeed = new VirtualFeedManager(premiumFeedContainer, (cardEl, art) => {
      cardEl.className = 'editorial-card premium-card fade-in';
      cardEl.setAttribute('tabindex', '0');
      cardEl.innerHTML = `
        <div class="card-img-wrapper">
          <img class="card-img" src="${art.image}" alt="${art.title}" loading="lazy" width="100%" height="auto">
        </div>
        <div class="card-category">
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="currentColor" style="margin-right: 2px;"><path d="M2 4l3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14v2H5v-2z"/></svg>
          ${art.category}
        </div>
        <h3 class="card-title" style="font-size: 1.25rem;">${art.title}</h3>
        <div class="card-meta">
          <span class="card-author">By ${art.author}</span>
          <span>●</span>
          <span>${art.readTime}</span>
        </div>
        <p class="card-snippet" style="font-size: 0.85rem;">${art.snippet}</p>
      `;

      UI.makeAccessibleButton(cardEl, `Premium Article: ${art.title}`, () => {
        analytics.trackEvent('PremiumArticle', 'click_related', art.title);
        
        // Swap article dynamically in-place
        renderPremiumContent(pricingPlans, art, authService.isSubscribed());
        
        // Smooth scroll back to top of container
        window.scrollTo({
          top: container.offsetTop - 120,
          behavior: 'smooth'
        });
      });
    });

    // Populate initial page of related premium articles
    let premiumPageIndex = 1;
    let isTriggerIntersecting = false;
    let isLoadingMore = false;

    const observerTrigger = document.getElementById('premium-scroll-trigger');
    const observerOptions = {
      root: null,
      rootMargin: '0px 0px 400px 0px',
      threshold: 0.1
    };

    const newScrollObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        isTriggerIntersecting = entry.isIntersecting;
        if (entry.isIntersecting && !signal.aborted) {
          loadMorePremiumArticles();
        }
      });
    }, observerOptions);

    if (observerTrigger) {
      newScrollObserver.observe(observerTrigger);
    }

    signal.addEventListener('abort', () => {
      newScrollObserver.disconnect();
    });

    // Save scrollObserver reference in window or locally to clean up if we re-render in-place
    if (window.activePremiumScrollObserver) {
      window.activePremiumScrollObserver.disconnect();
    }
    window.activePremiumScrollObserver = newScrollObserver;

    function loadMorePremiumArticles() {
      if (isLoadingMore || signal.aborted) return;
      isLoadingMore = true;

      apiClient.request(`https://api.chronicle.com/premium/list?page=${premiumPageIndex}`, { signal })
        .then((newArticles) => {
          isLoadingMore = false;
          if (newArticles && newArticles.length > 0) {
            premiumPageIndex++;
            newArticles.forEach(art => {
              virtualFeed.appendItem(art, () => {
                analytics.trackEvent('PremiumArticle', 'click_related', art.title);
                renderPremiumContent(pricingPlans, art, authService.isSubscribed());
                window.scrollTo({
                  top: container.offsetTop - 120,
                  behavior: 'smooth'
                });
              });
            });

            // Check if still intersecting
            setTimeout(() => {
              if (!signal.aborted && isTriggerIntersecting) {
                loadMorePremiumArticles();
              }
            }, 150);
          }
        })
        .catch((err) => {
          isLoadingMore = false;
          if (err.name === 'AbortError') return;
          console.warn('Failed to load infinite scroll premium articles:', err);
        });
    }
  }

  function submitSubscription(email) {
    analytics.trackEvent('Subscription', 'submit_email', selectedPlanId);
    
    // Set login auth state globally
    authService.login(email);

    // Transition elements visually
    const truncatedWrapper = document.getElementById('paywall-truncated-wrapper');
    const paywallCard = document.getElementById('paywall-cta-card');
    const unlockedSection = document.getElementById('paywall-unlocked-section');

    if (truncatedWrapper && paywallCard && unlockedSection) {
      truncatedWrapper.style.display = 'none';
      paywallCard.style.display = 'none';
      unlockedSection.style.display = 'block';

      window.scrollTo({
        top: unlockedSection.offsetTop - 120,
        behavior: 'smooth'
      });
    }
  }

  // PWA Offline Queue fallback
  function queueSubscriptionOffline(email) {
    console.log('[Premium MFE] Offline: queueing subscription request');
    localStorage.setItem('offline_pending_subscription', JSON.stringify({
      email,
      plan: selectedPlanId,
      timestamp: Date.now()
    }));

    // Update screen banner to show offline pending message
    const banner = document.getElementById('unlocked-banner');
    const bannerText = document.getElementById('unlocked-banner-text');
    
    // Simulate login for offline reading immediate access
    authService.login(email);

    const truncatedWrapper = document.getElementById('paywall-truncated-wrapper');
    const paywallCard = document.getElementById('paywall-cta-card');
    const unlockedSection = document.getElementById('paywall-unlocked-section');

    if (truncatedWrapper && paywallCard && unlockedSection) {
      truncatedWrapper.style.display = 'none';
      paywallCard.style.display = 'none';
      unlockedSection.style.display = 'block';
      
      if (banner && bannerText) {
        banner.style.backgroundColor = 'rgba(220, 38, 38, 0.08)';
        banner.style.borderColor = 'var(--accent-live)';
        banner.style.color = 'var(--accent-live)';
        bannerText.textContent = 'Offline Mode: Your membership registration has been queued and will sync when you return online.';
      }

      window.scrollTo({
        top: unlockedSection.offsetTop - 120,
        behavior: 'smooth'
      });
    }

    analytics.trackEvent('Subscription', 'queued_offline', selectedPlanId);
  }

  // Synchronization event listener
  const syncHandler = () => {
    const queued = localStorage.getItem('offline_pending_subscription');
    if (queued) {
      try {
        const payload = JSON.parse(queued);
        console.log('[Premium MFE] Network online: syncing subscription for', payload.email);
        
        // Simulate sending to database
        analytics.trackEvent('Subscription', 'synced_online', payload.plan);
        localStorage.removeItem('offline_pending_subscription');

        // Update banner style back to active member
        const banner = document.getElementById('unlocked-banner');
        const bannerText = document.getElementById('unlocked-banner-text');
        if (banner && bannerText) {
          banner.style.backgroundColor = 'rgba(180, 83, 9, 0.08)';
          banner.style.borderColor = 'var(--accent-premium)';
          banner.style.color = 'var(--accent-premium)';
          bannerText.textContent = 'Chronicle+ Membership Active. You have unlocked this investigation.';
        }
      } catch (e) {
        console.warn('Error parsing offline subscription payload:', e);
      }
    }
  };

  window.addEventListener('network:online', syncHandler);

  return () => {
    console.log('[Premium MFE] Unmounting listeners');
    abortController.abort();
    window.removeEventListener('network:online', syncHandler);
    if (virtualFeed) {
      virtualFeed.destroy();
    }
    if (window.activePremiumScrollObserver) {
      window.activePremiumScrollObserver.disconnect();
      window.activePremiumScrollObserver = null;
    }
  };
}
