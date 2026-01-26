/**
 * Utility function to show a confirmation dialog before delete operations
 * Uses browser's native confirm dialog for consistency
 */
export const confirmDelete = (message: string): boolean => {
  return window.confirm(message);
};

/**
 * Delete confirmation messages for different entities
 */
export const deleteConfirmMessages = {
  user: (name: string) => `Are you sure you want to delete user "${name}"? This action cannot be undone.`,
  product: (name: string) => `Are you sure you want to delete product "${name}"? This action cannot be undone.`,
  category: (name: string, count: number) => 
    count > 0 
      ? `This category "${name}" has ${count} products. Delete all products in this category? This action cannot be undone.`
      : `Are you sure you want to delete category "${name}"? This action cannot be undone.`,
  peripheral: (name: string) => `Are you sure you want to delete peripheral "${name}"? This action cannot be undone.`,
  activity: () => `Are you sure you want to delete this activity? This action cannot be undone.`,
  schedule: () => `Are you sure you want to delete this schedule? This action cannot be undone.`,
  printer: (name: string) => `Are you sure you want to delete printer "${name}"? This action cannot be undone.`,
  ipPhone: (name: string) => `Are you sure you want to delete IP Phone "${name}"? This action cannot be undone.`,
  wifiNetwork: (name: string) => `Are you sure you want to delete WiFi network "${name}"? This action cannot be undone.`,
  ipAddress: (address: string) => `Are you sure you want to delete IP address "${address}"? This action cannot be undone.`,
  cctv: (name: string) => `Are you sure you want to delete CCTV camera "${name}"? This action cannot be undone.`,
  nvr: (name: string) => `Are you sure you want to delete NVR "${name}"? This action cannot be undone.`,
  checklist: () => `Are you sure you want to delete this checklist? This action cannot be undone.`,
  itPerson: (name: string) => `Are you sure you want to delete IT Person "${name}"? This action cannot be undone.`,
  generic: () => `Are you sure you want to delete this item? This action cannot be undone.`,
};
