"use client";

import React from "react";
import { Phone, PhoneOff, Store, User } from "lucide-react";
import { useCall } from "@/hooks/useCall";

export default function IncomingCallModal() {
  const {
    incomingCall,
    callStatus,
    otherPartyName,
    acceptIncomingCall,
    rejectIncomingCall,
  } = useCall();

  if (callStatus !== "incoming" || !incomingCall) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-sm w-full p-6 text-center overflow-hidden relative">
        {/* Decorative background glow */}
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-40 h-40 bg-emerald-400/20 rounded-full blur-3xl pointer-events-none" />

        {/* Ringing pulsing animation */}
        <div className="relative my-6 flex items-center justify-center">
          <div className="absolute w-24 h-24 rounded-full bg-emerald-100 animate-ping opacity-75" />
          <div className="absolute w-20 h-20 rounded-full bg-emerald-200 animate-pulse" />
          <div className="relative w-16 h-16 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-200">
            <Phone size={28} className="animate-bounce" />
          </div>
        </div>

        {/* Call Info */}
        <div className="space-y-1 mb-6">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase tracking-wider">
            Incoming Voice Call
          </span>
          <h3 className="text-xl font-bold text-slate-800 pt-2">
            {otherPartyName || `Customer #${incomingCall.callerId}`}
          </h3>
          <p className="text-xs text-slate-500">
            Customer is calling regarding your store products
          </p>
        </div>

        {/* Caller Avatar Card */}
        <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-100 mb-6 flex items-center gap-3 text-left">
          <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm">
            <User size={18} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-slate-400">Customer</p>
            <p className="text-sm font-semibold text-slate-800 truncate">
              {otherPartyName || `Customer #${incomingCall.callerId}`}
            </p>
          </div>
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
        </div>

        {/* Actions: Decline & Accept */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={rejectIncomingCall}
            className="flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-red-50 hover:bg-red-100 text-red-600 font-semibold text-sm transition-all border border-red-200 hover:scale-[1.02] active:scale-[0.98]"
          >
            <PhoneOff size={18} />
            Decline
          </button>
          <button
            onClick={acceptIncomingCall}
            className="flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm transition-all shadow-md shadow-emerald-200 hover:scale-[1.02] active:scale-[0.98]"
          >
            <Phone size={18} />
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}
