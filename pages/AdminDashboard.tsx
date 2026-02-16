
import React, { useState, useEffect } from 'react';
import { ref, onValue, update } from 'firebase/database';
// Fix: Use namespaced import to resolve 'no exported member' for updatePassword
import * as FirebaseAuth from 'firebase/auth';
import { db, auth } from '../firebase';
import { DriverProfile, CustomerProfile, ParcelRequest, ParcelStatus } from '../types';
import { useAuth } from '../App';

const AdminDashboard: React.FC = () => {
  const { state } = useAuth();
  const [drivers, setDrivers] = useState<DriverProfile[]>([]);
  const [customers, setCustomers] = useState<CustomerProfile[]>([]);
  const [orders, setOrders] = useState<ParcelRequest[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'drivers' | 'customers' | 'orders' | 'settings'>('overview');
  const [loading, setLoading] = useState(true);

  // Stats
  const [stats, setStats] = useState({
    totalEarnings: 0,
    totalOrders: 0,
    activeDrivers: 0,
    pendingOrders: 0
  });

  // Settings
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwdLoading, setPwdLoading] = useState(false);
  const [pwdMsg, setPwdMsg] = useState({ type: '', text: '' });

  useEffect(() => {
    const driversRef = ref(db, 'drivers');
    const customersRef = ref(db, 'customers');
    const ordersRef = ref(db, 'parcel_requests');

    const unsubDrivers = onValue(driversRef, (snap) => {
      const data = snap.val();
      if (data) {
        const list = Object.values(data) as DriverProfile[];
        setDrivers(list);
      }
    });

    const unsubCustomers = onValue(customersRef, (snap) => {
      const data = snap.val();
      if (data) {
        const list = Object.values(data) as CustomerProfile[];
        setCustomers(list);
      }
    });

    const unsubOrders = onValue(ordersRef, (snap) => {
      const data = snap.val();
      if (data) {
        const list = Object.keys(data).map(key => ({ ...data[key], id: key })) as ParcelRequest[];
        setOrders(list.sort((a, b) => b.created_at - a.created_at));
      }
      setLoading(false);
    });

    return () => {
      unsubDrivers();
      unsubCustomers();
      unsubOrders();
    };
  }, []);

  useEffect(() => {
    const revenue = orders
      .filter(o => o.status === ParcelStatus.COMPLETED)
      .reduce((acc, curr) => acc + (curr.delivery_fee || 15) + (curr.payment_surcharge || 0), 0);
    
    const activeDr = drivers.filter(d => d.status === 'ONLINE').length;
    const pending = orders.filter(o => o.status !== ParcelStatus.COMPLETED && o.status !== ParcelStatus.CANCELLED).length;

    setStats({
      totalEarnings: revenue,
      totalOrders: orders.length,
      activeDrivers: activeDr,
      pendingOrders: pending
    });
  }, [drivers, orders]);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setPwdMsg({ type: 'error', text: 'Passwords do not match' });
      return;
    }
    setPwdLoading(true);
    try {
      if (auth.currentUser) {
        // Fix: Use FirebaseAuth namespace
        await FirebaseAuth.updatePassword(auth.currentUser, newPassword);
        setPwdMsg({ type: 'success', text: 'Password updated successfully!' });
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (err: any) {
      setPwdMsg({ type: 'error', text: err.message });
    } finally {
      setPwdLoading(false);
    }
  };

  const deleteOrder = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this order?')) {
      await update(ref(db, `parcel_requests/${id}`), { status: ParcelStatus.CANCELLED });
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#F58220]"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <header className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100">
          <div>
            <h1 className="text-4xl font-black text-gray-900 tracking-tighter italic uppercase">Admin <span className="text-[#F58220]">Control</span></h1>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">iDelivery Alice Operations Center</p>
          </div>
          <div className="mt-4 md:mt-0 flex space-x-2">
            {['overview', 'drivers', 'customers', 'orders', 'settings'].map((tab) => (
              <button 
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-[#50B848] text-white shadow-lg' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
              >
                {tab}
              </button>
            ))}
          </div>
        </header>

        {activeTab === 'overview' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[
                { label: 'Platform Revenue', val: `R${stats.totalEarnings.toFixed(2)}`, color: 'text-[#50B848]' },
                { label: 'Total Orders',