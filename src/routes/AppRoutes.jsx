import { BrowserRouter, Routes, Route } from 'react-router-dom'

import MainLayout from '../layouts/MainLayout'
import ProtectedRoute from '../components/ProtectedRoute'
import Home from '../pages/Home'
import Login from '../pages/Login'
import Register from '../pages/Register'
import Wishlist from '../pages/Wishlist'
import Cart from '../pages/Cart'
import ProductDetails from '../pages/ProductDetails'
import Products from '../pages/Products'
import Categories from '../pages/Categories'
import Checkout from '../pages/Checkout'
import Orders from '../pages/Orders'
import Addresses from '../pages/Addresses'
import OrderDetails from '../pages/OrderDetails'
import CustomerProfile from '../pages/CustomerProfile'


function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<MainLayout />}>
          {/* Public pages */}
          <Route path="/" element={<Home />} />
          <Route path="/product/:id" element={<ProductDetails />} />
          <Route path="/products" element={<Products />} />
                    <Route path="/categories" element={<Categories />} />


          {/* Customer-only pages (login + CUSTOMER role needed) */}
          <Route element={<ProtectedRoute allowedRoles={['CUSTOMER']} />}>
            <Route path="/wishlist" element={<Wishlist />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/orders/:orderId" element={<OrderDetails />} />
            <Route path="/addresses" element={<Addresses />} />
            <Route path="/customer" element={<CustomerProfile />} />
          </Route>
        </Route>

        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Routes>
    </BrowserRouter>
  )
}

export default AppRoutes