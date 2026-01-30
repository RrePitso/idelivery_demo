
import React, { useState, useEffect, useRef } from 'react';
import { ref, onValue, query, orderByChild, limitToLast } from 'firebase/database';
import { db } from '../firebase';
import { handleIncomingBotMessage } from '../utils/whatsapp_bot';
import { ParcelRequest, ParcelStatus } from '../types';

const BotSimulator: React.FC = () => {
  const [phone, setPhone] = useState('0891234567');
  const [message, setMessage] = useState('');
  const [history, setHistory] = useState<{sender: string, text: string, time: number}[]>([]);
  const [activeRequests, setActiveRequests] = useState<(ParcelRequest & { id: string })[]>([]);
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history, loading]);

  // Listen for latest parcel requests for visual feedback
  useEffect(() => {
    const q = query(ref(db, 'parcel_requests'), limitToLast(10));
    return onValue(q, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const sorted = Object.keys(data)
          .map(key => ({ ...data[key], id: key }))
          .sort((a, b) => b.created_at - a.created_at);
        setActiveRequests(sorted as (ParcelRequest & { id: string })[]);
      } else {
        setActiveRequests([]);
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
      // Mimic backend processing of the webhook
      await handleIncomingBotMessage(msgPhone, msgText);
      
      // In a real environment, sendWhatsAppMessage would push back to AiSensy.
      // Here, we'll wait for the DB to update or just add a generic acknowledgement.
      // The "System" replies are handled inside handleIncomingBotMessage via mock fetch.
      // We manually add a "System Response" log entry to the simulator history 
      // by sniffing for changes or assuming the logic ran.
      
      setTimeout(() => setLoading(false), 800);
    } catch (err) {
      console.error("Simulator Error:", err);
      setLoading(false);
    }
  };

  const getStatusColor = (status: ParcelStatus) => {
    switch(status) {
      case ParcelStatus.READY_FOR_DRIVER_MATCHING: return 'bg-green-100 text-green-700 border-green-200';
      case ParcelStatus.CANCELLED: return 'bg-red-100 text-red-700 border-red-200';
      case ParcelStatus.COMPLETED: return 'bg-gray-100 text-gray-700 border-gray-200';
      default: return 'bg-blue-100 text-blue-700 border-blue-200';
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left: Chat Simulator */}
        <div className="lg:col-span-1 bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden flex flex-col h-[700px]">
          <div className="bg-[#075e54] p-4 text-white flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-xl font-bold italic">i</div>
            <div>
              <h2 className="font-bold text-sm">iDelivery WhatsApp</h2>
              <p className="text-[10px] text-green-200 flex items-center">
                <span className="w-1.5 h-1.5 bg-green-400 rounded-full mr-1"></span> Online
              </p>
            </div>
          </div>

          <div className="flex-grow p-4 overflow-y-auto bg-[#e5ddd5] space-y-3 scroll-smooth">
            <div className="bg-yellow-100 border border-yellow-200 p-3 rounded-xl text-[11px] text-yellow-800 text-center mb-4 shadow-sm">
              <p className="font-bold mb-1">Testing Instructions:</p>
              <ul className="text-left list-disc list-inside space-y-0.5 opacity-90">
                <li>Send any message to see the <strong>Welcome Template</strong>.</li>
                <li>Send <strong>"1"</strong> to start a parcel request.</li>
                <li>Follow prompts to complete the flow.</li>
              </ul>
            </div>
            
            {history.map((msg, i) => (
              <div key={i} className={`flex ${msg.sender === 'User' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] p-3 rounded-2xl text-[13px] shadow-sm relative ${
                  msg.sender === 'User' 
                    ? 'bg-[#dcf8c6] text-gray-800 rounded-tr-none ml-8' 
                    : 'bg-white text-gray-800 rounded-tl-none mr-8'
                }`}>
                  <p className="whitespace-pre-wrap leading-relaxed">{msg.text}</p>
                  <p className="text-[9px] text-gray-400 text-right mt-1.5 font-medium">
                    {new Date(msg.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}
            
            {loading && (
              <div className="flex justify-start">
                <div className="bg-white p-3 rounded-2xl text-sm shadow-sm flex space-x-1.5 items-center">
                  <div className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce"></div>
                  <div className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                  <div className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          <form onSubmit={simulateIncoming} className="p-3 bg-[#f0f0f0] border-t flex items-center space-x-2">
            <div className="flex flex-col space-y-1">
              <label className="text-[9px] font-black text-gray-400 uppercase px-1">Customer Phone</label>
              <input 
                type="tel" 
                value={phone} 
                onChange={e => setPhone(e.target.value)}
                className="w-28 text-xs border border-gray-200 rounded-lg px-2 py-1.5 outline-none focus:ring-1 focus:ring-[#50B848]"
                placeholder="089..."
              />
            </div>
            <div className="flex-grow relative">
              <input 
                type="text" 
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder="Type a message..." 
                className="w-full border-none rounded-full px-5 py-2.5 text-sm outline-none bg-white shadow-sm focus:ring-1 focus:ring-[#50B848]"
              />
            </div>
            <button 
              type="submit"
              disabled={loading}
              className="bg-[#128c7e] text-white p-3 rounded-full hover:bg-[#075e54] transition-all shadow-md active:scale-90 flex-shrink-0 disabled:bg-gray-400"
            >
              <svg className="w-5 h-5 transform rotate-90" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
              </svg>
            </button>
          </form>
        </div>

        {/* Right: Live Database Inspector */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black text-gray-900 flex items-center">
                <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse mr-3"></span>
                Realtime Data Monitor
              </h3>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest bg-gray-50 px-3 py-1 rounded-full border border-gray-100">
                Firebase RTDB /parcel_requests
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activeRequests.length > 0 ? activeRequests.map((req) => (
                <div key={req.id} className="group p-5 rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-md transition-all">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <span className="block text-xs font-black text-gray-400 uppercase tracking-tighter">Customer</span>
                      <span className="text-sm font-bold text-[#F58220]">{req.customer_phone}</span>
                    </div>
                    <div className={`px-3 py-1 rounded-full border text-[9px] font-black uppercase tracking-wider ${getStatusColor(req.status)}`}>
                      {req.status.replace(/_/g, ' ')}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 text-[11px] mb-4">
                    <div className="p-2 rounded-lg bg-gray-50 border border-gray-100">
                      <p className="font-bold text-gray-400 uppercase text-[8px] mb-1">📍 Pickup</p>
                      <p className="text-gray-700 line-clamp-1">{req.pickup_location || '—'}</p>
                    </div>
                    <div className="p-2 rounded-lg bg-gray-50 border border-gray-100">
                      <p className="font-bold text-gray-400 uppercase text-[8px] mb-1">🎯 Dropoff</p>
                      <p className="text-gray-700 line-clamp-1">{req.dropoff_location || '—'}</p>
                    </div>
                  </div>

                  <div className="p-2 rounded-lg bg-gray-50 border border-gray-100 mb-4">
                    <p className="font-bold text-gray-400 uppercase text-[8px] mb-1">📦 Description</p>
                    <p className="text-gray-700 italic text-[10px]">{req.parcel_description || 'Waiting for input...'}</p>
                  </div>

                  <div className="flex justify-between items-center pt-3 border-t border-gray-50 text-[9px] text-gray-400">
                    <span>ID: {req.id.substring(0, 8)}...</span>
                    <span>{new Date(req.created_at).toLocaleString()}</span>
                  </div>
                </div>
              )) : (
                <div className="col-span-full py-12 text-center">
                  <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-200">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" /></svg>
                  </div>
                  <p className="text-gray-400 font-medium italic">No parcel requests in database.</p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-[#fff9f0] p-6 rounded-3xl border border-orange-100">
            <h4 className="text-sm font-black text-orange-800 uppercase tracking-widest mb-3 flex items-center">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              Backend Logic Specs
            </h4>
            <div className="space-y-2 text-[11px] text-orange-700 leading-relaxed">
              <p>• <strong>Keyword "1":</strong> Triggers <code>startNewRequest()</code>, creating a clean record and initializing status to <code>COLLECTING_PICKUP</code>.</p>
              <p>• <strong>State Persistence:</strong> The user's progress is tracked strictly via the <code>status</code> field in Firebase. Each incoming message advances the state only if the current state expects input.</p>
              <p>• <strong>Deduplication:</strong> Only one active (non-completed) request is allowed per phone number. Sending "1" while another is active automatically cancels the previous one.</p>
              <p>• <strong>Session Messages:</strong> All bot replies use raw text (Session Messages), avoiding expensive templates once the conversation starts.</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default BotSimulator;
