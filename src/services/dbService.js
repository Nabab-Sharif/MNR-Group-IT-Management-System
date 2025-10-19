// DBService.js
// Hybrid IndexedDB + in-memory cache (sync-style) for MNR IT Management System (React Web App)
// Updated: reload-safe, localStorage-first-fast-render, IndexedDB background-sync, onReady + onChange

class DBService {
    constructor() {
        this.dbName = 'MNR_IT_DB';
        this.dbVersion = 1;
        this.storeNames = [
            'mnr_users',
            'mnr_departments',
            'mnr_accessories',
            'mnr_it_assets',
            'mnr_units',
            'mnr_products',
            'mnr_user_activities'
        ];

        this.useIndexedDB = this._isIndexedDBAvailable();
        this.db = null;
        this.cache = {}; // in-memory cache
        this.ready = false; // true after initial IDB load OR localStorage fallback loaded
        this._onReadyCallbacks = [];
        this._changeListeners = {}; // { storeName: [cb, ...] }

        // initialize cache with localStorage first so synchronous reads return previous data immediately
        this.storeNames.forEach(name => {
            try {
                const existing = JSON.parse(localStorage.getItem(name) || '[]');
                this.cache[name] = Array.isArray(existing) ? existing : [];
            } catch (err) {
                this.cache[name] = [];
            }
            this._changeListeners[name] = [];
        });

        // Now initialize IndexedDB in background and migrate/refresh cache when ready
        this._init();
    }

    // --------------------- Init & Migration ---------------------
    _isIndexedDBAvailable() {
        try {
            return 'indexedDB' in window && !!window.indexedDB;
        } catch (e) {
            return false;
        }
    }

    _init() {
        if (!this.useIndexedDB) {
            // No IndexedDB — we are already seeded from localStorage above
            this.ready = true;
            this._flushOnReady();
            return;
        }

        const req = indexedDB.open(this.dbName, this.dbVersion);

        req.onupgradeneeded = (e) => {
            const db = e.target.result;
            this.storeNames.forEach(store => {
                if (!db.objectStoreNames.contains(store)) {
                    db.createObjectStore(store, { keyPath: 'id' });
                }
            });
        };

        req.onsuccess = async(e) => {
            this.db = e.target.result;

            // If browser upgraded or new DB, ensure object stores present
            // Migrate from localStorage if IDB empty and localStorage has data
            try {
                await this._migrateFromLocalStorageIfNeeded();
            } catch (err) {
                console.warn('DBService: migration warning', err);
            }

            // Load all IDB data to cache (this will override the quick localStorage cache with fresh IDB data)
            try {
                await this._loadAllToCache();
            } catch (err) {
                console.warn('DBService: loadAllToCache warning', err);
            }

            // Save cache snapshot to localStorage (so next reload shows instant data)
            try {
                this._saveCacheToLocalStorage();
            } catch (e) { /* ignore */ }

            this.ready = true;
            this._flushOnReady();
            // notify all change listeners that stores loaded
            this._emitChangeAll();

            // close DB on unload
            window.addEventListener('unload', () => this.db && this.db.close());
        };

        req.onerror = (e) => {
            console.error('DBService: IndexedDB open error, falling back to localStorage', e);
            // Already loaded cache from localStorage in constructor; mark ready
            this.useIndexedDB = false;
            this.ready = true;
            this._flushOnReady();
        };
    }

    // onReady API: run cb when initial ready
    onReady(cb) {
        if (this.ready) {
            try { cb(); } catch (e) { console.error(e); }
            return;
        }
        this._onReadyCallbacks.push(cb);
    }

    _flushOnReady() {
        this._onReadyCallbacks.forEach(cb => {
            try { cb(); } catch (e) { console.error(e); }
        });
        this._onReadyCallbacks = [];
    }

