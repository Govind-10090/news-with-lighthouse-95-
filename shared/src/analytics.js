// Core Web Vitals & Analytics Tracker

class AnalyticsService {
  constructor() {
    this.metrics = {
      LCP: null,
      CLS: 0,
      FID: null,
      INP: null,
      TTFB: null
    };
    this.metricListeners = [];
    this.initPerformanceObserver();
  }

  // Bind listener for real-time Core Web Vitals overlays
  onMetric(callback) {
    this.metricListeners.push(callback);
    // Push current metrics immediately
    callback(this.metrics);
    return () => {
      this.metricListeners = this.metricListeners.filter(cb => cb !== callback);
    };
  }

  notifyListeners() {
    this.metricListeners.forEach(cb => cb({ ...this.metrics }));
  }

  trackEvent(category, action, label = null, value = null) {
    const payload = {
      timestamp: new Date().toISOString(),
      category,
      action,
      label,
      value,
      url: window.location.pathname
    };
    console.log(`[Analytics Telemetry] Event Logged:`, payload);
    
    // In a production app, this would queue requests and send them to an ingestion endpoint
  }

  initPerformanceObserver() {
    if (typeof window === 'undefined') return;

    try {
      // 1. TTFB (Time to First Byte)
      if (performance.getEntriesByType('navigation').length > 0) {
        const navEntry = performance.getEntriesByType('navigation')[0];
        this.metrics.TTFB = Math.round(navEntry.responseStart);
        this.notifyListeners();
      }

      // 2. LCP (Largest Contentful Paint)
      const lcpObserver = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        const lastEntry = entries[entries.length - 1];
        this.metrics.LCP = Math.round(lastEntry.startTime);
        this.notifyListeners();
      });
      lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });

      // 3. CLS (Cumulative Layout Shift)
      const clsObserver = new PerformanceObserver((entryList) => {
        for (const entry of entryList.getEntries()) {
          if (!entry.hadRecentInput) {
            this.metrics.CLS += entry.value;
            this.notifyListeners();
          }
        }
      });
      clsObserver.observe({ type: 'layout-shift', buffered: true });

      // 4. FID (First Input Delay)
      const fidObserver = new PerformanceObserver((entryList) => {
        const firstEntry = entryList.getEntries()[0];
        this.metrics.FID = Math.round(firstEntry.processingStart - firstEntry.startTime);
        this.notifyListeners();
      });
      fidObserver.observe({ type: 'first-input', buffered: true });

      // 5. INP (Interaction to Next Paint)
      const inpObserver = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        for (const entry of entries) {
          const delay = entry.duration;
          if (!this.metrics.INP || delay > this.metrics.INP) {
            this.metrics.INP = Math.round(delay);
            this.notifyListeners();
          }
        }
      });
      // INP is supported in modern browsers
      if (PerformanceObserver.supportedEntryTypes.includes('event')) {
        inpObserver.observe({ type: 'event', durationThreshold: 16, buffered: true });
      }
    } catch (e) {
      console.warn('[Analytics Service] PerformanceObserver registration failed:', e);
    }
  }
}

export const analytics = new AnalyticsService();
export default analytics;
