/**
 * Seller Services — barrel export
 *
 * Usage in components:
 *   import { sellerProfileService, sellerProductService } from '../../services/seller'
 *
 * All services use the same sellerAxios instance which:
 *   - Injects Bearer token automatically
 *   - Unwraps { success, data } envelope → returns data directly
 *   - Handles 401 (auto logout) and 403 (permission error)
 */

export { default as sellerAxios }          from './axiosInstance'
export { default as sellerProfileService } from './sellerProfileService'
export { default as sellerProductService } from './sellerProductService'
export { default as sellerOrderService }   from './sellerOrderService'
export { default as sellerShipmentService }from './sellerShipmentService'
export { default as sellerReturnService }  from './sellerReturnService'
