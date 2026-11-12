/**
 * Seller Return Service
 *
 * GET    /seller/returns                        → list return requests
 * PATCH  /seller/returns/:returnId/approve      → approve a return
 * PATCH  /seller/returns/:returnId/reject       → reject a return (note required)
 * PATCH  /seller/returns/:returnId/received     → mark item as received
 */
import sellerAxios from './axiosInstance'

const sellerReturnService = {
  /**
   * List all return requests for the authenticated seller's orders
   * @param {{ page?: number, limit?: number, status?: string }} params
   * @returns {Promise<{ items: ReturnRequest[], total: number, page: number, limit: number }>}
   */
  listReturns: ({ page = 1, limit = 10, status } = {}) =>
    sellerAxios.get('/seller/returns', {
      params: { page, limit, ...(status ? { status } : {}) },
    }),

  /**
   * Approve a return request
   * @param {string} returnId
   * @param {{ note?: string }} data
   * @returns {Promise<ReturnRequest>}
   */
  approveReturn: (returnId, data = {}) =>
    sellerAxios.patch(`/seller/returns/${returnId}/approve`, data),

  /**
   * Reject a return request (note is required by backend policy)
   * @param {string} returnId
   * @param {{ note: string }} data
   * @returns {Promise<ReturnRequest>}
   */
  rejectReturn: (returnId, data) =>
    sellerAxios.patch(`/seller/returns/${returnId}/reject`, data),

  /**
   * Mark a returned item as physically received
   * @param {string} returnId
   * @param {{ note?: string }} data
   * @returns {Promise<ReturnRequest>}
   */
  markReceived: (returnId, data = {}) =>
    sellerAxios.patch(`/seller/returns/${returnId}/received`, data),
}

export default sellerReturnService
