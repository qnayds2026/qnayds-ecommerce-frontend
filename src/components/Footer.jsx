// File: src/components/Footer.jsx
import { Link } from 'react-router-dom'

function Footer() {
  return (
    <footer className="bg-[#101A30] text-white">
      <div className="max-w-7xl mx-auto px-6 py-12 grid grid-cols-1 md:grid-cols-4 gap-8">

        <div>
          <h2 className="text-2xl font-bold text-[#2878C8]">
            Qnayds
          </h2>
          <p className="text-[#B8C4D9] mt-3">
            Your trusted online shopping destination.
          </p>
        </div>

        <div>
          <h3 className="font-semibold mb-4">Quick Links</h3>
                    <Link to="/" className="block text-[#B8C4D9] mb-2 hover:text-white transition">Home</Link>
          <Link to="/products" className="block text-[#B8C4D9] mb-2 hover:text-white transition">Products</Link>
          <Link to="/categories" className="block text-[#B8C4D9] mb-2 hover:text-white transition">Categories</Link>
        </div>

        <div>
          <h3 className="font-semibold mb-4">Customer Support</h3>
          <p className="text-[#B8C4D9] mb-2 cursor-pointer hover:text-white transition">Contact Us</p>
          <p className="text-[#B8C4D9] mb-2 cursor-pointer hover:text-white transition">Help Center</p>
          <p className="text-[#B8C4D9] mb-2 cursor-pointer hover:text-white transition">FAQs</p>
        </div>

        <div>
          <h3 className="font-semibold mb-4">Information</h3>
          <p className="text-[#B8C4D9] mb-2 cursor-pointer hover:text-white transition">About Us</p>
          <p className="text-[#B8C4D9] mb-2 cursor-pointer hover:text-white transition">Privacy Policy</p>
          <p className="text-[#B8C4D9] mb-2 cursor-pointer hover:text-white transition">Terms &amp; Conditions</p>
        </div>

      </div>

      <div className="border-t border-[#2878C8]/40 text-center py-5 text-[#B8C4D9]">
        © {new Date().getFullYear()} Qnayds. All rights reserved.
      </div>
    </footer>
  )
}

export default Footer