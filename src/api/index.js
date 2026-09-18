export * from './client.js';
export * as adminApi from './admin/index.js';
export * from './admin/index.js';

// Tương thích ngược (Backward compatibility)
export {
  planApi as planService,
  employeeApi as employeeService,
  retailShopApi as retailShopService,
  vendorApi as vendorService,
  inventoryApi as inventoryService,
} from './admin/index.js';
