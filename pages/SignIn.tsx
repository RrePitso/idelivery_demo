
import React, { useState } from 'react';
// Fix: Use namespaced imports for router and auth
import * as Router from 'react-router-dom';
import * as FirebaseAuth from 'firebase/auth';
import { auth } from '../firebase';

const SignIn: React.FC = () => {
  const navigate = Router.useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const isAdminEmail = formData.email.trim().toLowerCase() === 'admin@idelivery.com';

    try {
      if (isAdminEmail) {
        try {
          // 1. Try to sign in
          await FirebaseAuth.signInWithEmailAndPassword(auth, formData.email, formData.password);
          navigate('/admin/dashboard');
        } catch (adminErr: any) {
          // 2. If sign-in fails and password is the master key, attempt to create
          // We check for user-not-found OR invalid-credential (which modern Firebase uses for both)
          if (formData.password === 'idelivery') {
            try {
              await FirebaseAuth.createUserWithEmailAndPassword(auth, formData.email, 'idelivery');
              navigate('/admin/dashboard');
            } catch (createErr: any) {
              // If creation fails with email-already-in-use, it means the password was changed from 'idelivery'
              if (createErr.code === 'auth/email-already-in-use') {
                throw new Error('Invalid password for admin account.');
              }
              throw createErr;
            }
          } else {
            throw adminErr;
          }
        }
      } else {
        await FirebaseAuth.signInWithEmailAndPassword(auth, formData.email, formData.password);
        navigate('/drivers/dashboard');
      }
    } catch (err: any) {
      console.error("Sign in error:", err);
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found') {
        setError('Invalid email or password. Please try again.');
      } else {
        setError(err.message || 'An error occurred during sign in.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <h2 className="text-3xl font-black text-gray-900 italic">
          Welcome Back to <span className="text-[#50B848]">i</span><span className="text-[#F58220]">Delivery</span>
        </h2>
        <p className="mt-2 text-sm text-gray-600">
          Not a driver yet?{' '}
          <Router.Link to="/drivers/signup" className="font-bold text-[#F58220] hover:text-orange-600">
            Sign up here
          </Router.Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-xl shadow-gray-200/50 rounded-2xl sm:px-10 border border-gray-100">
          {error && (
            <div className="mb-4 bg-red-50 border-l-4 border-red-400 p-4 rounded text-xs text-red-700 font-medium">
              {error}
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSignIn}>
            <div>
              <label htmlFor="email" className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Email Address</label>
              <input
                id="email" name="email" type="email" required
                value={formData.email} onChange={handleChange}
                className="block w-full border border-gray-200 rounded-xl shadow-sm py-3 px-4 focus:outline-none focus:ring-2 focus:ring-[#F58220] focus:border-transparent transition-all"
                placeholder="driver@idelivery.co.za"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Password</label>
              <input
                id="password" name="password" type="password" required
                value={formData.password} onChange={handleChange}
                className="block w-full border border-gray-200 rounded-xl shadow-sm py-3 px-4 focus:outline-none focus:ring-2 focus:ring-[#F58220] focus:border-transparent transition-all"
                placeholder="••••••••"
              />
            </div>

            <div>
              <button
                type="submit" disabled={loading}
                className="w-full flex justify-center py-4 px-4 border border-transparent rounded-xl shadow-lg shadow-orange-100 text-base font-black text-white bg-[#F58220] hover:bg-orange-600 focus:outline-none transition-all active:scale-95 uppercase tracking-widest"
              >
                {loading ? 'Authenticating...' : 'Sign In'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SignIn;
