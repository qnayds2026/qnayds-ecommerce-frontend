import { BrowserRouter, Routes, Route } from 'react-router-dom'

// Layouts
import MainLayout  from '../layouts/MainLayout'
import SellerLayout from '../layouts/SellerLayout'
import AdminLayout from '../layouts/AdminLayout'

// Guards
import ProtectedRoute from '../components/ProtectedRoute'

// Public / Customer pages
import Home            from '../pages/Home'
import Login           from '../pages/Login'
import Register        from '../pages/Register'
import Wishlist        from '../pages/Wishlist'
import Cart            from '../pages/Cart'
import ProductDetails  from '../pages/ProductDetails'
import Products        from '../pages/Products'
import Categories      from '../pages/Categories'
import Checkout        from '../pages/Checkout'
import Orders          from '../pages/Orders'
import Addresses       from '../pages/Addresses'
import OrderDetails    from '../pages/OrderDetails'
import CustomerProfile from '../pages/CustomerProfile'
import BecomeSeller    from '../pages/BecomeSeller'
import NotificationsPage from '../pages/NotificationsPage'

// Admin pages
import AdminDashboard  from '../pages/AdminDashboard'
import AdminSellers    from '../pages/AdminSellers'
import AdminUsers      from '../pages/AdminUsers'
import AdminProducts   from '../pages/AdminProducts'
import AdminOrders     from '../pages/AdminOrders'
import AdminCategories from '../pages/AdminCategories'
import AdminInventory  from '../pages/AdminInventory'
import AdminReports    from '../pages/AdminReports'
import AdminComingSoon from '../pages/AdminComingSoon'

// Seller dashboard pages
import SellerDashboardHome from '../pages/seller/SellerDashboardHome'
import SellerProfile       from '../pages/seller/SellerProfile'
import SellerProducts      from '../pages/seller/SellerProducts'
import SellerAddProduct    from '../pages/seller/SellerAddProduct'
import SellerOrders        from '../pages/seller/SellerOrders'
import SellerOrderDetails  from '../pages/seller/SellerOrderDetails'
import SellerReturns       from '../pages/seller/SellerReturns'
import SellerInventory     from '../pages/seller/SellerInventory'
import SellerShipments     from '../pages/seller/SellerShipments'

function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>

        {/* ── Public & Customer pages (Navbar + Footer) ── */}
        <Route element={<MainLayout />}>
          <Route path="/"             element={<Home />} />
          <Route path="/product/:id" element={<ProductDetails />} />
          <Route path="/products"    element={<Products />} />
          <Route path="/categories"  element={<Categories />} />

          {/* Customer-only */}
          <Route element={<ProtectedRoute allowedRoles={['CUSTOMER']} />}>
            <Route path="/wishlist"        element={<Wishlist />} />
            <Route path="/cart"            element={<Cart />} />
            <Route path="/checkout"        element={<Checkout />} />
            <Route path="/orders"          element={<Orders />} />
            <Route path="/orders/:orderId" element={<OrderDetails />} />
            <Route path="/addresses"       element={<Addresses />} />
            <Route path="/customer"        element={<CustomerProfile />} />
            <Route path="/notifications" element={<NotificationsPage />} />
            <Route path="/become-seller" element={<BecomeSeller />} />
            
          </Route>
        </Route>

        {/* ── Admin pages ── */}
        <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
          <Route element={<AdminLayout />}>
            <Route path="/admin"              element={<AdminDashboard />} />
            <Route path="/admin/sellers"      element={<AdminSellers />} />
            <Route path="/admin/users"        element={<AdminUsers />} />
            <Route path="/admin/products"     element={<AdminProducts />} />
            <Route path="/admin/orders"       element={<AdminOrders />} />
            <Route path="/admin/categories"   element={<AdminCategories />} />
            <Route path="/admin/inventory"    element={<AdminInventory />} />
            <Route path="/admin/reports"      element={<AdminReports />} />
            <Route path="/admin/settings"     element={<AdminComingSoon title="Settings" />} />
          </Route>
        </Route>

        {/* ── Seller Dashboard (sidebar layout, no Navbar/Footer) ── */}
        <Route element={<ProtectedRoute allowedRoles={['SELLER']} />}>
          <Route element={<SellerLayout />}>
            <Route path="/seller"                   element={<SellerDashboardHome />} />
            <Route path="/seller/profile"           element={<SellerProfile />} />
            <Route path="/seller/products"          element={<SellerProducts />} />
            <Route path="/seller/products/new"      element={<SellerAddProduct />} />
            <Route path="/seller/products/:id/edit" element={<SellerAddProduct />} />
            <Route path="/seller/orders"            element={<SellerOrders />} />
            <Route path="/seller/orders/:orderId"   element={<SellerOrderDetails />} />
            <Route path="/seller/returns"           element={<SellerReturns />} />
            <Route path="/seller/shipments"         element={<SellerShipments />} />
            <Route path="/seller/inventory"         element={<SellerInventory />} />
          </Route>
        </Route>

        {/* ── Auth pages ── */}
        <Route path="/login"    element={<Login />} />
        <Route path="/register" element={<Register />} />

      </Routes>
    </BrowserRouter>
  )
}

export default AppRoutes
