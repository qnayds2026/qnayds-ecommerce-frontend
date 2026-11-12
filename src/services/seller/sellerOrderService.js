/**
 * Seller Order Service
 *
 * GET    /seller/orders                        → list seller orders
 * GET    /seller/orders/:orderId               → get single order
 * PATCH  /seller/orders/:orderId/status        → update order status
 * POST   /seller/orders/:orderId/shipment      → create shipment for order
 */
import sellerAxios from './axiosInstance'

const sellerOrderService = {
  /**
   * List all orders for the authenticated seller
   * @param {{ page?: number, limit?: number }} params
   * @returns {Promise<{ orders: SellerOrder[], pagination: Pagination }>}
   */
  listOrders: ({ page = 1, limit = 10 } = {}) =>
    sellerAxios.get('/seller/orders', { params: { page, limit } }),

  /**
   * Get full details of a single seller order
   * @param {string} orderId
   * @returns {Promise<SellerOrder>}
   */
  getOrder: (orderId) =>
    sellerAxios.get(`/seller/orders/${orderId}`),

  /**
   * Update the status of a seller order
   * Note: SHIPPED status must be set via createShipment, not this endpoint
   * @param {string} orderId
   * @param {{ status: string, note?: string }} data
   * @returns {Promise<SellerOrder>}
   */
  updateOrderStatus: (orderId, data) =>
    sellerAxios.patch(`/seller/orders/${orderId}/status`, data),

  /**
   * Create a shipment for an order (also sets order status to SHIPPED)
   * @param {string} orderId
   * @param {{ carrierName: string, trackingNumber: string, trackingUrl?: string }} data
   * @returns {Promise<Shipment>}
   */
  createShipment: (orderId, data) =>
    sellerAxios.post(`/seller/orders/${orderId}/shipment`, data),
}

export default sellerOrderService
