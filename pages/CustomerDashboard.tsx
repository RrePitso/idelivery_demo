
import React, { useState, useEffect } from 'react';
// Fix: Use namespaced import for Link
import * as Router from 'react-router-dom';
import { ref, onValue, query, orderByChild, equalTo } from 'firebase/database';
import { db } from '../firebase';
import { useAuth } from '../App';
import { ParcelRequest, ParcelStatus } from '../types';

const CustomerDashboard: React.FC = () => {
  const { state } = useAuth();
  const [orders, setOrders] = useState<ParcelRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!state.user) return;

    const ordersRef = ref(db, 'parcel_requests');
    const userOrdersQuery = query(ordersRef, orderByChild('customer_id'), equalTo(state.user.uid));

    const unsubscribe = onValue(userOrdersQuery, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const sorted = Object.keys(data)
          .map(key => ({ ...data[key], id: key }))
          .sort((a, b) => b.created_at - a.created_at);
        setOrders(sorted);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [state.user]);

  const getStatusColor = (status: ParcelStatus) => {
    switch(status) {
      case ParcelStatus.COMPLETED: return 'text-green-500 bg-green-50';
      case ParcelStatus.CANCELLED: return 'text-red-500 bg-red-50';
      case ParcelStatus.ASSIGNED: return 'text-blue-500 bg-blue-50';
      case ParcelStatus.PICKED_UP: return 'text-orange-500 bg-orange-50';
      case ParcelStatus.ARRIVED_AT_DROPOFF: return 'text-purple-600 bg-purple-50 animate-pulse';
      default: return 'text-gray-500 bg-gray-100';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <header className="mb-10 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tighter italic">
              Hello, <span className="text-[#F58220]">{state.customerProfile?.full_name.split(' ')[0]}</span>
            </h1>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Ready to move something?</p>
          </div>
          <Router.Link to="/customer/order" className="bg-[#50B848] text-white px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-green-100 hover:scale-105 transition-all">
            New Order
          </Router.Link>
        </header>

        {/* Saved Locations */}
        <section className="mb-12">
           <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Saved Locations</h3>
           <div className="flex space-x-4 overflow-x-auto pb-4 scrollbar-hide">
              {state.customerProfile?.saved_locations?.length ? (
                state.customerProfile.saved_locations.map(loc => (
                  <div key={loc.id} className="flex-shrink-0 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm w-48">
                    <p className="font-black text-sm text-gray-900">{loc.label}</p>
                    <p className="text-[10px] text-gray-400 line-clamp-1">{loc.address}</p>
                  </div>
                ))
              ) : (
                <div className="bg-white p-6 rounded-2xl border-2 border-dashed border-gray-100 text-center w-full">
                   <p className="text-xs font-bold text-gray-300">No saved locations yet.</p>
                </div>
              )}
           </div>
        </section>

        {/* Order History */}
        <section>
          <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">My Orders</h3>
          <div className="space-y-4">
            {loading ? (
              <div className="animate-pulse space-y-4">
                {[1,2,3].map(i => <div key={i} className="h-32 bg-white rounded-3xl border border-gray-100"></div>)}
              </div>
            ) : orders.length > 0 ? (
              orders.map(order => (
                <div key={order.id} className={`bg-white p-6 rounded-3xl border shadow-sm transition-all ${order.status === ParcelStatus.ARRIVED_AT_DROPOFF ? 'border-purple-200 ring-2 ring-purple-100' : 'border-gray-100'}`}>
                  {order.status === ParcelStatus.ARRIVED_AT_DROPOFF && (
                    <div className="mb-4 bg-purple-600 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                      Your Driver has Arrived!
                    </div>
                  )}
                  
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-xl">📦</div>
                      <div>
                        <p className="font-black text-gray-900 italic">{order.parcel_description}</p>
                        <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">{new Date(order.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <span className={`text-[9px] font-black uppercase px-3 py-1 rounded-full ${getStatusColor(order.status)}`}>
                      {order.status.replace(/_/g, ' ')}
                    </span>
                  </div>

                  {/* Price Breakdown */}
                  <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 flex flex-col md:flex-row justify-between items-center">
                    <div className="flex space-x-4 text-[10px] font-black uppercase text-gray-400 mb-2 md:mb-0">
                       <div>Base: <span className="text-gray-900">R{order.delivery_fee?.toFixed(2) || '15.00'}</span></div>
                       {order.cost_of_goods && <div>Goods: <span className="text-gray-900">R{order.cost_of_goods.toFixed(2)}</span></div>}
                       <div>Method: <span className="text-gray-900">{order.payment_method}</span></div>
                    </div>
                    <div className="text-right">
                       <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Total to Pay</p>
                       <p className="text-2xl font-black text-gray-900 italic">R{order.final_total?.toFixed(2) || order.delivery_fee?.toFixed(2) || '15.00'}</p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-20 bg-white rounded-3xl border border-gray-100">
                <p className="text-gray-400 font-bold italic">You haven't placed any orders yet.</p>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default CustomerDashboard;
