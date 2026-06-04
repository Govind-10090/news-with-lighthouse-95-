// Shared UI Skeleton Templates & Accessibility Utilities

const fallbackSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 225" width="100%" height="100%">
  <defs>
    <linearGradient id="bg-grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1e293b" />
      <stop offset="100%" stop-color="#0f172a" />
    </linearGradient>
  </defs>
  <rect width="100%" height="100%" fill="url(#bg-grad)" />
  <g fill="none" stroke="rgba(255,255,255,0.07)" stroke-width="1.5">
    <line x1="20" y1="30" x2="180" y2="30" stroke-width="3" stroke="rgba(255,255,255,0.15)"/>
    <line x1="20" y1="55" x2="380" y2="55" />
    <line x1="20" y1="75" x2="380" y2="75" />
    <line x1="20" y1="95" x2="320" y2="95" />
    <line x1="20" y1="125" x2="200" y2="125" stroke-width="2" stroke="rgba(255,255,255,0.1)"/>
    <line x1="20" y1="150" x2="380" y2="150" />
    <line x1="20" y1="170" x2="380" y2="170" />
    <line x1="20" y1="190" x2="280" y2="190" />
  </g>
  <text x="320" y="38" fill="rgba(255,255,255,0.2)" font-family="Cinzel, serif" font-weight="800" font-size="28" letter-spacing="1">C</text>
  <g transform="translate(188, 92.5)" stroke="rgba(255,255,255,0.15)" stroke-width="1.5" fill="none">
    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
    <circle cx="12" cy="13" r="4"/>
  </g>
</svg>`;

const avatarSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80" width="80" height="80">
  <circle cx="40" cy="40" r="40" fill="#1e293b" />
  <circle cx="40" cy="30" r="14" fill="#cbd5e1" />
  <path d="M40 48c-12 0-22 8-22 18v2h44v-2c0-10-10-18-22-18z" fill="#cbd5e1" />
</svg>`;

export const UI = {
  IMAGE_FALLBACK: 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(fallbackSvg))),
  AVATAR_FALLBACK: 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(avatarSvg))),

  optimizeImageUrl(url, width) {
    if (!url) return '';
    if (url.includes('images.unsplash.com')) {
      try {
        const parsedUrl = new URL(url);
        parsedUrl.searchParams.set('auto', 'format');
        parsedUrl.searchParams.set('q', '75');
        if (width) {
          parsedUrl.searchParams.set('w', width.toString());
        }
        return parsedUrl.toString();
      } catch (e) {
        return url;
      }
    }
    return url;
  },

  renderImage({ src, alt, className = '', lazy = true, fetchPriority = 'auto', isAvatar = false, width = '100%', height = 'auto', id = '' }) {
    const fallback = isAvatar ? this.AVATAR_FALLBACK : this.IMAGE_FALLBACK;
    const optimizedSrc = this.optimizeImageUrl(src, isAvatar ? 80 : 600);
    const loadingAttr = lazy ? 'loading="lazy"' : 'loading="eager"';
    const fetchPriorityAttr = fetchPriority !== 'auto' ? `fetchpriority="${fetchPriority}"` : '';
    const idAttr = id ? `id="${id}"` : '';
    
    return `<img 
      ${idAttr}
      class="${className}" 
      src="${optimizedSrc || fallback}" 
      alt="${alt || 'News image'}" 
      ${loadingAttr} 
      ${fetchPriorityAttr} 
      decoding="async" 
      onerror="this.onerror=null; this.src='${fallback}';"
      width="${width}" 
      height="${height}"
    >`;
  },

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
