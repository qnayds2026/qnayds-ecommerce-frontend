import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { apiRequest } from '../services/api'

// Load the cart from the backend
export const fetchCart = createAsyncThunk(
  'cart/fetchCart',
  async (_, { rejectWithValue }) => {
    try {
      const res = await apiRequest('/cart')
      return res?.data ?? null
    } catch (err) {
      return rejectWithValue(err.message || 'Unable to load cart')
    }
  }
)

// Add an item, then refresh the cart so every component updates
export const addToCart = createAsyncThunk(
  'cart/addToCart',
  async ({ variantId, quantity = 1 }, { dispatch, rejectWithValue }) => {
    try {
      await apiRequest('/cart/items', {
        method: 'POST',
        body: JSON.stringify({ variantId, quantity }),
      })
      await dispatch(fetchCart())
    } catch (err) {
      return rejectWithValue(err.message || 'Could not add to cart')
    }
  }
)

// Change quantity of a cart item (backend returns the updated cart)
export const updateCartItem = createAsyncThunk(
  'cart/updateCartItem',
  async ({ itemId, quantity }, { rejectWithValue }) => {
    try {
      const res = await apiRequest(`/cart/items/${itemId}`, {
        method: 'PATCH',
        body: JSON.stringify({ quantity }),
      })
      return res.data
    } catch (err) {
      return rejectWithValue(err.message || 'Could not update quantity')
    }
  }
)

// Remove an item, then refresh the cart
export const removeCartItem = createAsyncThunk(
  'cart/removeCartItem',
  async (itemId, { dispatch, rejectWithValue }) => {
    try {
      await apiRequest(`/cart/items/${itemId}`, { method: 'DELETE' })
      await dispatch(fetchCart())
    } catch (err) {
      return rejectWithValue(err.message || 'Could not remove item')
    }
  }
)

const cartSlice = createSlice({
  name: 'cart',
  initialState: { data: null, loading: false, error: '' },
  reducers: {
    // Call on logout
    clearCart(state) {
      state.data = null
      state.error = ''
      state.loading = false
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCart.pending, (state) => {
        state.loading = true
        state.error = ''
      })
      .addCase(fetchCart.fulfilled, (state, action) => {
        state.loading = false
        state.data = action.payload
      })
      .addCase(fetchCart.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload || 'Unable to load cart'
      })
      .addCase(updateCartItem.fulfilled, (state, action) => {
        state.data = action.payload
      })
  },
})

export const { clearCart } = cartSlice.actions
export default cartSlice.reducer