    // --------------------- Change listeners (reactive) ---------------------
    // subscribe to changes of a particular storeName (e.g. 'mnr_users')
    onChange(storeName, cb) {
        if (!this._changeListeners[storeName]) this._changeListeners[storeName] = [];
        this._changeListeners[storeName].push(cb);
        // return unsubscribe
        return () => {
            this._changeListeners[storeName] = this._changeListeners[storeName].filter(fn => fn !== cb);
        };
    }

    _emitChange(storeName) {
        const list = this._changeListeners[storeName] || [];
        list.forEach(cb => {
            try { cb(this.cache[storeName]); } catch (e) { console.error(e); }
        });
    }

    _emitChangeAll() {
        this.storeNames.forEach(store => this._emitChange(store));
    }

    // --------------------- localStorage helpers ---------------------
    _saveCacheToLocalStorage() {
        this.storeNames.forEach(store => {
            try {
                localStorage.setItem(store, JSON.stringify(this.cache[store] || []));
            } catch (e) {
                // ignore quota errors silently
                console.warn('DBService: localStorage save failed for', store, e);
            }
        });
    }

    _ensureLocalStorageInitial() {
        this.storeNames.forEach(store => {
            if (!localStorage.getItem(store)) {
                try { localStorage.setItem(store, JSON.stringify([])); } catch (e) {}
            }
        });
    }

    // --------------------- Migration ---------------------
    async _migrateFromLocalStorageIfNeeded() {
        // If IDB store empty but localStorage has items, copy them to IDB.
        for (const store of this.storeNames) {
            const lsRaw = localStorage.getItem(store);
            if (!lsRaw) continue;
            let lsArr = [];
            try { lsArr = JSON.parse(lsRaw || '[]'); } catch (e) { lsArr = []; }
            if (!Array.isArray(lsArr) || lsArr.length === 0) continue;

            const existing = await this._getAllFromIDB(store);
            if (!existing || existing.length === 0) {
                // copy all into IDB
                await this._bulkPutToIDB(store, lsArr);
            }
        }
    }

    // --------------------- Load/Save cache & IDB helpers ---------------------
    _loadAllToCache() {
        return new Promise((resolve) => {
            if (!this.useIndexedDB || !this.db) return resolve();
            let remaining = this.storeNames.length;
            this.storeNames.forEach(store => {
                this._getAllFromIDB(store).then(data => {
                    this.cache[store] = Array.isArray(data) ? data : [];
                    // notify change for this store
                    this._emitChange(store);
                }).catch(() => {
                    this.cache[store] = [];
                    this._emitChange(store);
                }).finally(() => {
                    remaining -= 1;
                    if (remaining === 0) resolve();
                });
            });
        });
    }

    _getAllFromIDB(storeName) {
        return new Promise((resolve, reject) => {
            if (!this.db) return resolve([]);
            try {
                const tx = this.db.transaction(storeName, 'readonly');
                const store = tx.objectStore(storeName);
                const req = store.getAll();
                req.onsuccess = () => resolve(req.result || []);
                req.onerror = () => reject(req.error);
            } catch (err) {
                reject(err);
            }
        });
    }

    _bulkPutToIDB(storeName, arr) {
        return new Promise((resolve) => {
            if (!this.db) return resolve(false);
            try {
                const tx = this.db.transaction(storeName, 'readwrite');
                const store = tx.objectStore(storeName);
                const clearReq = store.clear();
                clearReq.onsuccess = () => {
                    if (!arr.length) return resolve(true);
                    let done = 0;
                    arr.forEach(item => {
                        try {
                            const r = store.put(item);
                            r.onsuccess = () => {
                                done += 1;
                                if (done === arr.length) resolve(true);
                            };
                            r.onerror = () => {
                                done += 1;
                                if (done === arr.length) resolve(true);
                            };
                        } catch (e) {
                            done += 1;
                            if (done === arr.length) resolve(true);
                        }
                    });
                };
                clearReq.onerror = () => {
                    // if clear fails, still try to put
                    let done = 0;
                    if (!arr.length) return resolve(true);
                    arr.forEach(item => {
                        try {
                            const r = store.put(item);
                            r.onsuccess = () => {
                                done += 1;
                                if (done === arr.length) resolve(true);
                            };
                            r.onerror = () => {
                                done += 1;
                                if (done === arr.length) resolve(true);
                            };
                        } catch (e) {
                            done += 1;
                            if (done === arr.length) resolve(true);
                        }
                    });
                };
                // resolve on tx complete as a fallback
                tx.oncomplete = () => {};
                tx.onerror = () => {};
            } catch (err) {
                resolve(false);
            }
        });
    }

