const SELLER_ENDPOINTS = {

  LOGOUT: '/auth/logout',

  CREATE_PROFILE:  '/sellers',
  GET_MY_PROFILE:  '/sellers/me',

  MY_PRODUCTS:     '/products/mine',
  PRODUCTS:        '/products',
  PRODUCT:         (id)        => `/products/${id}`,

  ADD_VARIANT:     (productId) => `/products/${productId}/variants`,
  UPDATE_VARIANT:  (id)        => `/variants/${id}`,

  UPDATE_INVENTORY:(variantId) => `/variants/${variantId}/inventory`,

  ADD_IMAGE:       (productId) => `/products/${productId}/images`,
  UPDATE_IMAGE:    (id)        => `/images/${id}`,
  DELETE_IMAGE:    (id)        => `/images/${id}`,

  SELLER_ORDERS:         '/seller/orders',
  SELLER_ORDER:          (id) => `/seller/orders/${id}`,
  UPDATE_ORDER_STATUS:   (id) => `/seller/orders/${id}/status`,
  CREATE_ORDER_SHIPMENT: (id) => `/seller/orders/${id}/shipment`,

  SELLER_SHIPMENTS:        '/seller/shipments',
  SELLER_SHIPMENT:         (id) => `/seller/shipments/${id}`,
  UPDATE_SHIPMENT_STATUS:  (id) => `/seller/shipments/${id}/status`,

  SELLER_RETURNS:          '/seller/returns',
  APPROVE_RETURN:          (id) => `/seller/returns/${id}/approve`,
  REJECT_RETURN:           (id) => `/seller/returns/${id}/reject`,
  MARK_RETURN_RECEIVED:    (id) => `/seller/returns/${id}/received`,

  CATEGORIES: '/categories',
}

export default SELLER_ENDPOINTS
