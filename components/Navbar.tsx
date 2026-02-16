
import React from 'react';
// Fix: Access Link and useNavigate via namespaced import
import * as Router from 'react-router-dom';
import { useAuth } from '../App';

const Navbar: React.FC = () => {
  const { state, signOut } = useAuth();
  const navigate = Router.useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const getDashboardLink = () => {
    if (state.userType === 'driver') return '/drivers/dashboard';
    if (state.userType === 'customer') return '/customer/dashboard';
    if (state.userType === 'admin') return '/admin/dashboard';
    return '/';
  };

  return (
    <nav className="bg-white border-b border-gray-100 px-4 py-3 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <Router.Link to="/" className="flex items-center space-x-2 transition-transform active:scale-95">
          <div className="flex items-center">
            <svg className="w-8 h-8 mr-1" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M50 5C25.1 5 5 25.1 5 50C5 74.9 25.1 95 50 95C74.9 95 95 74.9 95 50C95 25.1 74.9 5 50 5ZM50 85C30.7 85 15 69.3 15 50C15 30.7 30.7 15 50 15C69.3 15 85 30.7 85 50C85 69.3 69.3 85 50 85Z" fill="#50B848"/>
              <path d="M50 25C36.2 25 25 36.2 25 50C25 63.8 36.2 75 50 75C63.8 75 75 63.8 75 50C75 36.2 63.8 25 50 25ZM50 65C41.7 65 35 58.3 35 50C35 41.7 41.7 35 50 35C58.3 35 65 41.7 65 50C65 58.3 58.3 65 50 65Z" fill="#F58220"/>
            </svg>
            <div className="flex flex-col -space-y-1">
              <span className="font-black text-2xl italic">
                <span className="text-[#50B848]">i</span>
                <span className="text-[#F58220]">Delivery</span>
              </span>
              <span className="text-[10px] text-gray-500 font-bold tracking-tight uppercase">
                {state.userType === 'driver' ? 'Driver Portal' : state.userType === 'admin' ? 'Admin Center' : 'Alice, EC'}
              </span>
            </div>
          </div>
        </Router.Link>

        <div className="flex items-center space-x-4 text-xs font-black uppercase tracking-widest">
          {!state.user ? (
            <>
              <Router.Link to="/customer/auth" className="text-gray-600 hover:text-[#F58220] transition-colors">Sign In</Router.Link>
              <Router.Link to="/drivers/signup" className="hidden sm:block bg-gray-50 text-gray-400 px-4 py-2 rounded-full border border-gray-100 hover:border-[#50B848] transition-all">Become a Driver</Router.Link>
              <Router.Link to="/customer/auth" className="bg-[#F58220] text-white px-4 py-2 rounded-full hover:brightness-110 transition-all shadow-lg shadow-orange-100 italic">Order Now</Router.Link>
            </>
          ) : (
            <>
              <Router.Link to={getDashboardLink()} className="text-gray-600 hover:text-[#F58220] transition-colors">Dashboard</Router.Link>
              <button 
                onClick={handleSignOut}
                className="bg-gray-100 text-gray-700 px-4 py-2 rounded-full hover:bg-gray-200 transition-colors"
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
