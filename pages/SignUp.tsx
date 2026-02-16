
import React, { useState } from 'react';
// Fix: Use namespaced imports for router and auth
import * as Router from 'react-router-dom';
import * as FirebaseAuth from 'firebase/auth';
import { ref, set, update } from 'firebase/database';
import { auth, db } from '../firebase';
import { TransportType, DriverStatus } from '../types';
import { sendDriverWelcomeCampaign, formatSAFullPhone } from '../utils/whatsapp';

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
      // Fix: Use FirebaseAuth namespace for modular function
      const userCredential = await FirebaseAuth.createUserWithEmailAndPassword(auth, formData.email, formData.password);
      const user = userCredential.user;

      // Ensure phone is strictly digits for WhatsApp API (e.g. 27648673644)
      const formattedPhoneForWhatsApp = formatSAFullPhone(formData.phone);
      const now = Date.now();

      const driverData = {
        uid: user.uid,
        full_name: formData.fullName,
        email: formData.email,
        phone_number: formattedPhoneForWhatsApp,
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

      // Call the production driver_welcome campaign with the optimized phone format
      try {
        const result = await sendDriverWelcomeCampaign(formattedPhoneForWhatsApp);
        if (result && (result.status === 'success' || result.success === true)) {
          await update(ref(db, `drivers/${user.uid}/whatsapp_events`), {
            signup_confirmation: true
          });
        }
      } catch (waError) {
        console.warn("WhatsApp Campaign failed but account created:", waError);
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
        <h2 className="mt-6 text-4xl font-black text-gray-900 tracking-tighter italic">Join <span className="text-[#50B848]">i</span><span className="text-[#F58220]">Delivery</span></h2>
        <p className="mt-2 text-sm text-gray-500 font-medium">
          Already a partner?{' '}
          <Router.Link to="/drivers/signin" className="font-black text-[#F58220] hover:text-orange-600 transition-colors uppercase text-xs tracking-widest">
            Sign in
          </Router.Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-white py-10 px-6 shadow-2xl shadow-gray-200/50 rounded-[2rem] sm:px-10 border border-gray-100">
          {error && <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 text-xs text-red-700 font-black rounded-r-xl uppercase tracking-widest">{error}</div>}

          <form className="space-y-6" onSubmit={handleSignUp}>
            <div className="space-y-6">
              <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] border-b border-gray-50 pb-3">Personal Identity</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Full Name</label>
                  <input name="fullName" type="text" required value={formData.fullName} onChange={handleChange} placeholder="Zakes Bantu" className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-3.5 px-4 focus:ring-2 focus:ring-[#F58220] focus:border-transparent outline-none transition-all font-bold" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Email</label>
                    <input name="email" type="email" required value={formData.email} onChange={handleChange} placeholder="zakes@alice.za" className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-3.5 px-4 focus:ring-2 focus:ring-[#F58220] outline-none transition-all font-bold" />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">WhatsApp Phone</label>
                    <input name="phone" type="tel" required value={formData.phone} onChange={handleChange} placeholder="0648673644" className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-3.5 px-4 focus:ring-2 focus:ring-[#F58220] outline-none transition-all font-bold" />
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] border-b border-gray-50 pb-3">Transport Mode</h3>
              <select name="transportType" value={formData.transportType} onChange={handleChange} className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-3.5 px-4 focus:ring-2 focus:ring-[#F58220] outline-none appearance-none font-black text-gray-700 uppercase tracking-widest text-xs">
                <option value="bike">Bicycle (2 Loads)</option>
                <option value="motorcycle">Motorbike (3 Loads)</option>
                <option value="car">Car / Bakkie (4 Loads)</option>
              </select>
            </div>

            <div className="space-y-6">
              <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] border-b border-gray-50 pb-3">Security Access</h3>
              <div className="space-y-4">
                <div className="relative">
                  <input name="password" type={showPassword ? "text" : "password"} required value={formData.password} onChange={handleChange} placeholder="Create Password" className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-3.5 px-4 focus:ring-2 focus:ring-[#F58220] outline-none transition-all font-bold" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-4 text-[9px] font-black text-[#F58220] uppercase tracking-widest">{showPassword ? "Hide" : "Show"}</button>
                </div>
                <input name="confirmPassword" type={showPassword ? "text" : "password"} required value={formData.confirmPassword} onChange={handleChange} placeholder="Confirm Password" className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-3.5 px-4 focus:ring-2 focus:ring-[#F58220] outline-none transition-all font-bold" />
              </div>
            </div>

            <div className="flex items-start bg-green-50/50 p-4 rounded-2xl border border-green-100">
              <div className="flex-shrink-0 mt-0.5">
                 <svg className="w-4 h-4 text-[#50B848]" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
              </div>
              <div className="ml-3 text-[10px] text-green-800 font-bold uppercase tracking-tight leading-relaxed">
                I agree to receive job notifications via WhatsApp.
              </div>
            </div>

            <button type="submit" disabled={loading} className={`w-full py-5 rounded-2xl shadow-2xl text-sm font-black text-white transition-all active:scale-95 uppercase tracking-[0.2em] ${loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#50B848] hover:brightness-110 shadow-green-100'}`}>
              {loading ? 'Validating...' : 'Start Driving Now'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SignUp;
