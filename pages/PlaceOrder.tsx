
import React, { useState } from 'react';
import { ref, push, set, update } from 'firebase/database';
// Fix: Use namespaced import for router hooks
import * as Router from 'react-router-dom';
import { db } from '../firebase';
import { useAuth } from '../App';
import { ParcelStatus, SavedLocation } from '../types';

const PlaceOrder: React.FC = () => {
  const navigate = Router.useNavigate();
  const { state } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [savePickup, setSavePickup] = useState(false);
  const [saveDropoff, setSaveDropoff] = useState(false);
  
  const [formData, setFormData] = useState({
    parcelDescription: '',
    quantity: 1,
    pickupLocation: '',
    dropoffLocation: '',
    paymentMethod: 'cash'
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const selectSavedLocation = (type: 'pickup' | 'dropoff', address: string) => {
    setFormData(prev => ({ 
      ...prev, 
      [type === 'pickup' ? 'pickupLocation' : 'dropoffLocation']: address 
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if ((savePickup || saveDropoff) && state.customerProfile) {
        const newSaved: SavedLocation[] = [...(state.customerProfile.saved_locations || [])];
        if (savePickup) {
          newSaved.push({ id: Date.now().toString(), label: `Pickup ${new Date().toLocaleDateString()}`, address: formData.pickupLocation });
        }
        if (saveDropoff) {
          newSaved.push({ id: (Date.now() + 1).toString(), label: `Dropoff ${new Date().toLocaleDateString()}`, address: formData.dropoffLocation });
        }
        await update(ref(db, `customers/${state.user.uid}`), { saved_locations: newSaved });
      }

      const requestsRef = ref(db, 'parcel_requests');
      const newRequestRef = push(requestsRef);
      const requestId = newRequestRef.key;

      const orderData = {
        id: requestId,
        customer_id: state.user.uid,
        customer_name: state.customerProfile?.full_name || 'Customer',
        customer_phone: state.customerProfile?.phone_number || '',
        customer_email: state.customerProfile?.email || state.user?.email || '', // Robust email fallback
        parcel_description: formData.parcelDescription,
        quantity: Number(formData.quantity),
        pickup_location: formData.pickupLocation,
        dropoff_location: formData.dropoffLocation,
        payment_method: formData.paymentMethod,
        status: ParcelStatus.READY_FOR_DRIVER_MATCHING,
        created_at: Date.now(),
        delivery_fee: 15.00
      };

      await set(newRequestRef, orderData);
      navigate('/customer/dashboard');
    } catch (err: any) {
      console.error('Ordering error:', err);
      setError('Failed to place order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto">
        <div className="text-center mb-10">
          <h2 className="text-4xl font-black text-gray-900 tracking-tighter italic">
            Place an <span className="text-[#F58220]">Order</span>
          </h2>
          <p className="mt-2 text-sm text-gray-500 font-medium uppercase tracking-widest">
            Fast Delivery across Alice
          </p>
        </div>

        <div className="bg-white py-8 px-6 shadow-2xl shadow-gray-200/50 rounded-[2.5rem] border border-gray-100">
          {error && <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 text-xs text-red-700 font-black rounded-r-xl uppercase tracking-widest">{error}</div>}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] border-b border-gray-50 pb-3">Parcel Info</h3>
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Item Description</label>
                <input name="parcelDescription" type="text" required value={formData.parcelDescription} onChange={handleChange} placeholder="e.g., 2 Piece Meal from KFC" className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-3 px-4 outline-none font-bold shadow-sm" />
              </div>
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Quantity</label>
                <input name="quantity" type="number" min="1" required value={formData.quantity} onChange={handleChange} className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-3 px-4 outline-none font-bold shadow-sm" />
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] border-b border-gray-50 pb-3">Logistics</h3>
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Pickup From</label>
                {state.customerProfile?.saved_locations?.length ? (
                  <div className="flex space-x-2 mb-2 overflow-x-auto pb-1">
                    {state.customerProfile.saved_locations.map(loc => (
                      <button key={loc.id} type="button" onClick={() => selectSavedLocation('pickup', loc.address)} className="text-[9px] font-black uppercase whitespace-nowrap px-3 py-1 bg-orange-50 text-[#F58220] rounded-full hover:bg-orange-100">
                        {loc.label}
                      </button>
                    ))}
                  </div>
                ) : null}
                <textarea name="pickupLocation" required rows={2} value={formData.pickupLocation} onChange={handleChange} placeholder="Enter address..." className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-3 px-4 outline-none font-bold resize-none shadow-sm" />
                <label className="flex items-center mt-2 cursor-pointer">
                  <input type="checkbox" checked={savePickup} onChange={e => setSavePickup(e.target.checked)} className="rounded text-[#F58220] mr-2" />
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Save this location</span>
                </label>
              </div>

              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Deliver To</label>
                {state.customerProfile?.saved_locations?.length ? (
                  <div className="flex space-x-2 mb-2 overflow-x-auto pb-1">
                    {state.customerProfile.saved_locations.map(loc => (
                      <button key={loc.id} type="button" onClick={() => selectSavedLocation('dropoff', loc.address)} className="text-[9px] font-black uppercase whitespace-nowrap px-3 py-1 bg-green-50 text-[#50B848] rounded-full hover:bg-green-100">
                        {loc.label}
                      </button>
                    ))}
                  </div>
                ) : null}
                <textarea name="dropoffLocation" required rows={2} value={formData.dropoffLocation} onChange={handleChange} placeholder="Enter address..." className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-3 px-4 outline-none font-bold resize-none shadow-sm" />
                <label className="flex items-center mt-2 cursor-pointer">
                  <input type="checkbox" checked={saveDropoff} onChange={e => setSaveDropoff(e.target.checked)} className="rounded text-[#F58220] mr-2" />
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Save this location</span>
                </label>
              </div>
            </div>

            <div>
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Payment Method</label>
              <select name="paymentMethod" value={formData.paymentMethod} onChange={handleChange} className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-3 px-4 outline-none font-bold text-xs uppercase tracking-widest shadow-sm">
                <option value="cash">💵 Cash on Delivery</option>
                <option value="speedpoint">💳 Speedpoint</option>
                <option value="payshap">📲 PayShap</option>
              </select>
            </div>

            <div className="bg-orange-50 p-4 rounded-2xl border border-orange-100 flex items-center">
              <span className="text-xl mr-3">💰</span>
              <div>
                <p className="text-[10px] font-black text-orange-800 uppercase tracking-widest">Base Delivery Fee</p>
                <p className="text-xl font-black text-orange-900 italic">R15.00</p>
              </div>
            </div>

            <button type="submit" disabled={loading} className={`w-full py-5 rounded-2xl shadow-2xl text-sm font-black text-white transition-all active:scale-95 uppercase tracking-[0.2em] ${loading ? 'bg-gray-400' : 'bg-[#50B848] hover:brightness-110 shadow-green-100'}`}>
              {loading ? 'Processing Order...' : 'Send Driver Now'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PlaceOrder;
