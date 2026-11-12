import sellerAxiosInstance from '../axios/axiosInstance'
import SELLER_ENDPOINTS    from '../axios/apiEndpoints'

const sellerService = {

  // AUTH
  logout: () =>
    sellerAxiosInstance.post(SELLER_ENDPOINTS.LOGOUT),

  // SELLER PROFILE
  getMyProfile: () =>
    sellerAxiosInstance.get(SELLER_ENDPOINTS.GET_MY_PROFILE),

  createProfile: (payload) =>
    sellerAxiosInstance.post(SELLER_ENDPOINTS.CREATE_PROFILE, payload),

  // PRODUCTS
  listMyProducts: () =>
    sellerAxiosInstance.get(SELLER_ENDPOINTS.MY_PRODUCTS),

  createProduct: (payload) =>
    sellerAxiosInstance.post(SELLER_ENDPOINTS.PRODUCTS, payload),

  updateProduct: (id, payload) =>
    sellerAxiosInstance.patch(SELLER_ENDPOINTS.PRODUCT(id), payload),

  archiveProduct: (id) =>
    sellerAxiosInstance.delete(SELLER_ENDPOINTS.PRODUCT(id)),

  // VARIANTS
  addVariant: (productId, payload) =>
    sellerAxiosInstance.post(SELLER_ENDPOINTS.ADD_VARIANT(productId), payload),

  updateVariant: (variantId, payload) =>
    sellerAxiosInstance.patch(SELLER_ENDPOINTS.UPDATE_VARIANT(variantId), payload),

  // INVENTORY
  updateInventory: (variantId, payload) =>
    sellerAxiosInstance.patch(SELLER_ENDPOINTS.UPDATE_INVENTORY(variantId), payload),

  // IMAGES
  addImage: (productId, payload) =>
    sellerAxiosInstance.post(SELLER_ENDPOINTS.ADD_IMAGE(productId), payload),

  updateImage: (imageId, payload) =>
    sellerAxiosInstance.patch(SELLER_ENDPOINTS.UPDATE_IMAGE(imageId), payload),

  deleteImage: (imageId) =>
    sellerAxiosInstance.delete(SELLER_ENDPOINTS.DELETE_IMAGE(imageId)),

  // ORDERS
  listOrders: ({ page = 1, limit = 10, status } = {}) =>
    sellerAxiosInstance.get(SELLER_ENDPOINTS.SELLER_ORDERS, {
      params: { page, limit, ...(status ? { status } : {}) },
    }),

  getOrder: (orderId) =>
    sellerAxiosInstance.get(SELLER_ENDPOINTS.SELLER_ORDER(orderId)),

  updateOrderStatus: (orderId, payload) =>
    sellerAxiosInstance.patch(SELLER_ENDPOINTS.UPDATE_ORDER_STATUS(orderId), payload),

  createOrderShipment: (orderId, payload) =>
    sellerAxiosInstance.post(SELLER_ENDPOINTS.CREATE_ORDER_SHIPMENT(orderId), payload),

  // SHIPMENTS
  listShipments: () =>
    sellerAxiosInstance.get(SELLER_ENDPOINTS.SELLER_SHIPMENTS),

  getShipment: (shipmentId) =>
    sellerAxiosInstance.get(SELLER_ENDPOINTS.SELLER_SHIPMENT(shipmentId)),

  updateShipmentStatus: (shipmentId, payload) =>
    sellerAxiosInstance.patch(SELLER_ENDPOINTS.UPDATE_SHIPMENT_STATUS(shipmentId), payload),

  // RETURNS
  listReturns: ({ page = 1, limit = 10, status } = {}) =>
    sellerAxiosInstance.get(SELLER_ENDPOINTS.SELLER_RETURNS, {
      params: { page, limit, ...(status ? { status } : {}) },
    }),

  approveReturn: (returnId, payload = {}) =>
    sellerAxiosInstance.patch(SELLER_ENDPOINTS.APPROVE_RETURN(returnId), payload),

  rejectReturn: (returnId, payload) =>
    sellerAxiosInstance.patch(SELLER_ENDPOINTS.REJECT_RETURN(returnId), payload),

  markReturnReceived: (returnId, payload = {}) =>
    sellerAxiosInstance.patch(SELLER_ENDPOINTS.MARK_RETURN_RECEIVED(returnId), payload),

  // CATEGORIES
  getCategories: () =>
    sellerAxiosInstance.get(SELLER_ENDPOINTS.CATEGORIES),
}

export default sellerService
