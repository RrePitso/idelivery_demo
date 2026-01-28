
import React, { useState } from 'react';
import { ref, update } from 'firebase/database';
import { db } from '../firebase';
import { useAuth } from '../App';
import { DriverStatus } from '../types';

const Dashboard: React.FC = () => {
  const { state } = useAuth();
  const [updating, setUpdating] = useState(false);

  if (!state.driverProfile) return null;

  const profile = state.driverProfile;
  const isOnline = profile.status === DriverStatus.ONLINE;

  const toggleStatus = async () => {
    setUpdating(true);
    const newStatus = isOnline ? DriverStatus.OFFLINE : DriverStatus.ONLINE;
    try {
      await update(ref(db, `drivers/${profile.uid}`), {
        status: newStatus
      });
    } catch (err) {
      console.error("Failed to update status", err);
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Brand Header */}
        <div className="bg-[#50B848] px-6 py-8 relative">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center relative z-10">
            <div>
              <h1 className="text-2xl font-bold text-white">Welcome back, {profile.full_name}</h1>
              <p className="text-green-50 mt-1 flex items-center">
                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                </svg>
                Alice, Eastern Cape
              </p>
            </div>
            <div className="mt-4 sm:mt-0 flex items-center space-x-3">
              <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${isOnline ? 'bg-white text-[#50B848]' : 'bg-green-700 text-green-100'}`}>
                {profile.status}
              </span>
            </div>
          </div>
          {/* Subtle logo pattern in background */}
          <div className="absolute top-0 right-0 opacity-10 pointer-events-none p-4">
             <svg className="w-32 h-32" viewBox="0 0 100 100" fill="white"><path d="M50 0C22.4 0 0 22.4 0 50s22.4 50 50 50 50-22.4 50-50S77.6 0 50 0zm0 85C30.7 85 15 69.3 15 50S30.7 15 50 15s35 15.7 35 35-15.7 35-35 35z"/></svg>
          </div>
        </div>

        <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6 border-b border-gray-100">
          <div className="bg-gray-50 rounded-xl p-4 flex items-center space-x-4">
            <div className="bg-orange-100 p-2 rounded-lg text-[#F58220]">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Availability</p>
              <button 
                onClick={toggleStatus}
                disabled={updating}
                className={`text-lg font-bold flex items-center transition-colors ${isOnline ? 'text-[#50B848]' : 'text-gray-400 hover:text-[#F58220]'}`}
              >
                {isOnline ? 'Go Offline' : 'Go Online'}
                {updating && <span className="ml-2 animate-pulse text-xs">...</span>}
              </button>
            </div>
          </div>

          <div className="bg-gray-50 rounded-xl p-4 flex items-center space-x-4">
            <div className="bg-green-100 p-2 rounded-lg text-[#50B848]">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Capacity</p>
              <p className="text-lg font-bold text-gray-900">{profile.active_jobs} / {profile.max_jobs} <span className="text-xs font-normal text-gray-400">Jobs</span></p>
            </div>
          </div>

          <div className="bg-gray-50 rounded-xl p-4 flex items-center space-x-4">
            <div className="bg-orange-100 p-2 rounded-lg text-[#F58220]">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Transport</p>
              <p className="text-lg font-bold text-gray-900 capitalize">{profile.transport_type}</p>
            </div>
          </div>
        </div>

        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            Active Deliveries
            <span className="ml-2 bg-gray-100 text-gray-500 text-[10px] px-2 py-0.5 rounded-full uppercase tracking-tighter font-bold">In Realtime</span>
          </h3>
          <div className="bg-gray-50 rounded-xl border-2 border-dashed border-gray-200 p-12 text-center">
            <svg className="w-12 h-12 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-gray-500 font-medium">No active deliveries at the moment.</p>
            <p className="text-sm text-gray-400 mt-1">Switch to <span className="text-[#50B848] font-bold">ONLINE</span> to start receiving requests from Alice.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
