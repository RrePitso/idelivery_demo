
import React, { useState, useEffect, createContext, useContext } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { ref, onValue } from 'firebase/database';
import { auth, db } from './firebase';
import { AuthState } from './types';

// Pages
import Landing from './pages/Landing';
import SignUp from './pages/SignUp';
import SignIn from './pages/SignIn';
import Dashboard from './pages/Dashboard';
import Confirmation from './pages/Confirmation';
import BotSimulator from './pages/BotSimulator';

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
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        const driverRef = ref(db, `drivers/${user.uid}`);
        onValue(driverRef, (snapshot) => {
          const data = snapshot.val();
          setState({
            user,
            loading: false,
            driverProfile: data,
          });
        });
      } else {
        setState({
          user: null,
          loading: false,
          driverProfile: null,
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

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { state } = useAuth();
  
  if (state.loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#50B848]"></div>
      </div>
    );
  }
  
  if (!state.user) {
    return <Navigate to="/drivers/signin" replace />;
  }
  
  return <>{children}</>;
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <HashRouter>
        <div className="min-h-screen flex flex-col">
          <Navbar />
          <main className="flex-grow">
            <Routes>
              <Route path="/" element={<Navigate to="/drivers" replace />} />
              <Route path="/drivers" element={<Landing />} />
              <Route path="/drivers/signup" element={<SignUp />} />
              <Route path="/drivers/signin" element={<SignIn />} />
              <Route path="/drivers/confirmation" element={<Confirmation />} />
              <Route path="/drivers/simulator" element={<BotSimulator />} />
              <Route 
                path="/drivers/dashboard" 
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                } 
              />
            </Routes>
          </main>
        </div>
      </HashRouter>
    </AuthProvider>
  );
};

export default App;
