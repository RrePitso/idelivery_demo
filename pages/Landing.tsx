
import React from 'react';
// Fix: Use namespaced import to resolve 'no exported member' for Link
import * as Router from 'react-router-dom';

const Landing: React.FC = () => {
  return (
    <div className="relative bg-white min-h-[calc(100vh-64px)] flex flex-col">
      {/* Hero Section */}
      <div className="flex-1 flex flex-col lg:flex-row">
        <div className="relative z-10 flex-1 flex flex-col justify-center px-4 sm:px-6 lg:px-12 py-12 lg:py-0">
          <div className="max-w-xl mx-auto lg:mx-0">
            <div className="mb-6 inline-flex items-center px-3 py-1 rounded-full bg-green-50 text-[#50B848] text-[10px] font-black uppercase tracking-widest border border-green-100">
              <span className="w-2 h-2 rounded-full bg-[#50B848] animate-pulse mr-2"></span>
              Fastest Delivery in Alice
            </div>
            <h1 className="text-5xl sm:text-7xl font-black text-gray-900 leading-none tracking-tighter italic mb-6">
              Move <span className="text-[#F58220]">Anything</span><br />
              Anywhere.
            </h1>
            <p className="text-lg text-gray-500 font-medium mb-10 max-w-lg leading-relaxed">
              From KFC cravings to residence essentials, iDelivery connects Alice residents with verified local drivers in minutes.
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Router.Link
                to="/customer/auth"
                className="group relative flex flex-col p-6 bg-white border-2 border-gray-100 rounded-[2rem] hover:border-[#F58220] transition-all overflow-hidden"
              >
                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                  <svg className="w-24 h-24" fill="currentColor" viewBox="0 0 24 24"><path d="M11 9H9V2H7V9H5V2H3V9c0 2.12 1.66 3.84 3.75 3.97V22h2.5v-9.03C11.34 12.84 13 11.12 13 9V2h-2v7zm5-3v8h2.5v8H21V2c-2.76 0-5 2.24-5 4z"/></svg>
                </div>
                <span className="text-[10px] font-black text-[#F58220] uppercase tracking-widest mb-2">For Customers</span>
                <span className="text-xl font-black text-gray-900 italic">Order Delivery</span>
                <span className="mt-2 text-xs text-gray-400 font-medium">Food, Docs, Packages</span>
              </Router.Link>

              <Router.Link
                to="/drivers/signup"
                className="group relative flex flex-col p-6 bg-white border-2 border-gray-100 rounded-[2rem] hover:border-[#50B848] transition-all overflow-hidden"
              >
                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                  <svg className="w-24 h-24" fill="currentColor" viewBox="0 0 24 24"><path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z"/></svg>
                </div>
                <span className="text-[10px] font-black text-[#50B848] uppercase tracking-widest mb-2">For Drivers</span>
                <span className="text-xl font-black text-gray-900 italic">Earn Daily</span>
                <span className="mt-2 text-xs text-gray-400 font-medium">Bicycle, Motorbike, Car</span>
              </Router.Link>
            </div>
          </div>
        </div>

        {/* Hero Image Section */}
        <div className="flex-1 relative h-64 lg:h-auto">
          <div className="absolute inset-0 bg-gradient-to-r from-white via-transparent to-transparent z-10 hidden lg:block"></div>
          <img
            className="h-full w-full object-cover lg:rounded-l-[4rem]"
            src="https://images.unsplash.com/photo-1526367790999-0150786486a9?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80"
            alt="Delivery logistics"
          />
        </div>
      </div>
      
      {/* Social Proof */}
      <div className="bg-gray-50 py-12 px-4">
        <div className="max-w-7xl mx-auto flex flex-wrap justify-around gap-8">
           <div className="flex items-center space-x-3 grayscale opacity-60">
              <span className="font-black text-xl italic text-gray-400 tracking-tighter uppercase">Fort Hare Uni</span>
           </div>
           <div className="flex items-center space-x-3 grayscale opacity-60">
              <span className="font-black text-xl italic text-gray-400 tracking-tighter uppercase">Alice Local</span>
           </div>
           <div className="flex items-center space-x-3 grayscale opacity-60">
              <span className="font-black text-xl italic text-gray-400 tracking-tighter uppercase">Student Hub</span>
           </div>
        </div>
      </div>
    </div>
  );
};

export default Landing;
