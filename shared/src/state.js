// Reactive Global State Manager (PubSub Pattern)

class StateStore {
  constructor() {
    this.state = {
      theme: localStorage.getItem('theme') || 'light',
      route: window.location.pathname,
      subscriber: JSON.parse(localStorage.getItem('subscriber_status')) || { email: null, active: false },
      liveUpdates: []
    };
    this.listeners = {};
  }

  getState(key) {
    return this.state[key];
  }

  setState(key, val) {
    const prev = this.state[key];
    // Simple deep equality check for object/array or reference check
    if (JSON.stringify(prev) === JSON.stringify(val)) return;

    this.state[key] = val;
    this.notify(key, val, prev);
  }

  subscribe(key, cb) {
    if (!this.listeners[key]) {
      this.listeners[key] = [];
    }
    this.listeners[key].push(cb);
    
    // Call listener immediately with current value
    cb(this.state[key], undefined);

    // Return unsubscribe function
    return () => {
      this.listeners[key] = this.listeners[key].filter(l => l !== cb);
    };
  }

  notify(key, next, prev) {
    if (this.listeners[key]) {
      this.listeners[key].forEach(cb => {
        try {
          cb(next, prev);
        } catch (e) {
          console.error(`Error in state listener for key "${key}":`, e);
        }
      });
    }
  }
}

export const globalState = new StateStore();
export default globalState;
