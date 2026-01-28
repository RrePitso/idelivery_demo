
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../App';

const Navbar: React.FC = () => {
  const { state, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/drivers');
  };

  return (
    <nav className="bg-white border-b border-gray-100 px-4 py-3 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <Link to="/drivers" className="flex items-center space-x-2">
          <div className="flex items-center">
            {/* Custom SVG reflecting the iDelivery logo style */}
            <svg className="w-8 h-8 mr-1" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M50 5C25.1 5 5 25.1 5 50C5 74.9 25.1 95 50 95C74.9 95 95 74.9 95 50C95 25.1 74.9 5 50 5ZM50 85C30.7 85 15 69.3 15 50C15 30.7 30.7 15 50 15C69.3 15 85 30.7 85 50C85 69.3 69.3 85 50 85Z" fill="#50B848"/>
              <path d="M50 25C36.2 25 25 36.2 25 50C25 63.8 36.2 75 50 75C63.8 75 75 63.8 75 50C75 36.2 63.8 25 50 25ZM50 65C41.7 65 35 58.3 35 50C35 41.7 41.7 35 50 35C58.3 35 65 41.7 65 50C65 58.3 58.3 65 50 65Z" fill="#F58220"/>
            </svg>
            <div className="flex flex-col -space-y-1">
              <span className="font-black text-2xl italic">
                <span className="text-[#50B848]">i</span>
                <span className="text-[#F58220]">Delivery</span>
              </span>
              <span className="text-[10px] text-gray-500 font-bold tracking-tight uppercase">Alice, Eastern Cape</span>
            </div>
          </div>
        </Link>

        <div className="flex items-center space-x-4 text-sm font-medium">
          {!state.user ? (
            <>
              <Link to="/drivers/signup" className="text-gray-600 hover:text-[#F58220] transition-colors">Become a Driver</Link>
            </>
          ) : (
            <>
              <Link to="/drivers/dashboard" className="text-gray-600 hover:text-[#F58220] transition-colors">Dashboard</Link>
              <button 
                onClick={handleSignOut}
                className="bg-gray-100 text-gray-700 px-3 py-1.5 rounded-md hover:bg-gray-200 transition-colors"
              >
                Sign Out
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
