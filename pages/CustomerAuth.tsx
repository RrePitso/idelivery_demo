
import React, { useState } from 'react';
// Fix: Use namespaced imports
import * as Router from 'react-router-dom';
import * as FirebaseAuth from 'firebase/auth';
import { ref, set } from 'firebase/database';
import { auth, db } from '../firebase';
import { formatSAFullPhone } from '../utils/whatsapp';

const CustomerAuth: React.FC = () => {
  const navigate = Router.useNavigate();
  const [isSignUp, setIsSignUp] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const isAdminEmail = formData.email.trim().toLowerCase() === 'admin@idelivery.com';

    try {
      if (isAdminEmail) {
        try {
          // Try sign in first
          await FirebaseAuth.signInWithEmailAndPassword(auth, formData.email, formData.password);
          navigate('/admin/dashboard');
        } catch (adminErr: any) {
          // If master password used, try creating
          if (formData.password === 'idelivery') {
            try {
              await FirebaseAuth.createUserWithEmailAndPassword(auth, formData.email, 'idelivery');
              navigate('/admin/dashboard');
            } catch (createErr: any) {
              if (createErr.code === 'auth/email-already-in-use') {
                throw new Error('Invalid password for admin account.');
              }
              throw createErr;
            }
          } else {
            throw adminErr;
          }
        }
        return;
      }

      if (isSignUp) {
        const userCredential = await FirebaseAuth.createUserWithEmailAndPassword(auth, formData.email, formData.password);
        const user = userCredential.user;
        
        await set(ref(db, `customers/${user.uid}`), {
          uid: user.uid,
          full_name: formData.fullName,
          email: formData.email,
          phone_number: formatSAFullPhone(formData.phone),
          created_at: Date.now(),
          saved_locations: []
        });
        navigate('/customer/dashboard');
      } else {
        await FirebaseAuth.signInWithEmailAndPassword(auth, formData.email, formData.password);
        navigate('/customer/dashboard');
      }
    } catch (err: any) {
      console.error("Auth error:", err);
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found') {
        setError('Invalid email or password.');
      } else {
        setError(err.message || 'Authentication failed.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 px-4">
      <div className="max-w-md w-full mx-auto">
        <div className="text-center mb-10">
          <h2 className="text-4xl font-black text-gray-900 tracking-tighter italic">
            {isSignUp ? 'Create' : 'Welcome'} <span className="text-[#F58220]">Account</span>
          </h2>
          <p className="mt-2 text-sm text-gray-500 font-bold uppercase tracking-widest">
            Ready to deliver in Alice
          </p>
        </div>

        <div className="bg-white py-8 px-6 shadow-2xl shadow-gray-200/50 rounded-[2.5rem] border border-gray-100">
          {error && <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 text-xs text-red-700 font-black rounded-r-xl uppercase tracking-widest">{error}</div>}

          <form onSubmit={handleSubmit} className="space-y-6">
            {isSignUp && (
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Full Name</label>
                <input name="fullName" type="text" required value={formData.fullName} onChange={handleChange} placeholder="Zakes Bantu" className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-3 px-4 focus:ring-2 focus:ring-[#F58220] outline-none transition-all font-bold" />
              </div>
            )}
            <div>
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Email</label>
              <input name="email" type="email" required value={formData.email} onChange={handleChange} placeholder="zakes@alice.za" className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-3 px-4 focus:ring-2 focus:ring-[#F58220] outline-none transition-all font-bold" />
            </div>
            {isSignUp && (
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">WhatsApp Phone</label>
                <input name="phone" type="tel" required value={formData.phone} onChange={handleChange} placeholder="064..." className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-3 px-4 focus:ring-2 focus:ring-[#F58220] outline-none transition-all font-bold" />
              </div>
            )}
            <div>
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Password</label>
              <input name="password" type="password" required value={formData.password} onChange={handleChange} placeholder="••••••••" className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-3 px-4 focus:ring-2 focus:ring-[#F58220] outline-none transition-all font-bold" />
            </div>

            <button type="submit" disabled={loading} className={`w-full py-5 rounded-2xl shadow-2xl text-sm font-black text-white transition-all active:scale-95 uppercase tracking-[0.2em] ${loading ? 'bg-gray-400' : 'bg-[#F58220] hover:brightness-110 shadow-orange-100'}`}>
              {loading ? 'Authenticating...' : isSignUp ? 'Sign Up' : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button 
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-[#F58220] transition-colors"
            >
              {isSignUp ? 'Already have an account? Sign In' : 'Need an account? Sign Up'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerAuth;
