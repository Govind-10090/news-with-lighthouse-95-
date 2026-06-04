// Runtime Feature Flags Manager

class FeatureFlags {
  constructor() {
    this.flags = {
      enableLiveUpdates: true,
      enablePreloading: true,
      enablePerformanceOverlay: true,
      enableOfflineSync: true,
      useTerserMinification: true
    };
    
    // Allow localStorage overrides
    this.loadOverrides();
  }

  loadOverrides() {
    try {
      const overrides = localStorage.getItem('chronicle_feature_flags');
      if (overrides) {
        this.flags = { ...this.flags, ...JSON.parse(overrides) };
      }
    } catch (e) {
      console.warn('Failed to load feature flag overrides:', e);
    }
  }

  isEnabled(flag) {
    return !!this.flags[flag];
  }

  setFlag(flag, value) {
    this.flags[flag] = !!value;
    try {
      localStorage.setItem('chronicle_feature_flags', JSON.stringify(this.flags));
    } catch (e) {
      console.warn('Failed to save feature flag overrides:', e);
    }
  }
}

export const featureFlags = new FeatureFlags();
export default featureFlags;
