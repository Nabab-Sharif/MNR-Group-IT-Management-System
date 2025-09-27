// Database service for MNR IT Management System
// Simulates database operations with localStorage

class DBService {
  constructor() {
    this.initializeData();
  }

  initializeData() {
    if (!localStorage.getItem('mnr_users')) {
      localStorage.setItem('mnr_users', JSON.stringify([]));
    }
    // Departments Add Here
    if (!localStorage.getItem('mnr_departments')) {
      localStorage.setItem('mnr_departments', JSON.stringify([

      ]));
    }

    if (!localStorage.getItem('mnr_accessories')) {
      localStorage.setItem('mnr_accessories', JSON.stringify([]));
    }
    if (!localStorage.getItem('mnr_it_assets')) {
      localStorage.setItem('mnr_it_assets', JSON.stringify([]));
    }
    // Units and Office Add Here
    if (!localStorage.getItem('mnr_units')) {
      localStorage.setItem('mnr_units', JSON.stringify([
        // { id: 1, name: 'Unit-02', location: 'Main Office', created_at: new Date().toISOString() },
        // { id: 2, name: 'Unit-01', location: 'Secondary Office', created_at: new Date().toISOString() },
      ]));
    }

    if (!localStorage.getItem('mnr_products')) {
      localStorage.setItem('mnr_products', JSON.stringify([]));
    }
  }

  // Users CRUD
  getUsers() {
    return JSON.parse(localStorage.getItem('mnr_users') || '[]');
  }

