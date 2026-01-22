// Database service for MNR IT Management System
// Uses IndexedDB for persistent storage with better capacity

import indexedDB from './indexedDBService';

class DBService {
    constructor() {
        this.dbReady = false;
        this.initializeData();
    }

    async initializeData() {
        await indexedDB.initDB();

        // Migrate from localStorage if needed
        const hasLocalStorage = localStorage.getItem('mnr_users') ||
            localStorage.getItem('mnr_departments');
        if (hasLocalStorage) {
            await indexedDB.migrateFromLocalStorage();
            console.log('Data migrated from localStorage to IndexedDB');
        }

        this.dbReady = true;
    }

    // Users CRUD
    async getUsers() {
        return await indexedDB.getAll('users');
    }

    async addUser(user) {
        const newUser = {
            ...user,
            id: Date.now(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        };
        return await indexedDB.add('users', newUser);
    }

    async updateUser(id, updates) {
        const user = await indexedDB.get('users', id);
        if (user) {
            const updatedUser = {
                ...user,
                ...updates,
                updated_at: new Date().toISOString(),
            };
            return await indexedDB.put('users', updatedUser);
        }
        return null;
    }

    async deleteUser(id) {
        return await indexedDB.delete('users', id);
    }

    // Departments CRUD
    async getDepartments() {
        return await indexedDB.getAll('departments');
    }

    async addDepartment(department) {
        const newDepartment = {
            ...department,
            id: Date.now(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        };
        return await indexedDB.add('departments', newDepartment);
    }

    async updateDepartment(id, updates) {
        const department = await indexedDB.get('departments', id);
        if (department) {
            const oldName = department.name;
            const updatedDepartment = {
                ...department,
                ...updates,
                updated_at: new Date().toISOString(),
            };
            await indexedDB.put('departments', updatedDepartment);

            // If department name changed, update all related records
            if (updates.name && updates.name !== oldName) {
                await this.updateDepartmentReferences(oldName, updates.name);
            }

            return updatedDepartment;
        }
        return null;
    }

    async deleteDepartment(id) {
        return await indexedDB.delete('departments', id);
    }

    // Update all references to a department when its name changes
    async updateDepartmentReferences(oldName, newName) {
        // Update IT assets
        const assets = await indexedDB.getAll('it_assets');
        const updatedAssets = assets.filter(asset => asset.division === oldName);
        for (const asset of updatedAssets) {
            asset.division = newName;
            await indexedDB.put('it_assets', asset);
        }

        // Update products
        const products = await indexedDB.getAll('products');
        const updatedProducts = products.filter(product => product.department === oldName);
        for (const product of updatedProducts) {
            product.department = newName;
            await indexedDB.put('products', product);
        }
    }

    // Accessories CRUD
    async getAccessories() {
        return await indexedDB.getAll('accessories');
    }

    async addAccessory(accessory) {
        const newAccessory = {
            ...accessory,
            id: Date.now(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        };
        return await indexedDB.add('accessories', newAccessory);
    }

    async updateAccessory(id, updates) {
        const accessory = await indexedDB.get('accessories', id);
        if (accessory) {
            const updatedAccessory = {
                ...accessory,
                ...updates,
                updated_at: new Date().toISOString(),
            };
            return await indexedDB.put('accessories', updatedAccessory);
        }
        return null;
    }

    async deleteAccessory(id) {
        return await indexedDB.delete('accessories', id);
    }

    // IT Assets CRUD (for the comprehensive IT management table)
    async getITAssets() {
        return await indexedDB.getAll('it_assets');
    }

    async addITAsset(asset) {
        const newAsset = {
            ...asset,
            id: Date.now(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        };

        // Auto-create department if it doesn't exist
        if (asset.division && asset.unit_office) {
            await this.autoCreateDepartment(asset.division, asset.unit_office);
        }

        // Auto-create user profile from IT Asset data
        if (asset.employee_name) {
            const users = await this.getUsers();
            const departments = await this.getDepartments();

            // Find the department ID
            const department = departments.find(dept => dept.name === asset.division);

            // Check if user already exists
            const existingUser = users.find(user =>
                user.name === asset.employee_name &&
                user.email === asset.email
            );

            // Only create new user if doesn't exist
            if (!existingUser) {
                const newUser = {
                    id: Date.now() + 1,
                    name: asset.employee_name,
                    designation: asset.designation,
                    email: asset.email,
                    department_id: department?.id.toString() || '1',
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                };
                await indexedDB.add('users', newUser);
            }
        }

        return await indexedDB.add('it_assets', newAsset);
    }

    async updateITAsset(id, updates) {
        const asset = await indexedDB.get('it_assets', id);
        if (asset) {
            const updatedAsset = {
                ...asset,
                ...updates,
                updated_at: new Date().toISOString(),
            };
            return await indexedDB.put('it_assets', updatedAsset);
        }
        return null;
    }

    async deleteITAsset(id) {
        return await indexedDB.delete('it_assets', id);
    }

    // Utility methods
    async getExpiredAntivirusUsers() {
        const users = await this.getUsers();
        const assets = await this.getITAssets();
        const today = new Date();

        // Check both users and IT assets for expired antivirus
        const expiredUsers = users.filter(user => {
            if (user.antivirus_expiry) {
                const expiryDate = new Date(user.antivirus_expiry);
                return expiryDate < today;
            }
            return false;
        });

        const expiredAssets = assets.filter(asset => {
            if (asset.antivirus_validity) {
                const expiryDate = new Date(asset.antivirus_validity);
                return expiryDate < today;
            }
            return false;
        });

        return { users: expiredUsers, assets: expiredAssets };
    }

    async getDepartmentStats() {
        const users = await this.getUsers();
        const departments = await this.getDepartments();
        const assets = await this.getITAssets();

        return departments.map(dept => {
            const deptUsers = users.filter(user => user.department_id === dept.id.toString());
            // Filter assets by BOTH division (department name) AND unit (to ensure unit isolation)
            const deptAssets = assets.filter(asset =>
                asset.division === dept.name && asset.unit_office === dept.unit
            );

            // Get unique employees from assets for this department
            const employeesFromAssets = deptAssets
                .filter(asset => asset.employee_name && asset.employee_name.trim() !== '')
                .map(asset => asset.employee_name.trim().toLowerCase());

            const uniqueEmployees = new Set([
                ...deptUsers.map(u => u.name.trim().toLowerCase()),
                ...employeesFromAssets
            ]);

            const expiredAntivirus = deptUsers.filter(user => {
                if (user.antivirus_expiry) {
                    const expiryDate = new Date(user.antivirus_expiry);
                    return expiryDate < new Date();
                }
                return false;
            });

            const expiredAssets = deptAssets.filter(asset => {
                if (asset.antivirus_validity) {
                    const expiryDate = new Date(asset.antivirus_validity);
                    return expiryDate < new Date();
                }
                return false;
            });

            return {
                ...dept,
                total_assets: uniqueEmployees.size, // Assets count = unique employees
                expired_antivirus: expiredAntivirus.length + expiredAssets.length,
                users: deptUsers,
                assets: deptAssets,
            };
        });
    }

    // Units CRUD
    async getUnits() {
        return await indexedDB.getAll('units');
    }

    async addUnit(unit) {
        const newUnit = {
            ...unit,
            id: Date.now(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        };
        return await indexedDB.add('units', newUnit);
    }

    async updateUnit(id, updates) {
        const unit = await indexedDB.get('units', id);
        if (unit) {
            const updatedUnit = {
                ...unit,
                ...updates,
                updated_at: new Date().toISOString(),
            };
            return await indexedDB.put('units', updatedUnit);
        }
        return null;
    }

    async deleteUnit(id) {
        return await indexedDB.delete('units', id);
    }

    // Products CRUD
    async getProducts() {
        return await indexedDB.getAll('products');
    }

    async addProduct(product) {
        const newProduct = {
            ...product,
            id: Date.now(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        };

        // Auto-create department if it doesn't exist
        if (product.department && product.unit) {
            await this.autoCreateDepartment(product.department, product.unit);
        }

        return await indexedDB.add('products', newProduct);
    }

    async updateProduct(id, updates) {
        const product = await indexedDB.get('products', id);
        if (product) {
            const updatedProduct = {
                ...product,
                ...updates,
                updated_at: new Date().toISOString(),
            };
            return await indexedDB.put('products', updatedProduct);
        }
        return null;
    }

    async deleteProduct(id) {
        return await indexedDB.delete('products', id);
    }

    // Search and Filter methods
    async searchProducts(query, filters = {}) {
        const products = await this.getProducts();
        let filtered = products;

        // Apply text search
        if (query) {
            const searchTerm = query.toLowerCase();
            filtered = filtered.filter(product =>
                product.name?.toLowerCase().includes(searchTerm) ||
                product.category?.toLowerCase().includes(searchTerm) ||
                product.brand?.toLowerCase().includes(searchTerm) ||
                product.serial?.toLowerCase().includes(searchTerm)
            );
        }

        // Apply filters
        if (filters.unit) {
            filtered = filtered.filter(product => product.unit === filters.unit);
        }
        if (filters.category) {
            filtered = filtered.filter(product => product.category === filters.category);
        }
        if (filters.status) {
            filtered = filtered.filter(product => product.status === filters.status);
        }

        return filtered;
    }

    async getFilteredAssets(type) {
        const assets = await this.getITAssets();
        switch (type) {
            case 'laptops':
                return assets.filter(asset => asset.device_type?.toLowerCase() === 'laptop');
            case 'desktops':
                return assets.filter(asset => asset.device_type?.toLowerCase() === 'desktop');
            case 'expired':
                return assets.filter(asset => {
                    if (asset.antivirus_validity) {
                        const expiryDate = new Date(asset.antivirus_validity);
                        return expiryDate < new Date();
                    }
                    return false;
                });
            default:
                return assets;
        }
    }

    async getUnitStats() {
        const units = await this.getUnits();
        const departments = await this.getDepartments();
        const users = await this.getUsers();
        const assets = await this.getITAssets();
        const products = await this.getProducts();

        return units.map(unit => {
            // Filter departments by unit name
            const unitDepartments = departments.filter(dept => dept.unit === unit.name);

            // Filter assets directly by unit_office field - this is the key isolation
            const unitAssets = assets.filter(asset => asset.unit_office === unit.name);

            // Filter users by department belonging to this unit
            const unitUsers = users.filter(user => {
                const userDept = departments.find(dept => dept.id.toString() === user.department_id);
                return userDept && userDept.unit === unit.name;
            });

            const unitProducts = products.filter(product => product.unit === unit.name);

            // Get unique employees from unit assets (filtered by unit_office)
            const employeesFromUnitAssets = unitAssets
                .filter(asset => asset.employee_name && asset.employee_name.trim() !== '')
                .map(asset => asset.employee_name.trim().toLowerCase());

            const uniqueUnitEmployees = new Set([
                ...unitUsers.map(u => u.name.trim().toLowerCase()),
                ...employeesFromUnitAssets
            ]);

            return {
                ...unit,
                total_departments: unitDepartments.length,
                total_assets: uniqueUnitEmployees.size, // Assets count = unique employees
                total_products: unitProducts.length,
                departments: unitDepartments.map(dept => {
                    const deptUsers = users.filter(user => user.department_id === dept.id.toString());
                    // Filter assets by BOTH division (department name) AND unit_office
                    const deptAssets = unitAssets.filter(asset => asset.division === dept.name);

                    // Get unique employees from dept assets
                    const employeesFromDeptAssets = deptAssets
                        .filter(asset => asset.employee_name && asset.employee_name.trim() !== '')
                        .map(asset => asset.employee_name.trim().toLowerCase());

                    const uniqueDeptEmployees = new Set([
                        ...deptUsers.map(u => u.name.trim().toLowerCase()),
                        ...employeesFromDeptAssets
                    ]);

                    const expiredAntivirus = deptUsers.filter(user => {
                        if (user.antivirus_expiry) {
                            const expiryDate = new Date(user.antivirus_expiry);
                            return expiryDate < new Date();
                        }
                        return false;
                    });

                    const expiredAssets = deptAssets.filter(asset => {
                        if (asset.antivirus_validity) {
                            const expiryDate = new Date(asset.antivirus_validity);
                            return expiryDate < new Date();
                        }
                        return false;
                    });

                    return {
                        ...dept,
                        total_users: uniqueDeptEmployees.size,
                        total_assets: deptAssets.length,
                        expired_antivirus: expiredAntivirus.length + expiredAssets.length,
                        users: deptUsers,
                        assets: deptAssets,
                    };
                }),
                users: unitUsers,
                assets: unitAssets,
                products: unitProducts
            };
        });
    }

    // Auto-create department if it doesn't exist
    async autoCreateDepartment(departmentName, unitName) {
        const departments = await this.getDepartments();
        const existingDept = departments.find(dept =>
            dept.name === departmentName && dept.unit === unitName
        );

        if (!existingDept) {
            const newDepartment = {
                id: Date.now(),
                name: departmentName,
                unit: unitName,
                created_at: new Date().toISOString()
            };
            await indexedDB.add('departments', newDepartment);
        }
    }

    // Filter assets by type with enhanced filtering
    async getFilteredAssetsByCategory(category) {
        const assets = await this.getITAssets();
        switch (category) {
            case 'laptops':
                return assets.filter(asset => asset.device_type === 'laptop');
            case 'desktops':
                return assets.filter(asset => asset.device_type === 'desktop');
            case 'in_repair':
                return assets.filter(asset => asset.remarks?.toLowerCase().includes('repair') ||
                    asset.remarks?.toLowerCase().includes('faulty'));
            case 'active':
                return assets.filter(asset =>
                    !asset.remarks ||
                    (
                        !asset.remarks.toLowerCase().includes('repair') &&
                        !asset.remarks.toLowerCase().includes('faulty') &&
                        !asset.remarks.toLowerCase().includes('inactive')
                    )
                );
            case 'expired_antivirus':
                const expired = await this.getExpiredAntivirusUsers();
                return expired.assets;
            default:
                return assets;
        }
    }

    // User Activity Tracking
    async addUserActivity(userId, activity) {
        const activities = await indexedDB.getAll('user_activities');
        const newActivity = {
            id: Date.now(),
            user_id: userId,
            ...activity,
            timestamp: new Date().toISOString(),
            date: new Date().toLocaleDateString(),
            time: new Date().toLocaleTimeString()
        };
        await indexedDB.add('user_activities', newActivity);
        return newActivity;
    }

    async getUserActivities(userId) {
        const activities = await indexedDB.getAll('user_activities');
        return activities.filter(activity => activity.user_id === userId);
    }

    async updateUserActivity(id, updates) {
        const activity = await indexedDB.get('user_activities', id);
        if (activity) {
            const updatedActivity = {...activity, ...updates };
            return await indexedDB.put('user_activities', updatedActivity);
        }
        return null;
    }

    async deleteUserActivity(id) {
        return await indexedDB.delete('user_activities', id);
    }

    async getRecentActivities() {
        const activities = await indexedDB.getAll('user_activities');
        const today = new Date().toLocaleDateString();
        const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toLocaleDateString();

        return {
            today: activities.filter(activity => activity.date === today),
            tomorrow: activities.filter(activity => activity.date === tomorrow),
            recent: activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 10)
        };
    }

    async getUserStats(userId) {
        const activities = await this.getUserActivities(userId);
        const accessories = await this.getAccessories();
        const userAccessories = accessories.filter(acc => acc.user_id === userId);

        const stats = {
            mouse: activities.filter(a => a.type === 'mouse').length,
            keyboard: activities.filter(a => a.type === 'keyboard').length,
            antivirus: activities.filter(a => a.type === 'antivirus').length,
            battery: activities.filter(a => a.type === 'battery').length,
            laptop_exchanges: activities.filter(a => a.type === 'laptop_exchange').length,
            pc_exchanges: activities.filter(a => a.type === 'pc_exchange').length,
            total_accessories: userAccessories.length,
            total_activities: activities.length
        };

        return stats;
    }

    // Schedule Management
    async getSchedules() {
        return await indexedDB.getAll('schedules');
    }

    async getTomorrowSchedules() {
        const schedules = await this.getSchedules();
        const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toLocaleDateString();
        return schedules.filter(schedule => schedule.date === tomorrow);
    }

    async addSchedule(schedule) {
        const newSchedule = {
            id: Date.now(),
            ...schedule,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        };
        return await indexedDB.add('schedules', newSchedule);
    }

    async updateSchedule(id, updates) {
        const schedule = await indexedDB.get('schedules', id);
        if (schedule) {
            const updatedSchedule = {
                ...schedule,
                ...updates,
                updated_at: new Date().toISOString(),
            };
            return await indexedDB.put('schedules', updatedSchedule);
        }
        return null;
    }

    async deleteSchedule(id) {
        return await indexedDB.delete('schedules', id);
    }

    async clearAllData() {
        // Clear ALL persisted data (IndexedDB + localStorage)
        const stores = [
            'users',
            'departments',
            'accessories',
            'it_assets',
            'units',
            'products',
            'user_activities',
            'printers',
            'ip_phones',
            'wifi_networks',
            'ip_addresses',
            'cctv_cameras',
            'nvrs',
            'cctv_checklists',
            'schedules',
        ];

        // 1) Clear localStorage first so migration can't restore old data
        Object.keys(localStorage).forEach((key) => {
            if (key.startsWith('mnr_') || key.startsWith('cctv_')) {
                localStorage.removeItem(key);
            }
        });

        // 2) Clear object stores (best-effort)
        for (const store of stores) {
            try {
                await indexedDB.clear(store);
            } catch {
                // ignore
            }
        }

        // 3) Hard reset IndexedDB database
        await indexedDB.deleteDatabase();

        // 4) Re-init to recreate required stores + default baseline data
        await this.initializeData();

        return true;
    }

    // Export data to JSON format - includes ALL data
    async exportData() {
        const data = {
            users: await this.getUsers(),
            departments: await this.getDepartments(),
            assets: await this.getITAssets(),
            units: await this.getUnits(),
            products: await this.getProducts(),
            activities: await indexedDB.getAll('user_activities'),
            printers: await this.getPrinters(),
            ip_phones: await this.getIPPhones(),
            wifi_networks: await this.getWifiNetworks(),
            ip_addresses: await this.getIPAddresses(),
            cctv_cameras: await this.getCCTVCameras(),
            nvrs: await this.getNVRs(),
            cctv_checklists: await this.getCCTVChecklists(),
            exportDate: new Date().toISOString()
        };
        return data;
    }

    // Import data from JSON format - includes ALL data
    async importData(data) {
        try {
            if (data.users) await indexedDB.bulkPut('users', data.users);
            if (data.departments) await indexedDB.bulkPut('departments', data.departments);
            if (data.assets) await indexedDB.bulkPut('it_assets', data.assets);
            if (data.units) await indexedDB.bulkPut('units', data.units);
            if (data.products) await indexedDB.bulkPut('products', data.products);
            if (data.activities) await indexedDB.bulkPut('user_activities', data.activities);
            if (data.printers) await indexedDB.bulkPut('printers', data.printers);
            if (data.ip_phones) await indexedDB.bulkPut('ip_phones', data.ip_phones);
            if (data.wifi_networks) await indexedDB.bulkPut('wifi_networks', data.wifi_networks);
            if (data.ip_addresses) await indexedDB.bulkPut('ip_addresses', data.ip_addresses);
            if (data.cctv_cameras) await indexedDB.bulkPut('cctv_cameras', data.cctv_cameras);
            if (data.nvrs) await indexedDB.bulkPut('nvrs', data.nvrs);
            if (data.cctv_checklists) await indexedDB.bulkPut('cctv_checklists', data.cctv_checklists);
            return true;
        } catch (error) {
            console.error('Import failed:', error);
            return false;
        }
    }

    // Printers CRUD
    async getPrinters() {
        return await indexedDB.getAll('printers');
    }

    async addPrinter(printer) {
        const newPrinter = {
            ...printer,
            id: Date.now(),
            added_date: new Date().toISOString(),
        };
        return await indexedDB.add('printers', newPrinter);
    }

    async updatePrinter(id, updates) {
        const printer = await indexedDB.get('printers', id);
        if (printer) {
            const updatedPrinter = {...printer, ...updates };
            return await indexedDB.put('printers', updatedPrinter);
        }
        return null;
    }

    async deletePrinter(id) {
        return await indexedDB.delete('printers', id);
    }

    // IP Phones CRUD
    async getIPPhones() {
        const phones = await indexedDB.getAll('ip_phones');
        // Auto-generate SL numbers
        return phones.map((phone, index) => ({
            ...phone,
            sl_no: index + 1
        }));
    }

    async addIPPhone(phone) {
        const newPhone = {
            ...phone,
            id: Date.now(),
            added_date: new Date().toISOString(),
        };
        return await indexedDB.add('ip_phones', newPhone);
    }

    async updateIPPhone(id, updates) {
        const phone = await indexedDB.get('ip_phones', id);
        if (phone) {
            const updatedPhone = {...phone, ...updates };
            return await indexedDB.put('ip_phones', updatedPhone);
        }
        return null;
    }

    async deleteIPPhone(id) {
        return await indexedDB.delete('ip_phones', id);
    }

    // WiFi Networks CRUD
    async getWifiNetworks() {
        return await indexedDB.getAll('wifi_networks');
    }

    async addWifiNetwork(wifi) {
        const newWifi = {
            ...wifi,
            id: Date.now(),
            added_date: new Date().toISOString(),
        };
        return await indexedDB.add('wifi_networks', newWifi);
    }

    async updateWifiNetwork(id, updates) {
        const wifi = await indexedDB.get('wifi_networks', id);
        if (wifi) {
            const updatedWifi = {...wifi, ...updates };
            return await indexedDB.put('wifi_networks', updatedWifi);
        }
        return null;
    }

    async deleteWifiNetwork(id) {
        return await indexedDB.delete('wifi_networks', id);
    }

    // IP Addresses CRUD
    async getIPAddresses() {
        return await indexedDB.getAll('ip_addresses');
    }

    async addIPAddress(ipAddress) {
        const newIP = {
            ...ipAddress,
            id: Date.now(),
            added_date: new Date().toISOString(),
        };
        return await indexedDB.add('ip_addresses', newIP);
    }

    async updateIPAddress(id, updates) {
        const ip = await indexedDB.get('ip_addresses', id);
        if (ip) {
            const updatedIP = {...ip, ...updates };
            return await indexedDB.put('ip_addresses', updatedIP);
        }
        return null;
    }

    async deleteIPAddress(id) {
        return await indexedDB.delete('ip_addresses', id);
    }

    // CCTV Cameras CRUD
    async getCCTVCameras() {
        return await indexedDB.getAll('cctv_cameras');
    }

    async addCCTVCamera(camera) {
        const newCamera = {
            ...camera,
            id: Date.now(),
            added_date: new Date().toISOString(),
        };
        return await indexedDB.add('cctv_cameras', newCamera);
    }

    async updateCCTVCamera(id, updates) {
        const camera = await indexedDB.get('cctv_cameras', id);
        if (camera) {
            const updatedCamera = {...camera, ...updates };
            return await indexedDB.put('cctv_cameras', updatedCamera);
        }
        return null;
    }

    async deleteCCTVCamera(id) {
        return await indexedDB.delete('cctv_cameras', id);
    }

    // NVR CRUD
    async getNVRs() {
        return await indexedDB.getAll('nvrs');
    }

    async addNVR(nvr) {
        const newNVR = {
            ...nvr,
            id: Date.now(),
            created_at: new Date().toISOString(),
        };
        return await indexedDB.add('nvrs', newNVR);
    }

    async updateNVR(id, updates) {
        const nvr = await indexedDB.get('nvrs', id);
        if (nvr) {
            const updatedNVR = {...nvr, ...updates };
            return await indexedDB.put('nvrs', updatedNVR);
        }
        return null;
    }

    async deleteNVR(id) {
        return await indexedDB.delete('nvrs', id);
    }

    // CCTV Checklists CRUD
    async getCCTVChecklists() {
        return await indexedDB.getAll('cctv_checklists');
    }

    async addCCTVChecklist(checklist) {
        const newChecklist = {
            ...checklist,
            id: Date.now(),
            created_at: new Date().toISOString(),
        };
        return await indexedDB.add('cctv_checklists', newChecklist);
    }

    async updateCCTVChecklist(id, updates) {
        const checklist = await indexedDB.get('cctv_checklists', id);
        if (checklist) {
            const updatedChecklist = {...checklist, ...updates };
            return await indexedDB.put('cctv_checklists', updatedChecklist);
        }
        return null;
    }

    async deleteCCTVChecklist(id) {
        return await indexedDB.delete('cctv_checklists', id);
    }
}

export default new DBService();