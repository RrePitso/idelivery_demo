
import React, { useState, useEffect } from 'react';
import { ref, onValue, query, orderByChild, limitToLast } from 'firebase/database';
import { db } from '../firebase';
import { handleIncomingBotMessage } from '../utils/whatsapp_bot';
import { ParcelRequest } from '../types';

const BotSimulator: React.FC = () => {
  const [phone, setPhone] = useState('0891234567');
  const [message, setMessage] = useState('');
  const [history, setHistory] = useState<{sender: string, text: string, time: number}[]>([]);
  const [activeRequests, setActiveRequests] = useState<ParcelRequest[]>([]);
  const [loading, setLoading] = useState(false);

  // Listen for latest parcel requests for visual feedback
  useEffect(() => {
    const q = query(ref(db, 'parcel_requests'), limitToLast(5));
    return onValue(q, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        setActiveRequests(Object.values(data).sort((a: any, b: any) => b.created_at - a.created_at) as ParcelRequest[]);
      }
    });
  }, []);

  const simulateIncoming = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    const msgText = message;
    const msgPhone = phone;
    
    setLoading(true);
    setHistory(prev => [...prev, { sender: 'User', text: msgText, time: Date.now() }]);
    setMessage('');

    try {
      await handleIncomingBotMessage(msgPhone, msgText);
      // Wait a bit to simulate processing delay
      setTimeout(() => setLoading(false), 500);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Chat Simulator */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden flex flex-col h-[600px]">
          <div className="bg-[#50B848] p-4 text-white flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center font-black">i</div>
              <div>
                <h2 className="font-bold text-sm leading-tight">iDelivery Bot Simulator</h2>
                <p className="text-[10px] opacity-80">Testing Parcel Flow</p>
              </div>
            </div>
          </div>

          <div className="flex-grow p-4 overflow-y-auto bg-[#e5ddd5] space-y-3">
            <div className="bg-blue-50 border border-blue-100 p-3 rounded-lg text-xs text-blue-700 text-center mb-4">
              Type <strong>"1"</strong> to start a new parcel request
            </div>
            
            {history.map((msg, i) => (
              <div key={i} className={`flex ${msg.sender === 'User' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] p-3 rounded-xl text-sm shadow-sm ${
                  msg.sender === 'User' 
                    ? 'bg-[#dcf8c6] text-gray-800 rounded-tr-none' 
                    : 'bg-white text-gray-800 rounded-tl-none'
                }`}>
                  <p className="whitespace-pre-wrap">{msg.text}</p>
                  <p className="text-[9px] text-gray-400 text-right mt-1">
                    {new Date(msg.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}
            
            {loading && (
              <div className="flex justify-start">
                <div className="bg-white p-3 rounded-xl text-sm shadow-sm flex space-x-1">
                  <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                  <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                </div>
              </div>
            )}
          </div>

          <form onSubmit={simulateIncoming} className="p-3 bg-gray-50 border-t flex space-x-2">
            <input 
              type="tel" 
              value={phone} 
              onChange={e => setPhone(e.target.value)}
              className="w-24 text-[10px] border border-gray-200 rounded-full px-2 outline-none focus:ring-1 focus:ring-[#50B848]"
              placeholder="Phone"
            />
            <input 
              type="text" 
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="Type message..." 
              className="flex-grow border border-gray-200 rounded-full px-4 py-2 text-sm outline-none focus:ring-1 focus:ring-[#50B848]"
            />
            <button 
              type="submit"
              className="bg-[#50B848] text-white p-2 rounded-full hover:bg-green-600 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </form>
        </div>

        {/* Database Live View */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
              <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse mr-2"></span>
              Live Database: Parcel Requests
            </h3>
            <div className="space-y-3">
              {activeRequests.map((req, i) => (
                <div key={i} className="p-3 rounded-xl bg-gray-50 border border-gray-100 text-xs">
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-bold text-[#F58220]">{req.customer_phone}</span>
                    <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-black text-[8px] uppercase">{req.status}</span>
                  </div>
                  <div className="space-y-1 text-gray-500">
                    <p><strong>Pickup:</strong> {req.pickup_location || '...'}</p>
                    <p><strong>Dropoff:</strong> {req.dropoff_location || '...'}</p>
                    <p><strong>Parcel:</strong> {req.parcel_description || '...'}</p>
                  </div>
                </div>
              ))}
              {activeRequests.length === 0 && <p className="text-gray-400 text-sm italic">No requests yet.</p>}
            </div>
          </div>
          
          <div className="bg-orange-50 p-4 rounded-2xl border border-orange-100 text-xs text-orange-800">
            <h4 className="font-bold mb-2 uppercase tracking-widest">Dev Note</h4>
            <p>This simulator calls <code>handleIncomingBotMessage</code> directly, mimicking an AiSensy Webhook POST request. It tracks state in the same Firebase Realtime DB used by the Driver Portal.</p>
          </div>
        </div>

      </div>
    </div>
  );
};

export default BotSimulator;
