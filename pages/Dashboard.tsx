
import React, { useState, useEffect } from 'react';
import { ref, update, onValue, query, orderByChild, equalTo, runTransaction } from 'firebase/database';
import { db } from '../firebase';
import { useAuth } from '../App';
import { DriverStatus, ParcelRequest, ParcelStatus } from '../types';
import { formatSAFullPhone } from '../utils/whatsapp';
import { sendArrivedNotificationEmail } from '../utils/email';
import AIAssistant from '../components/AIAssistant';

const Dashboard: React.FC = () => {
  const { state } = useAuth();
  const [updating, setUpdating] = useState(false);
  const [editingSettings, setEditingSettings] = useState(false);
  const [activeJobs, setActiveJobs] = useState<ParcelRequest[]>([]);
  const [availableJobs, setAvailableJobs] = useState<ParcelRequest[]>([]);
  const [goodsPriceInput, setGoodsPriceInput] = useState<{ [key: string]: string }>({});
  const [notifyingIds, setNotifyingIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!state.driverProfile) return;
    
    const activeRef = ref(db, 'parcel_requests');
    const myJobsQuery = query(
      activeRef, 
      orderByChild('assigned_driver_id'), 
      equalTo(state.driverProfile.uid)
    );

    const unsubscribeMy = onValue(myJobsQuery, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const jobs = Object.keys(data)
          .map(key => ({ ...data[key], id: key }))
          .filter(j => j.status !== ParcelStatus.COMPLETED && j.status !== ParcelStatus.CANCELLED)
          .sort((a, b) => b.created_at - a.created_at);
        setActiveJobs(jobs);
      } else {
        setActiveJobs([]);
      }
    });

    const availableQuery = query(
      ref(db, 'parcel_requests'),
      orderByChild('status'),
      equalTo(ParcelStatus.READY_FOR_DRIVER_MATCHING)
    );

    const unsubscribeAvail = onValue(availableQuery, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const jobs = Object.keys(data)
          .map(key => ({ ...data[key], id: key }))
          .filter(j => !j.assigned_driver_id);
        setAvailableJobs(jobs);
      } else {
        setAvailableJobs([]);
      }
    });

    return () => {
      unsubscribeMy();
      unsubscribeAvail();
    };
  }, [state.driverProfile]);

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

  const acceptJob = async (jobId: string) => {
    if (!isOnline) {
      alert("You must be ONLINE to accept jobs!");
      return;
    }
    setUpdating(true);
    try {
      await update(ref(db, `parcel_requests/${jobId}`), {
        assigned_driver_id: profile.uid,
        status: ParcelStatus.ASSIGNED,
        delivery_fee: profile.base_delivery_fee
      });
    } catch (err) {
      console.error("Failed to accept job", err);
    } finally {
      setUpdating(false);
    }
  };

  const updateGoodsCost = async (job: ParcelRequest) => {
    const cost = parseFloat(goodsPriceInput[job.id!] || "0");
    if (isNaN(cost) || cost < 0) return;

    const paymentMethod = (job.payment_method?.toLowerCase() || 'cash') as string;
    const methodSurcharge = profile.payment_methods[paymentMethod]?.cost || 0;
    const baseFee = job.delivery_fee || profile.base_delivery_fee;
    
    const finalTotal = baseFee + methodSurcharge + cost;

    try {
      await update(ref(db, `parcel_requests/${job.id}`), {
        cost_of_goods: cost,
        payment_surcharge: methodSurcharge,
        final_total: finalTotal,
        status: ParcelStatus.PICKED_UP
      });
    } catch (err) {
      console.error("Update cost failed", err);
    }
  };

  const notifyArrived = async (job: ParcelRequest) => {
    if (notifyingIds.has(job.id!)) return;
    
    setNotifyingIds(prev => new Set(prev).add(job.id!));
    try {
      console.log(`🚀 Driver notifying arrival for order ${job.id}. Target email: ${job.customer_email}`);
      
      await update(ref(db, `parcel_requests/${job.id}`), {
        status: ParcelStatus.ARRIVED_AT_DROPOFF
      });

      if (job.customer_email) {
        await sendArrivedNotificationEmail({
          customer_name: job.customer_name,
          to_email: job.customer_email,
          order_id: job.id,
          dropoff_location: job.dropoff_location,
          parcel_description: job.parcel_description,
          final_total: job.final_total
        });
      } else {
        console.warn('⚠️ No customer email found for this order. Skipping email notification.');
      }
    } catch (err) {
      console.error("Arrived notification flow failed:", err);
    } finally {
      setNotifyingIds(prev => {
        const next = new Set(prev);
        next.delete(job.id!);
        return next;
      });
    }
  };

  const completeOrder = async (job: ParcelRequest) => {
    try {
      await update(ref(db, `parcel_requests/${job.id}`), {
        status: ParcelStatus.COMPLETED
      });
      
      const earningsToAdd = (job.delivery_fee || profile.base_delivery_fee) + (job.payment_surcharge || 0);
      
      await runTransaction(ref(db, `drivers/${profile.uid}/total_earnings`), (current) => {
        return (current || 0) + earningsToAdd;
      });
    } catch (err) {
      console.error("Completion failed", err);
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
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-gray-100 border border-gray-50 overflow-hidden">
        <div className="bg-[#50B848] px-6 py-12 relative overflow-hidden">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center relative z-10">
            <div className="flex items-center space-x-5">
              <div className="w-24 h-24 bg-white rounded-3xl flex items-center justify-center text-[#50B848] text-4xl font-black shadow-2xl transform -rotate-3">
                {profile.full_name.charAt(0)}
              </div>
              <div>
                <h1 className="text-3xl font-black text-white italic tracking-tighter">{profile.full_name}</h1>
                <p className="text-green-100 mt-1 flex items-center font-bold text-sm bg-green-900/20 px-3 py-1 rounded-full w-fit">
                  {profile.area}
                </p>
                <p className="text-white/60 text-[10px] font-black uppercase tracking-widest mt-2">Verified iDelivery Partner</p>
              </div>
            </div>
            <div className="mt-8 md:mt-0">
              <button 
                onClick={toggleStatus} 
                disabled={updating}
                className={`flex items-center justify-center space-x-3 px-8 py-4 rounded-[1.5rem] transition-all active:scale-95 shadow-2xl ${
                  isOnline 
                  ? 'bg-white text-[#50B848]' 
                  : 'bg-green-700 text-green-100'
                }`}
              >
                <div className={`w-3 h-3 rounded-full ${isOnline ? 'bg-[#50B848] animate-pulse' : 'bg-gray-400'}`}></div>
                <span className="font-black uppercase tracking-widest text-sm">{isOnline ? 'ONLINE' : 'OFFLINE'}</span>
              </button>
            </div>
          </div>
        </div>

        <div className="p-8 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gray-50 rounded-3xl p-6 border border-gray-100">
            <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-2">Total Earnings</p>
            <span className="text-2xl font-black text-gray-900">R{(profile.total_earnings || 0).toFixed(2)}</span>
          </div>
          <div className="bg-gray-50 rounded-3xl p-6 border border-gray-100">
            <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-2">My Active Jobs</p>
            <span className="text-2xl font-black text-gray-900">{activeJobs.length}</span>
          </div>
          <div className="bg-gray-50 rounded-3xl p-6 border border-gray-100">
            <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-2">Rating</p>
            <span className="text-2xl font-black text-gray-900 italic">{profile.rating || 5.0} ⭐</span>
          </div>
          <div className="bg-gray-50 rounded-3xl p-6 border border-gray-100">
            <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-2">Capacity</p>
            <span className="text-2xl font-black text-gray-900">{activeJobs.length}/{profile.max_jobs}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 p-8">
            <h3 className="text-xl font-black text-gray-900 italic tracking-tight mb-8">My Current Deliveries</h3>
            {activeJobs.length > 0 ? (
              <div className="space-y-6">
                {activeJobs.map(job => (
                  <div key={job.id} className="p-6 rounded-[2rem] bg-gray-50 border-2 border-green-100">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                         <p className="text-lg font-black text-gray-900 italic">{job.parcel_description}</p>
                         <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-green-100 text-green-700`}>{job.status.replace(/_/g, ' ')}</span>
                      </div>
                      <div className="text-right">
                         <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Base Fee</p>
                         <p className="text-xl font-black text-[#50B848]">R{job.delivery_fee?.toFixed(2)}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                       <div className="text-[11px]"><span className="font-black text-gray-400 uppercase mr-2">From:</span> {job.pickup_location}</div>
                       <div className="text-[11px]"><span className="font-black text-gray-400 uppercase mr-2">To:</span> {job.dropoff_location}</div>
                    </div>

                    {job.status === ParcelStatus.ASSIGNED && (
                      <div className="bg-white p-5 rounded-2xl border border-gray-100 mb-4">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Enter Goods Price (from receipt)</label>
                        <div className="flex space-x-3">
                           <div className="relative flex-grow">
                             <span className="absolute left-3 top-2.5 font-bold text-gray-400">R</span>
                             <input 
                                type="number" 
                                value={goodsPriceInput[job.id!] || ''} 
                                onChange={(e) => setGoodsPriceInput(prev => ({...prev, [job.id!]: e.target.value}))}
                                className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2 pl-7 pr-3 outline-none font-bold" 
                                placeholder="0.00"
                             />
                           </div>
                           <button 
                             onClick={() => updateGoodsCost(job)}
                             className="bg-[#F58220] text-white px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest hover:brightness-110"
                           >
                             Save & Picked Up
                           </button>
                        </div>
                      </div>
                    )}

                    {job.status === ParcelStatus.PICKED_UP && (
                      <div className="flex items-center justify-between p-4 bg-orange-50 rounded-2xl border border-orange-100 mb-4">
                        <div className="text-xs font-bold text-orange-800">
                          Total Customer Pays: <span className="text-lg font-black ml-1">R{job.final_total?.toFixed(2)}</span>
                        </div>
                        <button 
                          onClick={() => notifyArrived(job)}
                          disabled={notifyingIds.has(job.id!)}
                          className={`bg-[#F58220] text-white px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-orange-100 ${notifyingIds.has(job.id!) ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          {notifyingIds.has(job.id!) ? 'Notifying...' : "I'm Outside"}
                        </button>
                      </div>
                    )}

                    {job.status === ParcelStatus.ARRIVED_AT_DROPOFF && (
                      <div className="flex items-center justify-between p-4 bg-green-50 rounded-2xl border border-green-100 mb-4">
                        <div className="text-xs font-bold text-green-800">
                          Awaiting Customer Collection
                        </div>
                        <button 
                          onClick={() => completeOrder(job)}
                          className="bg-[#50B848] text-white px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-green-100"
                        >
                          Mark Delivered
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center py-10 text-gray-400 font-bold italic">No active jobs assigned to you yet.</p>
            )}
          </div>

          <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 p-8">
            <h3 className="text-xl font-black text-gray-900 italic tracking-tight mb-8">Available Near You</h3>
            {availableJobs.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {availableJobs.map(job => (
                  <div key={job.id} className="p-6 rounded-3xl bg-white border border-gray-100 hover:border-[#F58220] transition-all group">
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-[10px] font-black text-orange-500 uppercase tracking-widest bg-orange-50 px-2 py-0.5 rounded-md">New Request</span>
                      <span className="text-lg font-black text-gray-900">R15+</span>
                    </div>
                    <p className="text-sm font-black text-gray-800 italic mb-4 line-clamp-1">{job.parcel_description}</p>
                    <button 
                      onClick={() => acceptJob(job.id!)}
                      className="w-full py-3 bg-gray-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[#50B848] transition-colors"
                    >
                      Accept Job
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center bg-gray-50 rounded-3xl border border-gray-100">
                <p className="text-gray-400 font-bold italic">No new jobs in Alice right now.</p>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 p-8">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-xl font-black text-gray-900 italic tracking-tighter">Preferences</h3>
              <button 
                onClick={() => setEditingSettings(!editingSettings)}
                className="text-[10px] font-black text-[#F58220] uppercase tracking-widest bg-orange-50 px-3 py-1.5 rounded-full"
              >
                {editingSettings ? 'Cancel' : 'Edit'}
              </button>
            </div>

            {editingSettings ? (
              <div className="space-y-6">
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Base Delivery Fee (R)</label>
                  <input name="base_delivery_fee" type="number" value={settingsForm.base_delivery_fee} onChange={handleSettingsChange} className="w-full bg-gray-50 border border-gray-200 rounded-2xl py-3 px-4 outline-none font-bold" />
                </div>
                
                <div className="space-y-4">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Payment Surcharges</p>
                  {['cash', 'speedpoint', 'payshap'].map((method) => {
                    const isEnabled = settingsForm[`${method}_enabled` as keyof typeof settingsForm] as boolean;
                    return (
                      <div key={method} className={`p-4 rounded-2xl border-2 ${isEnabled ? 'border-[#50B848] bg-green-50/50' : 'border-gray-100'}`}>
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-bold text-gray-800 text-sm capitalize">{method}</span>
                          <input name={`${method}_enabled`} type="checkbox" checked={isEnabled} onChange={handleSettingsChange} className="h-4 w-4 text-[#50B848]" />
                        </div>
                        {isEnabled && (
                          <input 
                            name={`${method}_cost`} 
                            type="number" 
                            value={settingsForm[`${method}_cost` as keyof typeof settingsForm]} 
                            onChange={handleSettingsChange} 
                            placeholder="Additional R cost"
                            className="w-full bg-white border border-gray-200 rounded-xl py-2 px-3 text-xs font-bold" 
                          />
                        )}
                      </div>
                    );
                  })}
                </div>

                <button onClick={saveSettings} className="w-full py-4 bg-[#F58220] text-white font-black rounded-2xl shadow-xl uppercase tracking-widest text-xs">
                  Save Changes
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="p-6 bg-gray-50 rounded-2xl border border-gray-100">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">My Base Fee</span>
                  <span className="text-3xl font-black text-gray-800 italic">R{profile.base_delivery_fee}</span>
                </div>
                
                <div className="space-y-2">
                   {['cash', 'speedpoint', 'payshap'].map(m => profile.payment_methods[m]?.enabled && (
                     <div key={m} className="flex justify-between text-[10px] font-black uppercase text-gray-500 bg-gray-50 p-3 rounded-xl border border-gray-100">
                       <span>{m}</span>
                       <span className="text-[#50B848]">+ R{profile.payment_methods[m].cost}</span>
                     </div>
                   ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      <AIAssistant />
    </div>
  );
};

export default Dashboard;
