/**
 * Seller Profile Service
 *
 * POST   /sellers           → register as seller
 * GET    /sellers/me        → get my seller profile
 */
import sellerAxios from './axiosInstance'

const sellerProfileService = {
  /**
   * Create a new seller profile
   * @param {{ shopName: string, description?: string }} data
   * @returns {Promise<{ id, userId, shopName, description, status, createdAt, updatedAt }>}
   */
  createProfile: (data) =>
    sellerAxios.post('/sellers', data),

  /**
   * Fetch authenticated seller's own profile
   * @returns {Promise<{ id, userId, shopName, description, status, createdAt, updatedAt }>}
   */
  getMyProfile: () =>
    sellerAxios.get('/sellers/me'),
}

export default sellerProfileService
