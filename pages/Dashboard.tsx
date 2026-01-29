
import React, { useState } from 'react';
import { ref, update } from 'firebase/database';
import { db } from '../firebase';
import { useAuth } from '../App';
import { DriverStatus } from '../types';
import { formatSAFullPhone } from '../utils/whatsapp';

const Dashboard: React.FC = () => {
  const { state } = useAuth();
  const [updating, setUpdating] = useState(false);
  const [editingSettings, setEditingSettings] = useState(false);

  if (!state.driverProfile) return null;

  const profile = state.driverProfile;
  const isOnline = profile.status === DriverStatus.ONLINE;

  const toggleStatus = async () => {
    setUpdating(true);
    const newStatus = isOnline ? DriverStatus.OFFLINE : DriverStatus.ONLINE;
    try {
      await update(ref(db, `drivers/${profile.uid}`), { status: newStatus });
    } catch (err) {
      console.error("Status update failed", err);
    } finally {
      setUpdating(false);
    }
  };

  const [settingsForm, setSettingsForm] = useState({
    base_delivery_fee: profile.base_delivery_fee || 15,
    cash_enabled: profile.payment_methods?.cash?.enabled ?? true,
    cash_cost: profile.payment_methods?.cash?.cost ?? 0,
    speedpoint_enabled: profile.payment_methods?.speedpoint?.enabled ?? false,
    speedpoint_cost: profile.payment_methods?.speedpoint?.cost ?? 0,
    payshap_enabled: profile.payment_methods?.payshap?.enabled ?? false,
    payshap_phone: profile.payment_methods?.payshap?.phone_number ?? profile.phone_number ?? '',
    payshap_cost: profile.payment_methods?.payshap?.cost ?? 0,
  });

  const handleSettingsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setSettingsForm({ ...settingsForm, [name]: type === 'checkbox' ? checked : value });
  };

  const saveSettings = async () => {
    setUpdating(true);
    try {
      await update(ref(db, `drivers/${profile.uid}`), {
        base_delivery_fee: Number(settingsForm.base_delivery_fee),
        payment_methods: {
          cash: {
            enabled: settingsForm.cash_enabled,
            cost: Number(settingsForm.cash_cost)
          },
          speedpoint: {
            enabled: settingsForm.speedpoint_enabled,
            cost: Number(settingsForm.speedpoint_cost)
          },
          payshap: {
            enabled: settingsForm.payshap_enabled,
            phone_number: settingsForm.payshap_enabled ? formatSAFullPhone(settingsForm.payshap_phone) : '',
            cost: Number(settingsForm.payshap_cost)
          }
        }
      });
      setEditingSettings(false);
    } catch (err) {
      console.error("Settings update failed", err);
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="bg-[#50B848] px-6 py-8 relative">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center relative z-10">
            <div>
              <h1 className="text-2xl font-bold text-white">Hello, {profile.full_name}</h1>
              <p className="text-green-50 mt-1 flex items-center text-sm">
                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" /></svg>
                {profile.area}
              </p>
            </div>
            <div className="mt-4 sm:mt-0">
              <span className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest ${isOnline ? 'bg-white text-[#50B848]' : 'bg-green-700 text-green-100'}`}>
                {profile.status}
              </span>
            </div>
          </div>
        </div>

        <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6 border-b border-gray-100">
          <div className="bg-gray-50 rounded-xl p-4 flex items-center space-x-4">
            <div className="bg-orange-100 p-2 rounded-lg text-[#F58220]">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <div>
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-tighter">Availability</p>
              <button onClick={toggleStatus} disabled={updating} className={`text-base font-bold flex items-center ${isOnline ? 'text-[#50B848]' : 'text-gray-400'}`}>
                {isOnline ? 'Go Offline' : 'Go Online'}
              </button>
            </div>
          </div>

          <div className="bg-gray-50 rounded-xl p-4 flex items-center space-x-4">
            <div className="bg-green-100 p-2 rounded-lg text-[#50B848]">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
            </div>
            <div>
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-tighter">Capacity</p>
              <p className="text-base font-bold text-gray-900">{profile.active_jobs} / {profile.max_jobs} <span className="text-[10px] font-normal text-gray-400">Jobs</span></p>
            </div>
          </div>

          <div className="bg-gray-50 rounded-xl p-4 flex items-center space-x-4">
            <div className="bg-orange-100 p-2 rounded-lg text-[#F58220]">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
            </div>
            <div>
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-tighter">Current Fee</p>
              <p className="text-base font-bold text-gray-900">R{profile.base_delivery_fee}</p>
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-gray-900">Delivery & Payment Settings</h3>
            <button onClick={() => setEditingSettings(!editingSettings)} className="text-sm font-bold text-[#F58220] hover:underline">
              {editingSettings ? 'Cancel' : 'Edit Settings'}
            </button>
          </div>

          {editingSettings ? (
            <div className="space-y-6 animate-in slide-in-from-top-2 duration-300">
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                <label className="text-xs font-bold text-gray-500 uppercase">Base Delivery Fee (R)</label>
                <input name="base_delivery_fee" type="number" value={settingsForm.base_delivery_fee} onChange={handleSettingsChange} className="w-full mt-1 border border-gray-300 rounded-md py-2 px-3 focus:ring-[#F58220]" />
              </div>

              <div className="grid grid-cols-1 gap-4">
                {/* Cash Settings */}
                <div className={`p-4 rounded-xl border-2 transition-all ${settingsForm.cash_enabled ? 'border-[#50B848] bg-green-50' : 'border-gray-100'}`}>
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input name="cash_enabled" type="checkbox" checked={settingsForm.cash_enabled} onChange={handleSettingsChange} className="h-5 w-5 text-[#50B848] rounded focus:ring-[#50B848]" />
                    <span className="font-bold text-gray-800">Cash</span>
                  </label>
                  {settingsForm.cash_enabled && (
                    <div className="mt-4 animate-in fade-in duration-300">
                      <label className="text-[10px] font-bold text-gray-500 uppercase">Service Cost (R)</label>
                      <input name="cash_cost" type="number" value={settingsForm.cash_cost} onChange={handleSettingsChange} className="w-full mt-1 border border-gray-200 rounded-md py-2 px-3 bg-white" />
                    </div>
                  )}
                </div>

                {/* Speedpoint Settings */}
                <div className={`p-4 rounded-xl border-2 transition-all ${settingsForm.speedpoint_enabled ? 'border-[#50B848] bg-green-50' : 'border-gray-100'}`}>
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input name="speedpoint_enabled" type="checkbox" checked={settingsForm.speedpoint_enabled} onChange={handleSettingsChange} className="h-5 w-5 text-[#50B848] rounded focus:ring-[#50B848]" />
                    <span className="font-bold text-gray-800">Speedpoint</span>
                  </label>
                  {settingsForm.speedpoint_enabled && (
                    <div className="mt-4 animate-in fade-in duration-300">
                      <label className="text-[10px] font-bold text-gray-500 uppercase">Service Cost (R)</label>
                      <input name="speedpoint_cost" type="number" value={settingsForm.speedpoint_cost} onChange={handleSettingsChange} className="w-full mt-1 border border-gray-200 rounded-md py-2 px-3 bg-white" />
                    </div>
                  )}
                </div>

                {/* PayShap Settings */}
                <div className={`p-4 rounded-xl border-2 transition-all ${settingsForm.payshap_enabled ? 'border-[#50B848] bg-green-50' : 'border-gray-100'}`}>
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input name="payshap_enabled" type="checkbox" checked={settingsForm.payshap_enabled} onChange={handleSettingsChange} className="h-5 w-5 text-[#50B848] rounded focus:ring-[#50B848]" />
                    <span className="font-bold text-gray-800">PayShap</span>
                  </label>
                  {settingsForm.payshap_enabled && (
                    <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 animate-in fade-in duration-300">
                      <div>
                        <label className="text-[10px] font-bold text-gray-500 uppercase">PayShap Number</label>
                        <input name="payshap_phone" type="tel" value={settingsForm.payshap_phone} onChange={handleSettingsChange} className="w-full mt-1 border border-gray-200 rounded-md py-2 px-3 bg-white" placeholder="089..." />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-gray-500 uppercase">Service Cost (R)</label>
                        <input name="payshap_cost" type="number" value={settingsForm.payshap_cost} onChange={handleSettingsChange} className="w-full mt-1 border border-gray-200 rounded-md py-2 px-3 bg-white" />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <button onClick={saveSettings} disabled={updating} className="w-full py-4 bg-[#F58220] text-white font-black rounded-xl shadow-lg shadow-orange-100 hover:bg-orange-600 active:scale-95 transition-all uppercase tracking-widest">
                {updating ? 'Saving...' : 'Update Settings'}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-bold text-gray-700">Cash</span>
                  <span className={`text-[9px] px-2 py-0.5 rounded-full font-black uppercase ${profile.payment_methods?.cash?.enabled ? 'bg-green-100 text-[#50B848]' : 'bg-gray-200 text-gray-400'}`}>
                    {profile.payment_methods?.cash?.enabled ? 'ON' : 'OFF'}
                  </span>
                </div>
                {profile.payment_methods?.cash?.enabled && (
                  <p className="mt-2 text-xs text-gray-500 italic">Fee: R{profile.payment_methods.cash.cost}</p>
                )}
              </div>

              <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-bold text-gray-700">Speedpoint</span>
                  <span className={`text-[9px] px-2 py-0.5 rounded-full font-black uppercase ${profile.payment_methods?.speedpoint?.enabled ? 'bg-green-100 text-[#50B848]' : 'bg-gray-200 text-gray-400'}`}>
                    {profile.payment_methods?.speedpoint?.enabled ? 'ON' : 'OFF'}
                  </span>
                </div>
                {profile.payment_methods?.speedpoint?.enabled && (
                  <p className="mt-2 text-xs text-gray-500 italic">Fee: R{profile.payment_methods.speedpoint.cost}</p>
                )}
              </div>

              <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-bold text-gray-700">PayShap</span>
                  <span className={`text-[9px] px-2 py-0.5 rounded-full font-black uppercase ${profile.payment_methods?.payshap?.enabled ? 'bg-green-100 text-[#50B848]' : 'bg-gray-200 text-gray-400'}`}>
                    {profile.payment_methods?.payshap?.enabled ? 'ON' : 'OFF'}
                  </span>
                </div>
                {profile.payment_methods?.payshap?.enabled && (
                  <div className="mt-2 space-y-1">
                    <p className="text-[10px] text-gray-400"># {profile.payment_methods.payshap.phone_number}</p>
                    <p className="text-xs text-gray-500 italic">Fee: R{profile.payment_methods.payshap.cost}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
