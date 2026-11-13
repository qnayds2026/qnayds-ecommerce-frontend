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
import BecomeSeller from '../pages/BecomeSeller'
import AdminLayout from '../layouts/AdminLayout'
import AdminDashboard from '../pages/AdminDashboard'
import AdminSellers from '../pages/AdminSellers'
import AdminProducts from '../pages/AdminProducts'
import AdminOrders from '../pages/AdminOrders'
import AdminCategories from '../pages/AdminCategories'
import AdminInventory from '../pages/AdminInventory'
import AdminUsers from '../pages/AdminUsers'
import AdminReports from '../pages/AdminReports'
import AdminComingSoon from '../pages/AdminComingSoon'


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
            <Route path="/become-seller" element={<BecomeSeller />} />
            
          </Route>
        </Route>

       {/* Admin-only pages (login + ADMIN role needed) */}
        <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
          <Route element={<AdminLayout />}>
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/sellers" element={<AdminSellers />} />
            <Route path="/admin/users" element={<AdminUsers />} />
            <Route path="/admin/products" element={<AdminProducts />} />
            <Route path="/admin/orders" element={<AdminOrders />} />
            <Route path="/admin/categories" element={<AdminCategories />} />
            <Route path="/admin/inventory" element={<AdminInventory />} />
            <Route path="/admin/reports" element={<AdminReports />} />
            <Route path="/admin/settings" element={<AdminComingSoon title="Settings" />} />
          </Route>
        </Route>

        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Routes>
    </BrowserRouter>
  )
}

export default AppRoutes