
import React, { useState, useEffect, createContext, useContext } from 'react';
// Fix: Access react-router-dom members via namespaced import to resolve 'no exported member' issues
import * as Router from 'react-router-dom';
// Fix: Access firebase/auth members via namespaced import
import * as FirebaseAuth from 'firebase/auth';
import { ref, onValue, get } from 'firebase/database';
import { auth, db } from './firebase';
import { AuthState, DriverProfile, CustomerProfile, DriverStatus } from './types';

// Pages
import Landing from './pages/Landing';
import SignUp from './pages/SignUp';
import SignIn from './pages/SignIn';
import Dashboard from './pages/Dashboard';
import Confirmation from './pages/Confirmation';
import BotSimulator from './pages/BotSimulator';
import PlaceOrder from './pages/PlaceOrder';
import CustomerAuth from './pages/CustomerAuth';
import CustomerDashboard from './pages/CustomerDashboard';
import AdminDashboard from './pages/AdminDashboard';

// Components
import Navbar from './components/Navbar';

interface AuthContextType {
  state: AuthState;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AuthState>({
    user: null,
    loading: true,
    driverProfile: null,
    customerProfile: null,
    userType: null,
  });

  useEffect(() => {
    // Fix: use FirebaseAuth namespace
    const unsubscribe = FirebaseAuth.onAuthStateChanged(auth, async (user) => {
      if (user) {
        // 1. Check for Admin
        if (user.email === 'admin@idelivery.com') {
          setState({
            user,
            loading: false,
            driverProfile: null,
            customerProfile: null,
            userType: 'admin',
          });
          return;
        }

        // 2. Try to fetch driver profile
        const driverRef = ref(db, `drivers/${user.uid}`);
        const driverSnap = await get(driverRef);
        
        if (driverSnap.exists()) {
          onValue(driverRef, (snapshot) => {
            const data = snapshot.val();
            setState({
              user,
              loading: false,
              driverProfile: data,
              customerProfile: null,
              userType: 'driver',
            });
          });
          return;
        }

        // 3. Try to fetch customer profile
        const customerRef = ref(db, `customers/${user.uid}`);
        onValue(customerRef, (snapshot) => {
          const data = snapshot.val();
          setState({
            user,
            loading: false,
            driverProfile: null,
            customerProfile: data,
            userType: 'customer',
          });
        });
      } else {
        setState({
          user: null,
          loading: false,
          driverProfile: null,
          customerProfile: null,
          userType: null,
        });
      }
    });

    return () => unsubscribe();
  }, []);

  const signOut = async () => {
    await auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ state, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

const ProtectedRoute: React.FC<{ children: React.ReactNode, type?: 'driver' | 'customer' | 'admin' }> = ({ children, type }) => {
  const { state } = useAuth();
  
  if (state.loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#50B848]"></div>
      </div>
    );
  }
  
  if (!state.user) {
    return <Router.Navigate to={type === 'driver' ? "/drivers/signin" : type === 'admin' ? "/drivers/signin" : "/customer/auth"} replace />;
  }

  if (type && state.userType !== type) {
    return <Router.Navigate to="/" replace />;
  }
  
  return <>{children}</>;
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router.HashRouter>
        <div className="min-h-screen flex flex-col">
          <Navbar />
          <main className="flex-grow">
            <Router.Routes>
              <Router.Route path="/" element={<Landing />} />
              
              {/* Driver Routes */}
              <Router.Route path="/drivers" element={<Landing />} />
              <Router.Route path="/drivers/signup" element={<SignUp />} />
              <Router.Route path="/drivers/signin" element={<SignIn />} />
              <Router.Route path="/drivers/confirmation" element={<Confirmation />} />
              <Router.Route path="/drivers/simulator" element={<BotSimulator />} />
              <Router.Route 
                path="/drivers/dashboard" 
                element={
                  <ProtectedRoute type="driver">
                    <Dashboard />
                  </ProtectedRoute>
                } 
              />

              {/* Customer Routes */}
              <Router.Route path="/customer/auth" element={<CustomerAuth />} />
              <Router.Route 
                path="/customer/dashboard" 
                element={
                  <ProtectedRoute type="customer">
                    <CustomerDashboard />
                  </ProtectedRoute>
                } 
              />
              <Router.Route 
                path="/customer/order" 
                element={
                  <ProtectedRoute type="customer">
                    <PlaceOrder />
                  </ProtectedRoute>
                } 
              />

              {/* Admin Routes */}
              <Router.Route 
                path="/admin/dashboard" 
                element={
                  <ProtectedRoute type="admin">
                    <AdminDashboard />
                  </ProtectedRoute>
                } 
              />

              {/* Redirect legacy /order to authenticated flow */}
              <Router.Route path="/order" element={<Router.Navigate to="/customer/order" replace />} />
            </Router.Routes>
          </main>
        </div>
      </Router.HashRouter>
    </AuthProvider>
  );
};

export default App;
