import globalState from './state.js';

class AuthService {
  constructor() {
    // Synchronize initial state
    const current = globalState.getState('subscriber');
    this.status = current || { email: null, active: false };

    // Subscribe to state modifications from other MFEs
    globalState.subscribe('subscriber', (newStatus) => {
      if (newStatus) {
        this.status = newStatus;
        localStorage.setItem('subscriber_status', JSON.stringify(newStatus));
      }
    });
  }

  isSubscribed() {
    return this.status.active;
  }

  getSubscriberEmail() {
    return this.status.email;
  }

  login(email) {
    if (!email) return false;
    const newStatus = { email, active: true };
    globalState.setState('subscriber', newStatus);
    
    // Trigger window event for cross-origin sync or local systems
    window.dispatchEvent(new CustomEvent('auth:login', { detail: newStatus }));
    return true;
  }

  logout() {
    const newStatus = { email: null, active: false };
    globalState.setState('subscriber', newStatus);
    window.dispatchEvent(new CustomEvent('auth:logout'));
  }

  onAuthChange(callback) {
    return globalState.subscribe('subscriber', callback);
  }
}

export const authService = new AuthService();
export default authService;
