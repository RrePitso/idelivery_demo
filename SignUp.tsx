
import React, { useState } from 'react';
// Fix: Use namespaced imports for router and auth
import * as Router from 'react-router-dom';
import * as FirebaseAuth from 'firebase/auth';
import { ref, set, update } from 'firebase/database';
import { auth, db } from './firebase';
import { TransportType, DriverStatus } from './types';
import { sendDriverWelcomeCampaign, formatSAFullPhone } from './utils/whatsapp';

const SignUp: React.FC = () => {
  const navigate = Router.useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    transportType: 'bike' as TransportType,
    password: '',
    confirmPassword: ''
  });

  const calculateMaxJobs = (type: TransportType): number => {
    switch (type) {
      case 'bike': return 2;
      case 'motorcycle': return 3;
      case 'car': return 4;
      default: return 2;
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    setLoading(true);
    setError('');

    try {
      // Fix: Use FirebaseAuth namespace
      const userCredential = await FirebaseAuth.createUserWithEmailAndPassword(auth, formData.email, formData.password);
      const user = userCredential.user;

      const formattedPhone = formatSAFullPhone(formData.phone);
      const now = Date.now();

      const driverData = {
        uid: user.uid,
        full_name: formData.fullName,
        email: formData.email,
        phone_number: formattedPhone,
        area: 'Alice, Eastern Cape',
        transport_type: formData.transportType,
        status: DriverStatus.OFFLINE,
        active_jobs: 0,
        max_jobs: calculateMaxJobs(formData.transportType),
        created_at: now,
        whatsapp_opt_in: true,
        whatsapp_opt_in_at: now,
        whatsapp_events: {
          signup_confirmation: false
        },
        base_delivery_fee: 15,
        payment_methods: {
          cash: { enabled: true, cost: 0 },
          speedpoint: { enabled: false, cost: 0 },
          payshap: { enabled: false, cost: 0, phone_number: '' }
        },
        rating: 5.0,
        total_earnings: 0
      };

      const driverRef = ref(db, `drivers/${user.uid}`);
      await set(driverRef, driverData);

      // Call the production driver_welcome campaign as requested
      const result = await sendDriverWelcomeCampaign(formattedPhone);

      if (result && (result.status === 'success' || result.success === true)) {
        await update(ref(db, `drivers/${user.uid}/whatsapp_events`), {
          signup_confirmation: true
        });
      }

      navigate('/drivers/confirmation');
    } catch (err: any) {
      console.error("Signup error:", err);
      setError(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center px-4">
        <h2 className="mt-6 text-3xl font-extrabold text-gray-900">Join <span className="text-[#50B848]">i</span><span className="text-[#F58220]">Delivery</span></h2>
        <p className="mt-2 text-sm text-gray-600 italic">
          Already a driver?{' '}
          <Router.Link to="/drivers/signin" className="font-bold text-[#F58220] hover:text-orange-600 transition-colors">
            Sign in
          </Router.Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-white py-8 px-4 shadow-xl shadow-gray-200/50 rounded-2xl sm:px-10 border border-gray-100">
          {error && <div className="mb-4 bg-red-50 border-l-4 border-red-400 p-4 text-xs text-red-700 font-medium">{error}</div>}

          <form className="space-y-6" onSubmit={handleSignUp}>
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-2">Personal Details</h3>
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Full Name</label>
                <input name="fullName" type="text" required value={formData.fullName} onChange={handleChange} placeholder="John Doe" className="w-full border border-gray-200 rounded-xl py-2 px-3 focus:ring-2 focus:ring-[#F58220] focus:border-transparent outline-none transition-all" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Email</label>
                  <input name="email" type="email" required value={formData.email} onChange={handleChange} placeholder="john@example.com" className="w-full border border-gray-200 rounded-xl py-2 px-3 focus:ring-2 focus:ring-[#F58220] focus:border-transparent outline-none transition-all" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">WhatsApp Phone</label>
                  <input name="phone" type="tel" required value={formData.phone} onChange={handleChange} placeholder="0891234567" className="w-full border border-gray-200 rounded-xl py-2 px-3 focus:ring-2 focus:ring-[#F58220] focus:border-transparent outline-none transition-all" />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-2">Transport</h3>
              <select name="transportType" value={formData.transportType} onChange={handleChange} className="w-full border border-gray-200 rounded-xl py-2 px-3 focus:ring-2 focus:ring-[#F58220] outline-none appearance-none bg-white">
                <option value="bike">Bike (Max 2 Jobs)</option>
                <option value="motorcycle">Motorcycle (Max 3 Jobs)</option>
                <option value="car">Car (Max 4 Jobs)</option>
              </select>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-2">Security</h3>
              <div className="relative">
                <input name="password" type={showPassword ? "text" : "password"} required value={formData.password} onChange={handleChange} placeholder="Password" className="w-full border border-gray-200 rounded-xl py-2 px-3 focus:ring-2 focus:ring-[#F58220] outline-none transition-all" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-2.5 text-[10px] font-black text-[#F58220] uppercase">{showPassword ? "HIDE" : "SHOW"}</button>
              </div>
              <input name="confirmPassword" type={showPassword ? "text" : "password"} required value={formData.confirmPassword} onChange={handleChange} placeholder="Confirm Password" className="w-full border border-gray-200 rounded-xl py-2 px-3 focus:ring-2 focus:ring-[#F58220] outline-none transition-all" />
            </div>

            <div className="flex items-start bg-green-50/50 p-3 rounded-xl border border-green-100">
              <input id="optin" type="checkbox" disabled checked className="h-4 w-4 text-[#50B848] rounded mt-0.5" />
              <div className="ml-3 text-[11px] text-green-700 leading-tight">
                <strong>WhatsApp Opt-In:</strong> By signing up, you agree to receive job alerts and updates via WhatsApp.
              </div>
            </div>

            <button type="submit" disabled={loading} className={`w-full py-4 rounded-xl shadow-lg text-base font-black text-white transition-all active:scale-95 uppercase tracking-widest ${loading ? 'bg-gray-400' : 'bg-[#50B848] hover:bg-[#45a03f] shadow-green-100'}`}>
              {loading ? 'Processing...' : 'Complete Registration'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SignUp;
