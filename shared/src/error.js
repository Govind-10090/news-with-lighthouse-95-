// Error Boundary and Resilience Manager for Micro-Frontends

class MfeErrorBoundary {
  constructor() {
    this.logs = [];
  }

  logError(error, context) {
    const errorPayload = {
      timestamp: new Date().toISOString(),
      message: error.message || String(error),
      stack: error.stack,
      context
    };
    
    this.logs.push(errorPayload);
    console.error(`[Error Boundary] Isolated crash in [${context}]:`, errorPayload);
    
    // Maintain a small local audit trail
    if (this.logs.length > 50) this.logs.shift();
  }

  // Wraps an MFE mount operation in a safety boundary and manages unmount cleanup
  async safeMount(container, mfeName, mountFn, navigateFn, retryFn) {
    try {
      // Execute cleanup of previous MFE if it exported an unmount callback
      if (this.activeUnmount && typeof this.activeUnmount === 'function') {
        try {
          this.activeUnmount();
        } catch (e) {
          console.warn(`[Error Boundary] Error unmounting previous section:`, e);
        }
        this.activeUnmount = null;
      }

      container.innerHTML = '';
      const unmountCallback = await mountFn(container, navigateFn);
      
      // Save active unmount callback for next navigation
      if (typeof unmountCallback === 'function') {
        this.activeUnmount = unmountCallback;
      }
    } catch (error) {
      this.logError(error, mfeName);
      this.renderFallbackScreen(container, mfeName, error, retryFn);
    }
  }

  renderFallbackScreen(container, mfeName, error, retryFn) {
    container.innerHTML = `
      <div class="error-panel container" style="max-width: 600px; margin: 4rem auto; text-align: center; padding: 2rem; border: 1px solid var(--border-color); background: var(--bg-secondary); border-radius: 4px; box-shadow: var(--shadow-md);">
        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--accent-primary)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="margin-bottom: 16px;"><polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        <h2 style="font-family: var(--font-serif); margin-bottom: 12px; font-size: 1.5rem; color: var(--text-primary);">Section Unavailable</h2>
        <p style="color: var(--text-secondary); margin-bottom: 24px; font-size: 0.95rem; line-height: 1.5;">
          We encountered a connection issue while loading the <strong>${mfeName}</strong> section. 
          Please make sure the development MFE server is running on its respective port.
        </p>
        <div style="font-family: monospace; font-size: 0.8rem; background: var(--bg-primary); padding: 8px 12px; border-radius: 4px; text-align: left; margin-bottom: 24px; max-height: 100px; overflow-y: auto; border: 1px solid var(--border-color); color: var(--text-muted);">
          ${error.message || error}
        </div>
        <button id="mfe-boundary-retry-btn" class="btn-subscribe" style="cursor: pointer; background-color: var(--text-primary); color: var(--bg-secondary);">RETRY LOAD</button>
      </div>
    `;

    const retryBtn = document.getElementById('mfe-boundary-retry-btn');
    if (retryBtn && typeof retryFn === 'function') {
      retryBtn.addEventListener('click', () => {
        retryFn();
      });
    }
  }
}

export const errorBoundary = new MfeErrorBoundary();
export default errorBoundary;