  addUser(user) {
    const users = this.getUsers();
    const newUser = {
      ...user,
      id: Date.now(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    users.push(newUser);
    localStorage.setItem('mnr_users', JSON.stringify(users));
    return newUser;
  }

  updateUser(id, updates) {
    const users = this.getUsers();
    const index = users.findIndex(user => user.id === id);
    if (index !== -1) {
      users[index] = {
        ...users[index],
        ...updates,
        updated_at: new Date().toISOString(),
      };
      localStorage.setItem('mnr_users', JSON.stringify(users));
      return users[index];
    }
    return null;
  }

  deleteUser(id) {
    const users = this.getUsers();
    const filteredUsers = users.filter(user => user.id !== id);
    localStorage.setItem('mnr_users', JSON.stringify(filteredUsers));
    return true;
  }

  // Departments CRUD
  getDepartments() {
    return JSON.parse(localStorage.getItem('mnr_departments') || '[]');
  }

  addDepartment(department) {
    const departments = this.getDepartments();
    const newDepartment = {
      ...department,
      id: Date.now(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    departments.push(newDepartment);
    localStorage.setItem('mnr_departments', JSON.stringify(departments));
    return newDepartment;
  }

  updateDepartment(id, updates) {
    const departments = this.getDepartments();
    const index = departments.findIndex(dept => dept.id === id);
    if (index !== -1) {
      departments[index] = {
        ...departments[index],
        ...updates,
        updated_at: new Date().toISOString(),
      };
      localStorage.setItem('mnr_departments', JSON.stringify(departments));
      return departments[index];
    }
    return null;
  }

  deleteDepartment(id) {
    const departments = this.getDepartments();
    const filteredDepartments = departments.filter(dept => dept.id !== id);
    localStorage.setItem('mnr_departments', JSON.stringify(filteredDepartments));
    return true;
  }

  // Accessories CRUD
  getAccessories() {
    return JSON.parse(localStorage.getItem('mnr_accessories') || '[]');
  }

  addAccessory(accessory) {
    const accessories = this.getAccessories();
    const newAccessory = {
      ...accessory,
      id: Date.now(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    accessories.push(newAccessory);
    localStorage.setItem('mnr_accessories', JSON.stringify(accessories));
    return newAccessory;
  }

  updateAccessory(id, updates) {
    const accessories = this.getAccessories();
    const index = accessories.findIndex(acc => acc.id === id);
    if (index !== -1) {
      accessories[index] = {
        ...accessories[index],
        ...updates,
        updated_at: new Date().toISOString(),
      };
      localStorage.setItem('mnr_accessories', JSON.stringify(accessories));
      return accessories[index];
    }
    return null;
  }

  deleteAccessory(id) {
    const accessories = this.getAccessories();
    const filteredAccessories = accessories.filter(acc => acc.id !== id);
    localStorage.setItem('mnr_accessories', JSON.stringify(filteredAccessories));
    return true;
  }

  // IT Assets CRUD (for the comprehensive IT management table)
  getITAssets() {
    return JSON.parse(localStorage.getItem('mnr_it_assets') || '[]');
  }

  addITAsset(asset) {
    const assets = this.getITAssets();
    const newAsset = {
      ...asset,
      id: Date.now(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Auto-create department if it doesn't exist
    if (asset.division && asset.unit_office) {
      this.autoCreateDepartment(asset.division, asset.unit_office);
    }

    assets.push(newAsset);
    localStorage.setItem('mnr_it_assets', JSON.stringify(assets));
    return newAsset;
  }

  updateITAsset(id, updates) {
    const assets = this.getITAssets();
    const index = assets.findIndex(asset => asset.id === id);
    if (index !== -1) {
      assets[index] = {
        ...assets[index],
        ...updates,
        updated_at: new Date().toISOString(),
      };
      localStorage.setItem('mnr_it_assets', JSON.stringify(assets));
      return assets[index];
    }
    return null;
  }

  deleteITAsset(id) {
    const assets = this.getITAssets();
    const filteredAssets = assets.filter(asset => asset.id !== id);
    localStorage.setItem('mnr_it_assets', JSON.stringify(filteredAssets));
    return true;
  }

  // Utility methods
  getExpiredAntivirusUsers() {
    const users = this.getUsers();
    const assets = this.getITAssets();
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

  getDepartmentStats() {
    const users = this.getUsers();
    const departments = this.getDepartments();
    const assets = this.getITAssets();

    return departments.map(dept => {
      const deptUsers = users.filter(user => user.department_id === dept.id.toString());
      const deptAssets = assets.filter(asset => asset.division === dept.name);

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
        total_users: deptUsers.length,
        total_assets: deptAssets.length,
        expired_antivirus: expiredAntivirus.length + expiredAssets.length,
        users: deptUsers,
        assets: deptAssets,
      };
    });
  }

  // Units CRUD
  getUnits() {
    return JSON.parse(localStorage.getItem('mnr_units') || '[]');
  }

  addUnit(unit) {
    const units = this.getUnits();
    const newUnit = {
      ...unit,
      id: Date.now(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    units.push(newUnit);
    localStorage.setItem('mnr_units', JSON.stringify(units));
    return newUnit;
  }

  updateUnit(id, updates) {
    const units = this.getUnits();
    const index = units.findIndex(unit => unit.id === id);
    if (index !== -1) {
      units[index] = {
        ...units[index],
        ...updates,
        updated_at: new Date().toISOString(),
      };
      localStorage.setItem('mnr_units', JSON.stringify(units));
      return units[index];
    }
    return null;
  }

  deleteUnit(id) {
    const units = this.getUnits();
    const filteredUnits = units.filter(unit => unit.id !== id);
    localStorage.setItem('mnr_units', JSON.stringify(filteredUnits));
    return true;
  }

  // Products CRUD
  getProducts() {
    return JSON.parse(localStorage.getItem('mnr_products') || '[]');
  }

  addProduct(product) {
    const products = this.getProducts();
    const newProduct = {
      ...product,
      id: Date.now(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Auto-create department if it doesn't exist
    if (product.department && product.unit) {
      this.autoCreateDepartment(product.department, product.unit);
    }

    products.push(newProduct);
    localStorage.setItem('mnr_products', JSON.stringify(products));
    return newProduct;
  }

  updateProduct(id, updates) {
    const products = this.getProducts();
    const index = products.findIndex(product => product.id === id);
    if (index !== -1) {
      products[index] = {
        ...products[index],
        ...updates,
        updated_at: new Date().toISOString(),
      };
      localStorage.setItem('mnr_products', JSON.stringify(products));
      return products[index];
    }
    return null;
  }

  deleteProduct(id) {
    const products = this.getProducts();
    const filteredProducts = products.filter(product => product.id !== id);
    localStorage.setItem('mnr_products', JSON.stringify(filteredProducts));
    return true;
  }

  // Search and Filter methods
  searchProducts(query, filters = {}) {
    const products = this.getProducts();
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

  getFilteredAssets(type) {
    const assets = this.getITAssets();
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

  getUnitStats() {
    const units = this.getUnits();
    const departments = this.getDepartments();
    const users = this.getUsers();
    const assets = this.getITAssets();
    const products = this.getProducts();

    return units.map(unit => {
      const unitDepartments = departments.filter(dept => dept.unit === unit.name);
      const unitUsers = users.filter(user => {
        const userDept = departments.find(dept => dept.id.toString() === user.department_id);
        return userDept && userDept.unit === unit.name;
      });
      const unitAssets = assets.filter(asset => {
        const assetDept = departments.find(dept => dept.name === asset.division);
        return assetDept && assetDept.unit === unit.name;
      });
      const unitProducts = products.filter(product => product.unit === unit.name);

      return {
        ...unit,
        total_departments: unitDepartments.length,
        total_users: unitUsers.length,
        total_assets: unitAssets.length,
        total_products: unitProducts.length,
        departments: unitDepartments.map(dept => {
          const deptUsers = users.filter(user => user.department_id === dept.id.toString());
          const deptAssets = assets.filter(asset => asset.division === dept.name);

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
            total_users: deptUsers.length,
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
  autoCreateDepartment(departmentName, unitName) {
    const departments = this.getDepartments();
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
      departments.push(newDepartment);
      localStorage.setItem('mnr_departments', JSON.stringify(departments));
    }
  }

  // Filter assets by type with enhanced filtering
  getFilteredAssetsByCategory(category) {
    const assets = this.getITAssets();
    switch (category) {
      case 'laptops':
        return assets.filter(asset => asset.device_type === 'laptop');
      case 'desktops':
        return assets.filter(asset => asset.device_type === 'desktop');
      case 'in_repair':
        return assets.filter(asset => asset.remarks?.toLowerCase().includes('repair') ||
          asset.remarks?.toLowerCase().includes('faulty'));
      case 'active':
        return assets.filter(asset => !asset.remarks?.toLowerCase().includes('repair') &&
          !asset.remarks?.toLowerCase().includes('faulty') &&
          !asset.remarks?.toLowerCase().includes('inactive'));
      case 'expired_antivirus':
        return this.getExpiredAntivirusUsers().assets;
      default:
        return assets;
    }
  }

  // User Activity Tracking
  addUserActivity(userId, activity) {
    const activities = JSON.parse(localStorage.getItem('mnr_user_activities') || '[]');
    const newActivity = {
      id: Date.now(),
      user_id: userId,
      ...activity,
      timestamp: new Date().toISOString(),
      date: new Date().toLocaleDateString(),
      time: new Date().toLocaleTimeString()
    };
    activities.push(newActivity);
    localStorage.setItem('mnr_user_activities', JSON.stringify(activities));
    return newActivity;
  }

  getUserActivities(userId) {
    const activities = JSON.parse(localStorage.getItem('mnr_user_activities') || '[]');
    return activities.filter(activity => activity.user_id === userId);
  }

  updateUserActivity(id, updates) {
    const activities = JSON.parse(localStorage.getItem('mnr_user_activities') || '[]');
    const index = activities.findIndex(activity => activity.id === id);
    if (index !== -1) {
      activities[index] = { ...activities[index], ...updates };
      localStorage.setItem('mnr_user_activities', JSON.stringify(activities));
      return activities[index];
    }
    return null;
  }

  deleteUserActivity(id) {
    const activities = JSON.parse(localStorage.getItem('mnr_user_activities') || '[]');
    const filtered = activities.filter(activity => activity.id !== id);
    localStorage.setItem('mnr_user_activities', JSON.stringify(filtered));
    return true;
  }

  getRecentActivities() {
    const activities = JSON.parse(localStorage.getItem('mnr_user_activities') || '[]');
    const today = new Date().toLocaleDateString();
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toLocaleDateString();

    return {
      today: activities.filter(activity => activity.date === today),
      tomorrow: activities.filter(activity => activity.date === tomorrow),
      recent: activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 10)
    };
  }

  getUserStats(userId) {
    const activities = this.getUserActivities(userId);
    const accessories = this.getAccessories().filter(acc => acc.user_id === userId);

    const stats = {
      mouse: activities.filter(a => a.type === 'mouse').length,
      keyboard: activities.filter(a => a.type === 'keyboard').length,
      antivirus: activities.filter(a => a.type === 'antivirus').length,
      battery: activities.filter(a => a.type === 'battery').length,
      laptop_exchanges: activities.filter(a => a.type === 'laptop_exchange').length,
      pc_exchanges: activities.filter(a => a.type === 'pc_exchange').length,
      total_accessories: accessories.length,
      total_activities: activities.length
    };

    return stats;
  }

  // Export data to JSON format
  exportData() {
    const data = {
      users: this.getUsers(),
      departments: this.getDepartments(),
      assets: this.getITAssets(),
      units: this.getUnits(),
      products: this.getProducts(),
      activities: JSON.parse(localStorage.getItem('mnr_user_activities') || '[]'),
      exportDate: new Date().toISOString()
    };
    return data;
  }

  // Import data from JSON format
  importData(data) {
    try {
      if (data.users) localStorage.setItem('mnr_users', JSON.stringify(data.users));
      if (data.departments) localStorage.setItem('mnr_departments', JSON.stringify(data.departments));
      if (data.assets) localStorage.setItem('mnr_it_assets', JSON.stringify(data.assets));
      if (data.units) localStorage.setItem('mnr_units', JSON.stringify(data.units));
      if (data.products) localStorage.setItem('mnr_products', JSON.stringify(data.products));
      if (data.activities) localStorage.setItem('mnr_user_activities', JSON.stringify(data.activities));
      return true;
    } catch (error) {
      console.error('Import failed:', error);
      return false;
    }
  }
}

export default new DBService();