    async _persistStore(storeName) {
        const arr = this.cache[storeName] || [];
        if (this.useIndexedDB && this.db) {
            try {
                await this._bulkPutToIDB(storeName, arr);
            } catch (err) {
                console.warn('DBService: persisting to IDB failed', storeName, err);
            }
        }
        // Always update localStorage snapshot for instant next-load UI
        try { localStorage.setItem(storeName, JSON.stringify(arr)); } catch (e) {}
        // Emit change to subscribers
        this._emitChange(storeName);
    }

    // --------------------- Utilities ---------------------
    _makeRecord(data) {
        const now = new Date().toISOString();
        return {
            ...data,
            id: data.id || Date.now(),
            created_at: data.created_at || now,
            updated_at: new Date().toISOString()
        };
    }

    // public method to force migrate (useful in console)
    async migrateFromLocalStorage() {
        await this._migrateFromLocalStorageIfNeeded();
        // reload cache from IDB
        await this._loadAllToCache();
        this._saveCacheToLocalStorage();
        this._emitChangeAll();
        return true;
    }

    // --------------------- CRUD Methods (sync-style reads) ---------------------

    // Users CRUD
    getUsers() { return this.cache['mnr_users'] || []; }
    addUser(user) {
        const newUser = this._makeRecord(user);
        this.cache['mnr_users'].push(newUser);
        this._persistStore('mnr_users');
        return newUser;
    }
    updateUser(id, updates) {
        const arr = this.cache['mnr_users'] || [];
        const idx = arr.findIndex(u => u.id === id);
        if (idx === -1) return null;
        arr[idx] = {...arr[idx], ...updates, updated_at: new Date().toISOString() };
        this._persistStore('mnr_users');
        return arr[idx];
    }
    deleteUser(id) {
        this.cache['mnr_users'] = (this.cache['mnr_users'] || []).filter(u => u.id !== id);
        this._persistStore('mnr_users');
        return true;
    }

    // Departments CRUD
    getDepartments() { return this.cache['mnr_departments'] || []; }
    addDepartment(department) {
        const newDepartment = this._makeRecord(department);
        this.cache['mnr_departments'].push(newDepartment);
        this._persistStore('mnr_departments');
        return newDepartment;
    }
    updateDepartment(id, updates) {
        const arr = this.cache['mnr_departments'] || [];
        const idx = arr.findIndex(d => d.id === id);
        if (idx === -1) return null;
        arr[idx] = {...arr[idx], ...updates, updated_at: new Date().toISOString() };
        this._persistStore('mnr_departments');
        return arr[idx];
    }
    deleteDepartment(id) {
        this.cache['mnr_departments'] = (this.cache['mnr_departments'] || []).filter(d => d.id !== id);
        this._persistStore('mnr_departments');
        return true;
    }

    // Accessories CRUD
    getAccessories() { return this.cache['mnr_accessories'] || []; }
    addAccessory(accessory) {
        const newAccessory = this._makeRecord(accessory);
        this.cache['mnr_accessories'].push(newAccessory);
        this._persistStore('mnr_accessories');
        return newAccessory;
    }
    updateAccessory(id, updates) {
        const arr = this.cache['mnr_accessories'] || [];
        const idx = arr.findIndex(a => a.id === id);
        if (idx === -1) return null;
        arr[idx] = {...arr[idx], ...updates, updated_at: new Date().toISOString() };
        this._persistStore('mnr_accessories');
        return arr[idx];
    }
    deleteAccessory(id) {
        this.cache['mnr_accessories'] = (this.cache['mnr_accessories'] || []).filter(a => a.id !== id);
        this._persistStore('mnr_accessories');
        return true;
    }

