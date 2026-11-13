/**
 * Seller Product Service
 *
 * GET    /products/mine                     → list all my products
 * POST   /products                          → create product
 * PATCH  /products/:id                      → update product
 * DELETE /products/:id                      → archive product
 *
 * POST   /products/:productId/variants      → add variant
 * PATCH  /variants/:id                      → update variant
 * PATCH  /variants/:id/inventory            → update inventory
 *
 * POST   /products/:productId/images        → add image
 * PATCH  /images/:id                        → update image
 * DELETE /images/:id                        → delete image
 */
import sellerAxios from './axiosInstance'

const sellerProductService = {
  // ── Products ──────────────────────────────────────────────

  /**
   * List all products owned by the authenticated seller
   * @returns {Promise<Product[]>}
   */
  listMyProducts: () =>
    sellerAxios.get('/products/mine'),

  /**
   * Create a new product (starts as DRAFT)
   * @param {{ categoryId: string, name: string, slug?: string, description?: string, brand?: string }} data
   * @returns {Promise<Product>}
   */
  createProduct: (data) =>
    sellerAxios.post('/products', data),

  /**
   * Update an existing product
   * @param {string} id
   * @param {{ categoryId?: string, name?: string, slug?: string, description?: string, brand?: string }} data
   * @returns {Promise<Product>}
   */
  updateProduct: (id, data) =>
    sellerAxios.patch(`/products/${id}`, data),

  /**
   * Archive (soft-delete) a product
   * @param {string} id
   * @returns {Promise<Product>}
   */
  archiveProduct: (id) =>
    sellerAxios.delete(`/products/${id}`),

  // ── Variants ──────────────────────────────────────────────

  /**
   * Add a variant to a product
   * @param {string} productId
   * @param {{ sku: string, price: string, name?: string, compareAtPrice?: string, attributes?: object, initialStock?: number }} data
   * @returns {Promise<ProductVariant>}
   */
  addVariant: (productId, data) =>
    sellerAxios.post(`/products/${productId}/variants`, data),

  /**
   * Update an existing variant
   * @param {string} variantId
   * @param {{ name?: string, price?: string, compareAtPrice?: string|null, attributes?: object, isActive?: boolean }} data
   * @returns {Promise<ProductVariant>}
   */
  updateVariant: (variantId, data) =>
    sellerAxios.patch(`/variants/${variantId}`, data),

  /**
   * Update inventory for a variant
   * @param {string} variantId
   * @param {{ delta: number } | { available: number }} data
   * @returns {Promise<Inventory>}
   */
  updateInventory: (variantId, data) =>
    sellerAxios.patch(`/variants/${variantId}/inventory`, data),

  // ── Images ────────────────────────────────────────────────

  /**
   * Add an image to a product
   * @param {string} productId
   * @param {{ url: string, altText?: string, sortOrder?: number }} data
   * @returns {Promise<ProductImage>}
   */
  addImage: (productId, data) =>
    sellerAxios.post(`/products/${productId}/images`, data),

  /**
   * Update an image's alt text or sort order
   * @param {string} imageId
   * @param {{ altText?: string, sortOrder?: number }} data
   * @returns {Promise<ProductImage>}
   */
  updateImage: (imageId, data) =>
    sellerAxios.patch(`/images/${imageId}`, data),

  /**
   * Delete a product image
   * @param {string} imageId
   * @returns {Promise<void>}
   */
  deleteImage: (imageId) =>
    sellerAxios.delete(`/images/${imageId}`),
}

export default sellerProductService
