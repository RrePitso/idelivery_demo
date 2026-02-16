
import React from 'react';
// Fix: Use namespaced import for Link
import * as Router from 'react-router-dom';

const Confirmation: React.FC = () => {
  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="mx-auto flex items-center justify-center h-24 w-24 rounded-full bg-green-50 mb-6 border-4 border-[#50B848]">
          <svg className="h-12 w-12 text-[#50B848]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-3xl font-black text-gray-900 mb-2 italic">
          <span className="text-[#50B848]">i</span><span className="text-[#F58220]">Delivery</span> Ready!
        </h2>
        <p className="text-lg text-gray-600 mb-8">
          Welcome to the family. You're all set to start delivering in Alice. Hop on your dashboard and go online to see requests.
        </p>
        <div className="space-y-4">
          <Router.Link
            to="/drivers/dashboard"
            className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-bold rounded-md text-white bg-[#F58220] hover:bg-orange-600 md:py-4 md:text-lg transition-colors shadow-lg shadow-orange-100"
          >
            Go to Dashboard
          </Router.Link>
          <Router.Link
            to="/drivers"
            className="block text-sm font-medium text-gray-500 hover:text-[#50B848]"
          >
            Back to Home
          </Router.Link>
        </div>
      </div>
    </div>
  );
};

export default Confirmation;