    // IT Assets CRUD
    getITAssets() { return this.cache['mnr_it_assets'] || []; }
    addITAsset(asset) {
        const newAsset = this._makeRecord(asset);
        if (asset.division && asset.unit_office) this.autoCreateDepartment(asset.division, asset.unit_office);
        this.cache['mnr_it_assets'].push(newAsset);
        this._persistStore('mnr_it_assets');
        return newAsset;
    }
    updateITAsset(id, updates) {
        const arr = this.cache['mnr_it_assets'] || [];
        const idx = arr.findIndex(a => a.id === id);
        if (idx === -1) return null;
        arr[idx] = {...arr[idx], ...updates, updated_at: new Date().toISOString() };
        this._persistStore('mnr_it_assets');
        return arr[idx];
    }
    deleteITAsset(id) {
        this.cache['mnr_it_assets'] = (this.cache['mnr_it_assets'] || []).filter(a => a.id !== id);
        this._persistStore('mnr_it_assets');
        return true;
    }

    // Units CRUD
    getUnits() { return this.cache['mnr_units'] || []; }
    addUnit(unit) {
        const newUnit = this._makeRecord(unit);
        this.cache['mnr_units'].push(newUnit);
        this._persistStore('mnr_units');
        return newUnit;
    }
    updateUnit(id, updates) {
        const arr = this.cache['mnr_units'] || [];
        const idx = arr.findIndex(u => u.id === id);
        if (idx === -1) return null;
        arr[idx] = {...arr[idx], ...updates, updated_at: new Date().toISOString() };
        this._persistStore('mnr_units');
        return arr[idx];
    }
    deleteUnit(id) {
        this.cache['mnr_units'] = (this.cache['mnr_units'] || []).filter(u => u.id !== id);
        this._persistStore('mnr_units');
        return true;
    }

    // Products CRUD
    getProducts() { return this.cache['mnr_products'] || []; }
    addProduct(product) {
        const newProduct = this._makeRecord(product);
        if (product.department && product.unit) this.autoCreateDepartment(product.department, product.unit);
        this.cache['mnr_products'].push(newProduct);
        this._persistStore('mnr_products');
        return newProduct;
    }
    updateProduct(id, updates) {
        const arr = this.cache['mnr_products'] || [];
        const idx = arr.findIndex(p => p.id === id);
        if (idx === -1) return null;
        arr[idx] = {...arr[idx], ...updates, updated_at: new Date().toISOString() };
        this._persistStore('mnr_products');
        return arr[idx];
    }
    deleteProduct(id) {
        this.cache['mnr_products'] = (this.cache['mnr_products'] || []).filter(p => p.id !== id);
        this._persistStore('mnr_products');
        return true;
    }

    // --------------------- Search & Filter ---------------------
    searchProducts(query, filters = {}) {
        let products = this.getProducts();
        if (query) {
            const searchTerm = query.toLowerCase();
            products = products.filter(product =>
                (product.name || '').toLowerCase().includes(searchTerm) ||
                (product.category || '').toLowerCase().includes(searchTerm) ||
                (product.brand || '').toLowerCase().includes(searchTerm) ||
                (product.serial || '').toLowerCase().includes(searchTerm)
            );
        }
        if (filters.unit) products = products.filter(p => p.unit === filters.unit);
        if (filters.category) products = products.filter(p => p.category === filters.category);
        if (filters.status) products = products.filter(p => p.status === filters.status);
        return products;
    }

    getFilteredAssets(type) {
        const assets = this.getITAssets();
        switch (type) {
            case 'laptops':
                return assets.filter(a => (a.device_type || '').toLowerCase() === 'laptop');
            case 'desktops':
                return assets.filter(a => (a.device_type || '').toLowerCase() === 'desktop');
            case 'expired':
                return assets.filter(a => a.antivirus_validity && new Date(a.antivirus_validity) < new Date());
            default:
                return assets;
        }
    }

