// Shared Platform Modules Export Hub

export { globalState, default as state } from './state.js';
export { authService, default as auth } from './auth.js';
export { apiClient, default as api } from './api.js';
export { analytics } from './analytics.js';
export { debounce, throttle, formatDate, VirtualFeedManager } from './utils.js';
export { UI } from './ui.js';
export { featureFlags } from './featureFlags.js';
export { errorBoundary } from './error.js';
