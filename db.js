// OnyxChat Unified Database & Storage Adapter using Firebase compat SDK
const DB = {
  db: null,

  init() {
    if (typeof CONFIG !== 'undefined' && CONFIG.firebaseConfig && CONFIG.firebaseConfig.databaseURL) {
      try {
        // Initialize Firebase
        if (!firebase.apps.length) {
          firebase.initializeApp(CONFIG.firebaseConfig);
        }
        this.db = firebase.database();
        console.log("[DB] Firebase Cloud Realtime Database client initialized.");
        
        // Seed initial admin security hash if not yet populated on Firebase
        this.db.ref('settings/adminHash').once('value').then(snap => {
          if (!snap.exists()) {
            const defaultHash = CONFIG.adminHash || '006657998771eb1ef75d0a26f8824af99da8bf4f7261d3a4d896708286a618eb';
            this.db.ref('settings/adminHash').set(defaultHash);
          }
        }).catch(err => {
          console.warn("[DB] Could not check or seed admin hash on startup:", err.message);
        });
      } catch (e) {
        console.error("[DB] Failed to initialize Firebase:", e);
      }
    } else {
      console.log("[DB] Firebase keys missing. Falling back to browser LocalStorage.");
    }
  },

  // --- Settings (key/value) ---
  async getSetting(key, defaultValue) {
    if (this.db) {
      try {
        const snapshot = await this.db.ref('settings/' + key).once('value');
        if (snapshot.exists()) return snapshot.val();
      } catch (e) {
        console.error(`[DB] Error fetching setting ${key} from Firebase:`, e);
      }
    }
    // Fallback
    return localStorage.getItem(key) || defaultValue;
  },

  async setSetting(key, value) {
    // Keep local storage updated for fast synchronous reads when possible
    localStorage.setItem(key, value);
    if (this.db) {
      try {
        await this.db.ref('settings/' + key).set(value);
      } catch (e) {
        console.error(`[DB] Error saving setting ${key} to Firebase:`, e);
      }
    }
  },

  // --- FAQs ---
  async getFAQs(defaultFAQs) {
    if (this.db) {
      try {
        const snapshot = await this.db.ref('faqs').once('value');
        if (snapshot.exists()) {
          const val = snapshot.val();
          if (Array.isArray(val)) return val.filter(Boolean);
          return Object.values(val);
        }
      } catch (e) {
        console.error("[DB] Error fetching FAQs from Firebase:", e);
      }
    }
    // Fallback
    const stored = localStorage.getItem('faqs');
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch(e) {}
    }
    return defaultFAQs;
  },

  async saveFAQs(faqs) {
    localStorage.setItem('faqs', JSON.stringify(faqs));
    if (this.db) {
      try {
        await this.db.ref('faqs').set(faqs);
      } catch (e) {
        console.error("[DB] Error saving FAQs to Firebase:", e);
      }
    }
  },

  // --- Registrants ---
  async getRegistrants() {
    if (this.db) {
      try {
        const snapshot = await this.db.ref('registrants').once('value');
        if (snapshot.exists()) {
          const val = snapshot.val();
          return Object.values(val).sort((a, b) => b.timestamp.localeCompare(a.timestamp));
        }
        return [];
      } catch (e) {
        console.error("[DB] Error fetching registrants from Firebase:", e);
      }
    }
    // Fallback
    return JSON.parse(localStorage.getItem('registrants') || '[]');
  },

  async addRegistrant(user) {
    const list = JSON.parse(localStorage.getItem('registrants') || '[]');
    list.push(user);
    localStorage.setItem('registrants', JSON.stringify(list));

    if (this.db) {
      try {
        // Sanitize timestamp key characters to comply with Firebase key path naming
        const safeKey = user.timestamp.replace(/[\.\#\$\[\]\/]/g, '_');
        await this.db.ref('registrants/' + safeKey).set(user);
      } catch (e) {
        console.error("[DB] Error saving registrant to Firebase:", e);
      }
    }
  },

  async clearRegistrants() {
    localStorage.setItem('registrants', '[]');
    if (this.db) {
      try {
        await this.db.ref('registrants').remove();
      } catch (e) {
        console.error("[DB] Error clearing registrants on Firebase:", e);
      }
    }
  }
};

// Initialize database
DB.init();
