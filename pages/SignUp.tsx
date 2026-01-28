
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createUserWithEmailAndPassword, signInWithPopup } from 'firebase/auth';
import { ref, set } from 'firebase/database';
import { auth, db, googleProvider, appleProvider } from '../firebase';
import { TransportType, DriverStatus } from '../types';

const SignUp: React.FC = () => {
  const navigate = useNavigate();
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
    setFormData({ ...formData, [e.target.name]: e.target.value });
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
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      const user = userCredential.user;

      const driverData = {
        uid: user.uid,
        full_name: formData.fullName,
        email: formData.email,
        phone_number: formData.phone,
        area: 'Alice, Eastern Cape', // Defaulting based on logo
        transport_type: formData.transportType,
        status: DriverStatus.OFFLINE,
        active_jobs: 0,
        max_jobs: calculateMaxJobs(formData.transportType),
        created_at: Date.now()
      };

      await set(ref(db, `drivers/${user.uid}`), driverData);
      navigate('/drivers/confirmation');
    } catch (err: any) {
      setError(err.message || 'An error occurred during sign up.');
    } finally {
      setLoading(false);
    }
  };

  const handleSocialSignIn = async (provider: any) => {
    try {
      setLoading(true);
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      const driverData = {
        uid: user.uid,
        full_name: user.displayName || '',
        email: user.email || '',
        phone_number: '',
        area: 'Alice, Eastern Cape',
        transport_type: 'bike' as TransportType,
        status: DriverStatus.OFFLINE,
        active_jobs: 0,
        max_jobs: 2,
        created_at: Date.now()
      };
      
      await set(ref(db, `drivers/${user.uid}`), driverData);
      navigate('/drivers/dashboard');
    } catch (err: any) {
      setError(err.message || 'Social sign in failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <h2 className="mt-6 text-3xl font-extrabold text-gray-900">Join <span className="text-[#50B848]">i</span><span className="text-[#F58220]">Delivery</span></h2>
        <p className="mt-2 text-sm text-gray-600">
          Already a driver?{' '}
          <button onClick={() => navigate('/drivers/dashboard')} className="font-medium text-[#F58220] hover:text-orange-600">
            Sign in here
          </button>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {error && (
            <div className="mb-4 bg-red-50 border-l-4 border-red-400 p-4">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSignUp}>
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">Full Name</label>
              <input
                id="fullName" name="fullName" type="text" required
                value={formData.fullName} onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-[#F58220] focus:border-[#F58220] sm:text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
                <input
                  id="email" name="email" type="email" required
                  value={formData.email} onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-[#F58220] focus:border-[#F58220] sm:text-sm"
                />
              </div>
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700">Phone (WhatsApp)</label>
                <input
                  id="phone" name="phone" type="tel" required
                  value={formData.phone} onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-[#F58220] focus:border-[#F58220] sm:text-sm"
                />
              </div>
            </div>

            <div>
              <label htmlFor="transportType" className="block text-sm font-medium text-gray-700">Transport Type</label>
              <select
                id="transportType" name="transportType"
                value={formData.transportType} onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 bg-white rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-[#F58220] focus:border-[#F58220] sm:text-sm"
              >
                <option value="bike">Bike (Max 2 Jobs)</option>
                <option value="motorcycle">Motorcycle (Max 3 Jobs)</option>
                <option value="car">Car (Max 4 Jobs)</option>
              </select>
            </div>

            <div className="relative">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
              <input
                id="password" name="password" type={showPassword ? "text" : "password"} required
                value={formData.password} onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-[#F58220] focus:border-[#F58220] sm:text-sm"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 mt-6 flex items-center text-xs font-bold leading-5 text-[#F58220]"
              >
                {showPassword ? "HIDE" : "SHOW"}
              </button>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">Confirm Password</label>
              <input
                id="confirmPassword" name="confirmPassword" type={showPassword ? "text" : "password"} required
                value={formData.confirmPassword} onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-[#F58220] focus:border-[#F58220] sm:text-sm"
              />
            </div>

            <div>
              <button
                type="submit" disabled={loading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#50B848] hover:bg-[#45a03f] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#50B848] disabled:opacity-50 transition-colors"
              >
                {loading ? 'Processing...' : 'Complete Registration'}
              </button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Or sign up with</span>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <button
                onClick={() => handleSocialSignIn(googleProvider)}
                className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12.48 10.92v3.28h4.69c-.19 1.02-.78 1.88-1.64 2.46l2.64 2.05c1.54-1.42 2.43-3.5 2.43-5.93 0-.57-.05-1.13-.15-1.67h-7.97z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-2.64-2.05c-.73.49-1.66.78-2.64.78-2.04 0-3.77-1.38-4.39-3.24h-2.73v2.11C8.71 20.35 10.22 23 12 23z" fill="#34A853"/><path d="M7.61 15.83c-.15-.45-.24-.93-.24-1.43s.09-.98.24-1.43V10.86H4.88c-.52 1.04-.81 2.21-.81 3.44s.29 2.4.81 3.44l2.73-2.11z" fill="#FBBC05"/><path d="M12 5.07c1.62 0 3.07.56 4.21 1.65l3.15-3.15C17.45 2.09 14.97 1 12 1 10.22 1 8.71 1.65 7.61 2.86l2.73 2.11c.62-1.86 2.35-3.24 4.39-3.24z" fill="#EA4335"/>
                </svg>
              </button>

              <button
                onClick={() => handleSocialSignIn(appleProvider)}
                className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.03 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.402-2.427 1.246-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.702z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignUp;