    getFilteredAssetsByCategory(category) {
        const assets = this.getITAssets();
        switch (category) {
            case 'laptops':
                return assets.filter(a => a.device_type === 'laptop');
            case 'desktops':
                return assets.filter(a => a.device_type === 'desktop');
            case 'in_repair':
                return assets.filter(a => (a.remarks || '').toLowerCase().includes('repair') || (a.remarks || '').toLowerCase().includes('faulty'));
            case 'active':
                return assets.filter(a => !((a.remarks || '').toLowerCase().includes('repair')) && !((a.remarks || '').toLowerCase().includes('faulty')) && !((a.remarks || '').toLowerCase().includes('inactive')));
            case 'expired_antivirus':
                return this.getExpiredAntivirusUsers().assets;
            default:
                return assets;
        }
    }

    // --------------------- Activities ---------------------
    addUserActivity(userId, activity) {
        const activities = this.cache['mnr_user_activities'] || [];
        const newActivity = {
            id: Date.now(),
            user_id: userId,
            ...activity,
            timestamp: new Date().toISOString(),
            date: new Date().toLocaleDateString(),
            time: new Date().toLocaleTimeString()
        };
        activities.push(newActivity);
        this.cache['mnr_user_activities'] = activities;
        this._persistStore('mnr_user_activities');
        return newActivity;
    }

    getUserActivities(userId) {
        const activities = this.cache['mnr_user_activities'] || [];
        return activities.filter(a => a.user_id === userId);
    }

    updateUserActivity(id, updates) {
        const arr = this.cache['mnr_user_activities'] || [];
        const idx = arr.findIndex(a => a.id === id);
        if (idx === -1) return null;
        arr[idx] = {...arr[idx], ...updates };
        this._persistStore('mnr_user_activities');
        return arr[idx];
    }

    deleteUserActivity(id) {
        this.cache['mnr_user_activities'] = (this.cache['mnr_user_activities'] || []).filter(a => a.id !== id);
        this._persistStore('mnr_user_activities');
        return true;
    }

