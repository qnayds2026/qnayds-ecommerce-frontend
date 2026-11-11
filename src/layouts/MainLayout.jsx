import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { Outlet } from 'react-router-dom'

function MainLayout() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 bg-[#F0F0F8] pb-10">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}

export default MainLayout