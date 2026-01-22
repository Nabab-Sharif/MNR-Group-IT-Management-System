// IndexedDB Service for MNR IT Management System
// Provides persistent storage with better capacity than localStorage

class IndexedDBService {
  constructor() {
    this.dbName = 'mnr_it_management';
    this.version = 5;
    this.db = null;
  }

  async initDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        // Create object stores if they don't exist
        if (!db.objectStoreNames.contains('users')) {
          db.createObjectStore('users', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('departments')) {
          db.createObjectStore('departments', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('accessories')) {
          db.createObjectStore('accessories', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('it_assets')) {
          db.createObjectStore('it_assets', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('units')) {
          db.createObjectStore('units', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('products')) {
          db.createObjectStore('products', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('user_activities')) {
          db.createObjectStore('user_activities', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('schedules')) {
          db.createObjectStore('schedules', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('printers')) {
          db.createObjectStore('printers', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('ip_phones')) {
          db.createObjectStore('ip_phones', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('wifi_networks')) {
          db.createObjectStore('wifi_networks', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('ip_addresses')) {
          db.createObjectStore('ip_addresses', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('cctv_cameras')) {
          db.createObjectStore('cctv_cameras', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('nvrs')) {
          db.createObjectStore('nvrs', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('cctv_checklists')) {
          db.createObjectStore('cctv_checklists', { keyPath: 'id' });
        }
        // Switch Port Mapping stores
        if (!db.objectStoreNames.contains('switches')) {
          db.createObjectStore('switches', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('switch_ports')) {
          db.createObjectStore('switch_ports', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('switch_locations')) {
          db.createObjectStore('switch_locations', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('switch_gates')) {
          db.createObjectStore('switch_gates', { keyPath: 'id' });
        }
      };
    });
  }

  async ensureDB() {
    if (!this.db) {
      await this.initDB();
    }
    return this.db;
  }

  close() {
    try {
      if (this.db) {
        this.db.close();
      }
    } finally {
      this.db = null;
    }
  }

  async deleteDatabase() {
    // Close any open connection before deleting
    this.close();

    return new Promise((resolve, reject) => {
      const request = indexedDB.deleteDatabase(this.dbName);
      request.onsuccess = () => resolve(true);
      request.onerror = () => reject(request.error);
      request.onblocked = () => {
        // If another tab holds the connection, deletion will be blocked
        reject(new Error('Database deletion blocked: please close other tabs using this app and try again.'));
      };
    });
  }

  async getAll(storeName) {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  async get(storeName, id) {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(id);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async add(storeName, data) {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.add(data);

      request.onsuccess = () => resolve(data);
      request.onerror = () => reject(request.error);
    });
  }

  async put(storeName, data) {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put(data);

      request.onsuccess = () => resolve(data);
      request.onerror = () => reject(request.error);
    });
  }

  async delete(storeName, id) {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(id);

      request.onsuccess = () => resolve(true);
      request.onerror = () => reject(request.error);
    });
  }

  async clear(storeName) {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.clear();

      request.onsuccess = () => resolve(true);
      request.onerror = () => reject(request.error);
    });
  }

  async bulkPut(storeName, items) {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);

      let completed = 0;
      const total = items.length;

      items.forEach(item => {
        const request = store.put(item);
        request.onsuccess = () => {
          completed++;
          if (completed === total) {
            resolve(true);
          }
        };
        request.onerror = () => reject(request.error);
      });

      if (total === 0) resolve(true);
    });
  }

  // Migrate data from localStorage to IndexedDB
  async migrateFromLocalStorage() {
    const stores = [
      { name: 'users', key: 'mnr_users' },
      { name: 'departments', key: 'mnr_departments' },
      { name: 'accessories', key: 'mnr_accessories' },
      { name: 'it_assets', key: 'mnr_it_assets' },
      { name: 'units', key: 'mnr_units' },
      { name: 'products', key: 'mnr_products' },
      { name: 'user_activities', key: 'mnr_user_activities' },
      { name: 'schedules', key: 'mnr_schedules' }
    ];

    for (const store of stores) {
      const localData = localStorage.getItem(store.key);
      if (localData) {
        try {
          const data = JSON.parse(localData);
          if (Array.isArray(data) && data.length > 0) {
            await this.bulkPut(store.name, data);
          }
        } catch (error) {
          console.error(`Failed to migrate ${store.name}:`, error);
        }
      }
    }
  }
}

export default new IndexedDBService();
