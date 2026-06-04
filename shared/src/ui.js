// Shared UI Skeleton Templates & Accessibility Utilities

export const UI = {
  // Skeletons matching exact visual styles of the application
  getHeroSkeleton() {
    return `
      <div class="skeleton-view">
        <div class="skeleton-hero">
          <div class="skeleton-title skeleton-anim" style="width: 70%; height: 36px;"></div>
          <div class="skeleton-meta skeleton-anim" style="width: 30%; height: 16px;"></div>
          <div class="skeleton-image skeleton-anim" style="height: 380px;"></div>
          <div class="skeleton-text skeleton-anim"></div>
          <div class="skeleton-text skeleton-anim" style="width: 85%;"></div>
        </div>
      </div>
    `;
  },

  getCardSkeleton() {
    return `
      <div class="skeleton-card">
        <div class="skeleton-thumbnail skeleton-anim" style="height: 180px;"></div>
        <div class="skeleton-title skeleton-anim" style="width: 80%; height: 20px; margin-top: 8px;"></div>
        <div class="skeleton-text skeleton-anim" style="width: 50%; height: 14px; margin-top: 8px;"></div>
      </div>
    `;
  },

  getFeedSkeleton(count = 3) {
    return `
      <div class="skeleton-grid" style="grid-template-columns: repeat(${count}, 1fr); gap: 24px;">
        ${Array(count).fill(this.getCardSkeleton()).join('')}
      </div>
    `;
  },

  // Accessibility helper: Makes any div/span interactive like a proper button
  makeAccessibleButton(element, label, actionCallback) {
    if (!element) return;
    
    element.setAttribute('role', 'button');
    element.setAttribute('aria-label', label);
    element.setAttribute('tabindex', '0');
    
    // Support keyboard activation (Space/Enter)
    element.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        actionCallback(e);
      }
    });

    // Handle focus ring styling via CSS
    element.style.outlineOffset = '2px';
  }
};

export default UI;