    getRecentActivities() {
        const activities = this.cache['mnr_user_activities'] || [];
        const today = new Date().toLocaleDateString();
        const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toLocaleDateString();
        return {
            today: activities.filter(activity => activity.date === today),
            tomorrow: activities.filter(activity => activity.date === tomorrow),
            recent: activities.slice().sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 10)
        };
    }

    getUserStats(userId) {
        const activities = this.getUserActivities(userId);
        const accessories = this.getAccessories().filter(acc => acc.user_id === userId);
        return {
            mouse: activities.filter(a => a.type === 'mouse').length,
            keyboard: activities.filter(a => a.type === 'keyboard').length,
            antivirus: activities.filter(a => a.type === 'antivirus').length,
            battery: activities.filter(a => a.type === 'battery').length,
            laptop_exchanges: activities.filter(a => a.type === 'laptop_exchange').length,
            pc_exchanges: activities.filter(a => a.type === 'pc_exchange').length,
            total_accessories: accessories.length,
            total_activities: activities.length
        };
    }

    // --------------------- Export / Import ---------------------
    exportData() {
        return {
            users: this.getUsers(),
            departments: this.getDepartments(),
            assets: this.getITAssets(),
            units: this.getUnits(),
            products: this.getProducts(),
            activities: this.cache['mnr_user_activities'] || [],
            exportDate: new Date().toISOString()
        };
    }

    importData(data) {
        try {
            if (data.users) {
                this.cache['mnr_users'] = data.users;
                this._persistStore('mnr_users');
            }
            if (data.departments) {
                this.cache['mnr_departments'] = data.departments;
                this._persistStore('mnr_departments');
            }
            if (data.assets) {
                this.cache['mnr_it_assets'] = data.assets;
                this._persistStore('mnr_it_assets');
            }
            if (data.units) {
                this.cache['mnr_units'] = data.units;
                this._persistStore('mnr_units');
            }
            if (data.products) {
                this.cache['mnr_products'] = data.products;
                this._persistStore('mnr_products');
            }
            if (data.activities) {
                this.cache['mnr_user_activities'] = data.activities;
                this._persistStore('mnr_user_activities');
            }
            return true;
        } catch (error) {
            console.error('Import failed:', error);
            return false;
        }
    }

    // --------------------- Utilities / Stats ---------------------
    getExpiredAntivirusUsers() {
        const users = this.getUsers();
        const assets = this.getITAssets();
        const today = new Date();
        const expiredUsers = users.filter(u => u.antivirus_expiry && new Date(u.antivirus_expiry) < today);
        const expiredAssets = assets.filter(a => a.antivirus_validity && new Date(a.antivirus_validity) < today);
        return { users: expiredUsers, assets: expiredAssets };
    }

    getDepartmentStats() {
        const users = this.getUsers();
        const departments = this.getDepartments();
        const assets = this.getITAssets();
        return departments.map(dept => {
            const deptUsers = users.filter(user => user.department_id === dept.id.toString());
            const deptAssets = assets.filter(asset => asset.division === dept.name);
            const expiredAntivirus = deptUsers.filter(u => u.antivirus_expiry && new Date(u.antivirus_expiry) < new Date());
            const expiredAssets = deptAssets.filter(a => a.antivirus_validity && new Date(a.antivirus_validity) < new Date());
            return {
                ...dept,
                total_users: deptUsers.length,
                total_assets: deptAssets.length,
                expired_antivirus: expiredAntivirus.length + expiredAssets.length,
                users: deptUsers,
                assets: deptAssets
            };
        });
    }

    getUnitStats() {
        const units = this.getUnits();
        const departments = this.getDepartments();
        const users = this.getUsers();
        const assets = this.getITAssets();
        const products = this.getProducts();
        return units.map(unit => {
            const unitDepartments = departments.filter(d => d.unit === unit.name);
            const unitUsers = users.filter(u => {
                const userDept = departments.find(d => d.id.toString() === u.department_id);
                return userDept && userDept.unit === unit.name;
            });
            const unitAssets = assets.filter(a => {
                const assetDept = departments.find(d => d.name === a.division);
                return assetDept && assetDept.unit === unit.name;
            });
            const unitProducts = products.filter(p => p.unit === unit.name);
            return {
                ...unit,
                total_departments: unitDepartments.length,
                total_users: unitUsers.length,
                total_assets: unitAssets.length,
                total_products: unitProducts.length,
                departments: unitDepartments.map(dept => {
                    const deptUsers = users.filter(u => u.department_id === dept.id.toString());
                    const deptAssets = assets.filter(a => a.division === dept.name);
                    const expiredAntivirus = deptUsers.filter(u => u.antivirus_expiry && new Date(u.antivirus_expiry) < new Date());
                    const expiredAssets = deptAssets.filter(a => a.antivirus_validity && new Date(a.antivirus_validity) < new Date());
                    return {
                        ...dept,
                        total_users: deptUsers.length,
                        total_assets: deptAssets.length,
                        expired_antivirus: expiredAntivirus.length + expiredAssets.length,
                        users: deptUsers,
                        assets: deptAssets
                    };
                }),
                users: unitUsers,
                assets: unitAssets,
                products: unitProducts
            };
        });
    }

    autoCreateDepartment(departmentName, unitName) {
        const departments = this.getDepartments();
        const existing = departments.find(d => d.name === departmentName && d.unit === unitName);
        if (!existing) {
            const newDept = { id: Date.now(), name: departmentName, unit: unitName, created_at: new Date().toISOString() };
            this.cache['mnr_departments'].push(newDept);
            this._persistStore('mnr_departments');
            return newDept;
        }
        return existing;
    }
}

export default new DBService();