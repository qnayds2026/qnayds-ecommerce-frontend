/**
 * Seller Shipment Service
 *
 * GET    /seller/shipments                          → list all shipments
 * GET    /seller/shipments/:shipmentId              → get single shipment
 * PATCH  /seller/shipments/:shipmentId/status       → update shipment status
 */
import sellerAxios from './axiosInstance'

const sellerShipmentService = {
  /**
   * List all shipments for the authenticated seller
   * @returns {Promise<Shipment[]>}
   */
  listShipments: () =>
    sellerAxios.get('/seller/shipments'),

  /**
   * Get a single shipment by ID
   * @param {string} shipmentId
   * @returns {Promise<Shipment>}
   */
  getShipment: (shipmentId) =>
    sellerAxios.get(`/seller/shipments/${shipmentId}`),

  /**
   * Update the status of a shipment
   * Valid transitions:
   *   READY_TO_SHIP → PACKED → SHIPPED → IN_TRANSIT → OUT_FOR_DELIVERY → DELIVERED
   *   Any stage can go to DELIVERY_FAILED or RETURN_TO_ORIGIN
   * @param {string} shipmentId
   * @param {{ status: string, description?: string }} data
   * @returns {Promise<Shipment>}
   */
  updateStatus: (shipmentId, data) =>
    sellerAxios.patch(`/seller/shipments/${shipmentId}/status`, data),
}

export default sellerShipmentService
