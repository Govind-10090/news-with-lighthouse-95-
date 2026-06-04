// Shared Utilities and Performance Virtual Scroll Manager

export function debounce(fn, delay) {
  let timer = null;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}

export function throttle(fn, limit) {
  let inThrottle = false;
  return function (...args) {
    if (!inThrottle) {
      fn.apply(this, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

export function formatDate(date) {
  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  return new Date(date).toLocaleDateString('en-US', options);
}

// Recycles off-screen DOM content to keep active nodes low
export class VirtualFeedManager {
  constructor(container, renderItemCallback, options = {}) {
    this.container = container;
    this.renderItemCallback = renderItemCallback;
    this.buffer = options.buffer || 1000; // Visible window buffer in pixels
    this.tagName = options.tagName || 'div'; // Tag name for feed items
    this.observedElements = new Map(); // Keep track of elements and their data/rendered states
    
    this.observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          const itemEl = entry.target;
          const config = this.observedElements.get(itemEl);
          
          if (!config) return;

          if (entry.isIntersecting) {
            // Restore contents if it was virtualized
            if (config.isVirtualized) {
              itemEl.innerHTML = config.originalHtml;
              itemEl.style.height = '';
              config.isVirtualized = false;
              
              // Re-bind click event
              if (config.clickListener) {
                itemEl.addEventListener('click', config.clickListener);
              }
            }
          } else {
            // Virtualize contents if not in viewport + buffer
            if (!config.isVirtualized) {
              const height = itemEl.getBoundingClientRect().height;
              if (height > 0) {
                config.originalHtml = itemEl.innerHTML;
                config.isVirtualized = true;
                itemEl.style.height = `${height}px`;
                itemEl.innerHTML = ''; // Clear DOM nodes inside this card
               }
            }
          }
        });
      },
      {
        root: null, // Viewport
        rootMargin: `${this.buffer}px 0px`, // Buffer margin
        threshold: 0.0
      }
    );
  }

  // Add an item to the feed
  appendItem(itemData, clickListener) {
    const cardEl = document.createElement(this.tagName);
    this.renderItemCallback(cardEl, itemData);

    const config = {
      data: itemData,
      originalHtml: cardEl.innerHTML,
      isVirtualized: false,
      clickListener
    };

    if (clickListener) {
      cardEl.addEventListener('click', clickListener);
    }

    this.container.appendChild(cardEl);
    this.observedElements.set(cardEl, config);
    this.observer.observe(cardEl);
    
    return cardEl;
  }

  // Clear list and disconnect observer
  destroy() {
    this.observer.disconnect();
    this.observedElements.clear();
    this.container.innerHTML = '';
  }
}
