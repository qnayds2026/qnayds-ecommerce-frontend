import axios from 'axios'
import { attachRequestInterceptors } from './requestInterceptor'
import { attachResponseInterceptors } from './responseInterceptor'

/**
 * Seller Axios Instance
 *
 * A dedicated axios instance for the seller dashboard.
 * All seller API calls must use this instance — never the global fetch-based api.js.
 * Other developer teams manage their own axios instances / fetch wrappers.
 */
const sellerAxiosInstance = axios.create({
  baseURL:         import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1',
  withCredentials: true,          // send HttpOnly refresh-token cookie with every request
  timeout:         15000,         // 15s timeout
  headers: {
    'Content-Type': 'application/json',
    'Accept':       'application/json',
  },
})

// Attach request & response interceptors
attachRequestInterceptors(sellerAxiosInstance)
attachResponseInterceptors(sellerAxiosInstance)

export default sellerAxiosInstance
