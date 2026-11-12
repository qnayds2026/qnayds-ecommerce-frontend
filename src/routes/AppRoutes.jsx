import { BrowserRouter, Routes, Route } from 'react-router-dom'

// Layouts
import MainLayout   from '../layouts/MainLayout'
import SellerLayout from '../layouts/SellerLayout'

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

// Seller dashboard pages
import SellerDashboardHome  from '../pages/seller/SellerDashboardHome'
import SellerProfile        from '../pages/seller/SellerProfile'
import SellerProducts       from '../pages/seller/SellerProducts'
import SellerAddProduct     from '../pages/seller/SellerAddProduct'
import SellerOrders         from '../pages/seller/SellerOrders'
import SellerOrderDetails   from '../pages/seller/SellerOrderDetails'
import SellerReturns        from '../pages/seller/SellerReturns'
import SellerInventory      from '../pages/seller/SellerInventory'
import SellerShipments      from '../pages/seller/SellerShipments'

function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>

        {/* ── Public & Customer pages (Navbar + Footer) ── */}
        <Route element={<MainLayout />}>
          <Route path="/"              element={<Home />} />
          <Route path="/product/:id"  element={<ProductDetails />} />
          <Route path="/products"     element={<Products />} />
          <Route path="/categories"   element={<Categories />} />
          <Route path="/become-seller" element={<BecomeSeller />} />

          {/* Customer-only */}
          <Route element={<ProtectedRoute allowedRoles={['CUSTOMER']} />}>
            <Route path="/wishlist"          element={<Wishlist />} />
            <Route path="/cart"              element={<Cart />} />
            <Route path="/checkout"          element={<Checkout />} />
            <Route path="/orders"            element={<Orders />} />
            <Route path="/orders/:orderId"   element={<OrderDetails />} />
            <Route path="/addresses"         element={<Addresses />} />
            <Route path="/customer"          element={<CustomerProfile />} />
          </Route>
        </Route>

        {/* ── Seller Dashboard (sidebar layout, no Navbar/Footer) ── */}
        <Route element={<ProtectedRoute allowedRoles={['SELLER']} />}>
          <Route element={<SellerLayout />}>
            <Route path="/seller"                          element={<SellerDashboardHome />} />
            <Route path="/seller/profile"                  element={<SellerProfile />} />
            <Route path="/seller/products"                 element={<SellerProducts />} />
            <Route path="/seller/products/new"             element={<SellerAddProduct />} />
            <Route path="/seller/products/:id/edit"        element={<SellerAddProduct />} />
            <Route path="/seller/orders"                   element={<SellerOrders />} />
            <Route path="/seller/orders/:orderId"          element={<SellerOrderDetails />} />
            <Route path="/seller/returns"                  element={<SellerReturns />} />
            <Route path="/seller/shipments"                element={<SellerShipments />} />
            <Route path="/seller/inventory"                element={<SellerInventory />} />
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
