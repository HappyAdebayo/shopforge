"use client";

import React, { useRef, useEffect } from "react";
import {
  Phone,
  PhoneOff,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Video,
  VideoOff,
  Headphones,
  Store,
  User,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { useCall } from "@/hooks/useCall";

export default function ActiveCallModal() {
  const {
    activeCall,
    callStatus,
    callDuration,
    isMuted,
    isSpeaker,
    hearMyself,
    micLevel,
    isVideoEnabled,
    isRemoteVideoEnabled,
    localStream,
    remoteStream,
    otherPartyName,
    errorMessage,
    endActiveCall,
    toggleMute,
    toggleSpeaker,
    toggleHearMyself,
    toggleVideo,
  } = useCall();

  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);

  // Attach local video stream
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream, isVideoEnabled]);

  // Attach remote video stream
  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream, isRemoteVideoEnabled]);

  // Only render when outgoing, connected, or showing ended/declined feedback
  if (callStatus === "idle" || callStatus === "incoming") {
    return null;
  }

  const formatDuration = (secs: number) => {
    const m = Math.floor(secs / 60)
      .toString()
      .padStart(2, "0");
    const s = (secs % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const isRinging = callStatus === "calling";
  const isConnected = callStatus === "connected";
  const isDeclined = callStatus === "rejected";
  const isEnded = callStatus === "ended";
  const isVideoMode = isConnected && (isVideoEnabled || isRemoteVideoEnabled);

  // Calculate dynamic bar heights based on mic level
  const baseScale = isMuted ? 0 : Math.max(0.15, micLevel / 100);
  const barHeights = [
    Math.max(6, Math.round(18 * baseScale)),
    Math.max(10, Math.round(32 * baseScale)),
    Math.max(14, Math.round(42 * baseScale)),
    Math.max(18, Math.round(48 * baseScale)),
    Math.max(14, Math.round(40 * baseScale)),
    Math.max(10, Math.round(30 * baseScale)),
    Math.max(6, Math.round(16 * baseScale)),
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className={`bg-white rounded-3xl shadow-2xl border border-slate-200 w-full overflow-hidden relative transition-all duration-300 ${
          isVideoMode ? "max-w-2xl p-4 lg:p-6" : "max-w-sm p-6 text-center"
        }`}
      >
        {/* Background glow */}
        <div
          className={`absolute -top-10 left-1/2 -translate-x-1/2 w-48 h-48 rounded-full blur-3xl pointer-events-none ${
            isConnected
              ? "bg-emerald-400/20"
              : isDeclined || isEnded
              ? "bg-red-400/20"
              : "bg-indigo-400/20"
          }`}
        />

        {/* Video Mode Layout */}
        {isVideoMode ? (
          <div className="space-y-4">
            {/* Header info */}
            <div className="flex items-center justify-between px-2">
              <div>
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-200">
                  <Video size={12} /> Video Call Active
                </span>
                <h3 className="text-lg font-bold text-slate-800 mt-1">
                  {otherPartyName || "Call in progress"}
                </h3>
              </div>
              <div className="text-right">
                <span className="font-mono text-sm font-bold text-slate-700">
                  {formatDuration(callDuration)}
                </span>
                <div className="flex items-center gap-1 text-[11px] text-emerald-600 font-semibold justify-end">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  HD Live
                </div>
              </div>
            </div>

            {/* Video Viewport Area */}
            <div className="relative aspect-video bg-slate-950 rounded-2xl overflow-hidden shadow-inner flex items-center justify-center border border-slate-800">
              {/* Remote Video Stream */}
              {isRemoteVideoEnabled && remoteStream ? (
                <video
                  ref={remoteVideoRef}
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex flex-col items-center justify-center text-slate-400 gap-2">
                  <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center text-slate-300">
                    <User size={32} />
                  </div>
                  <p className="text-xs text-slate-400">
                    {otherPartyName} (Camera Off)
                  </p>
                </div>
              )}

              {/* Picture-in-Picture Local Self Video */}
              {isVideoEnabled && localStream && (
                <div className="absolute top-3 right-3 w-32 sm:w-40 aspect-video rounded-xl overflow-hidden shadow-2xl border-2 border-white/80 bg-slate-900 z-10">
                  <video
                    ref={localVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover scale-x-[-1]"
                  />
                  <div className="absolute bottom-1 left-1 bg-black/60 px-1.5 py-0.5 rounded text-[9px] text-white font-medium">
                    You
                  </div>
                </div>
              )}
            </div>

            {/* Controls Bar */}
            <div className="grid grid-cols-5 gap-2 pt-2">
              {/* Mute Mic */}
              <button
                onClick={toggleMute}
                className={`flex flex-col items-center justify-center gap-1 p-2.5 rounded-2xl border transition-all ${
                  isMuted
                    ? "bg-red-50 border-red-200 text-red-600 font-semibold"
                    : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                }`}
                title={isMuted ? "Unmute Mic" : "Mute Mic"}
              >
                {isMuted ? <MicOff size={18} /> : <Mic size={18} />}
                <span className="text-[10px]">{isMuted ? "Unmute" : "Mute"}</span>
              </button>

              {/* Camera / Video Toggle */}
              <button
                onClick={toggleVideo}
                className={`flex flex-col items-center justify-center gap-1 p-2.5 rounded-2xl border transition-all ${
                  isVideoEnabled
                    ? "bg-indigo-50 border-indigo-200 text-indigo-700 font-semibold ring-1 ring-indigo-400"
                    : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                }`}
                title={isVideoEnabled ? "Switch to Voice Only (Camera Off)" : "Turn Camera On"}
              >
                {isVideoEnabled ? <Video size={18} /> : <VideoOff size={18} />}
                <span className="text-[10px]">
                  {isVideoEnabled ? "Camera: ON" : "Camera: OFF"}
                </span>
              </button>

              {/* Speaker Toggle */}
              <button
                onClick={toggleSpeaker}
                className={`flex flex-col items-center justify-center gap-1 p-2.5 rounded-2xl border transition-all ${
                  isSpeaker
                    ? "bg-amber-50 border-amber-200 text-amber-700 font-semibold"
                    : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                }`}
                title={isSpeaker ? "Muted Speaker" : "Active Speaker"}
              >
                {isSpeaker ? <VolumeX size={18} /> : <Volume2 size={18} />}
                <span className="text-[10px]">{isSpeaker ? "Muted" : "Speaker"}</span>
              </button>

              {/* Hear Myself (Sidetone) */}
              <button
                onClick={toggleHearMyself}
                className={`flex flex-col items-center justify-center gap-1 p-2.5 rounded-2xl border transition-all ${
                  hearMyself
                    ? "bg-indigo-50 border-indigo-200 text-indigo-700 font-semibold ring-1 ring-indigo-400"
                    : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                }`}
                title="Hear your own voice in your headphones (Sidetone/Loopback)"
              >
                <Headphones size={18} />
                <span className="text-[10px]">
                  {hearMyself ? "Self Voice" : "Hear Myself"}
                </span>
              </button>

              {/* End Call */}
              <button
                onClick={endActiveCall}
                className="flex flex-col items-center justify-center gap-1 p-2.5 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-semibold text-xs transition-all shadow-md shadow-red-200 hover:scale-[1.02] active:scale-[0.98]"
              >
                <PhoneOff size={18} />
                <span className="text-[10px]">End Call</span>
              </button>
            </div>
          </div>
        ) : (
          /* Voice Call Mode Layout */
          <div>
            {/* Status Avatar & Indicator */}
            <div className="relative my-6 flex items-center justify-center">
              {isRinging && (
                <>
                  <div className="absolute w-24 h-24 rounded-full bg-indigo-100 animate-ping opacity-75" />
                  <div className="absolute w-20 h-20 rounded-full bg-indigo-200 animate-pulse" />
                </>
              )}

              {isConnected && (
                <div className="absolute w-24 h-24 rounded-full bg-emerald-100 animate-pulse" />
              )}

              <div
                className={`relative w-20 h-20 rounded-3xl flex items-center justify-center shadow-lg transition-colors ${
                  isConnected
                    ? "bg-emerald-600 text-white shadow-emerald-200"
                    : isDeclined || isEnded
                    ? "bg-slate-700 text-white shadow-slate-200"
                    : "bg-indigo-600 text-white shadow-indigo-200"
                }`}
              >
                {otherPartyName.toLowerCase().includes("vendor") ? (
                  <Store size={36} />
                ) : (
                  <User size={36} />
                )}
              </div>
            </div>

            {/* Title and Call Status */}
            <div className="space-y-1.5 mb-5">
              <h3 className="text-xl font-bold text-slate-800 tracking-tight">
                {otherPartyName || "Call in progress"}
              </h3>

              {isRinging && (
                <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-indigo-600">
                  <span className="inline-block w-2 h-2 rounded-full bg-indigo-600 animate-ping" />
                  Ringing {otherPartyName ? otherPartyName : "vendor"}...
                </div>
              )}

              {isConnected && (
                <div className="space-y-1">
                  <div className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                    <CheckCircle2 size={12} />
                    Live Voice Connected
                  </div>
                  <p className="text-2xl font-mono font-bold text-slate-800 tracking-wider">
                    {formatDuration(callDuration)}
                  </p>
                </div>
              )}

              {isDeclined && (
                <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-600 bg-red-50 px-3 py-1 rounded-full border border-red-200">
                  <AlertCircle size={14} />
                  {errorMessage || "Call Declined"}
                </div>
              )}

              {isEnded && (
                <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 bg-slate-100 px-3 py-1 rounded-full">
                  Call Ended
                </div>
              )}
            </div>

            {/* Live Microphone Audio Level Meter & Waveform */}
            {isConnected && (
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 mb-5">
                <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium mb-2">
                  <span className="flex items-center gap-1">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        isMuted
                          ? "bg-red-500"
                          : micLevel > 10
                          ? "bg-emerald-500 animate-pulse"
                          : "bg-slate-400"
                      }`}
                    />
                    {isMuted ? "Microphone Muted" : "Your Voice Activity"}
                  </span>
                  <span>{isMuted ? "Muted" : `${micLevel}%`}</span>
                </div>

                {/* Visualizer bars */}
                <div className="flex items-center justify-center gap-1.5 h-10">
                  {barHeights.map((h, idx) => (
                    <span
                      key={idx}
                      style={{ height: `${h}px` }}
                      className={`w-1.5 rounded-full transition-all duration-75 ${
                        isMuted
                          ? "bg-slate-300"
                          : micLevel > 15
                          ? "bg-emerald-500"
                          : "bg-indigo-400"
                      }`}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Interactive Controls when in active call */}
            {(isRinging || isConnected) && (
              <div className="space-y-3">
                {/* Audio & Video feature toggles */}
                {isConnected && (
                  <div className="grid grid-cols-4 gap-2 py-1">
                    {/* Mute Button */}
                    <button
                      onClick={toggleMute}
                      className={`flex flex-col items-center justify-center gap-1 p-2 rounded-2xl border transition-all ${
                        isMuted
                          ? "bg-red-50 border-red-200 text-red-600 font-semibold"
                          : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                      }`}
                      title={isMuted ? "Unmute Microphone" : "Mute Microphone"}
                    >
                      {isMuted ? <MicOff size={16} /> : <Mic size={16} />}
                      <span className="text-[9px]">{isMuted ? "Unmute" : "Mute"}</span>
                    </button>

                    {/* Switch to Video */}
                    <button
                      onClick={toggleVideo}
                      className="flex flex-col items-center justify-center gap-1 p-2 rounded-2xl border bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100 font-semibold transition-all shadow-sm"
                      title="Switch to Video Call (Turn Camera On)"
                    >
                      <Video size={16} />
                      <span className="text-[9px]">Start Video</span>
                    </button>

                    {/* Speaker Toggle */}
                    <button
                      onClick={toggleSpeaker}
                      className={`flex flex-col items-center justify-center gap-1 p-2 rounded-2xl border transition-all ${
                        isSpeaker
                          ? "bg-amber-50 border-amber-200 text-amber-700 font-semibold"
                          : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                      }`}
                      title={isSpeaker ? "Muted Speaker" : "Active Speaker"}
                    >
                      {isSpeaker ? <VolumeX size={16} /> : <Volume2 size={16} />}
                      <span className="text-[9px]">{isSpeaker ? "Muted" : "Speaker"}</span>
                    </button>

                    {/* Hear Myself (Sidetone) Toggle */}
                    <button
                      onClick={toggleHearMyself}
                      className={`flex flex-col items-center justify-center gap-1 p-2 rounded-2xl border transition-all ${
                        hearMyself
                          ? "bg-indigo-50 border-indigo-200 text-indigo-700 font-semibold ring-1 ring-indigo-400"
                          : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                      }`}
                      title="Hear your own voice in your headphones (Sidetone/Loopback)"
                    >
                      <Headphones size={16} />
                      <span className="text-[9px]">
                        {hearMyself ? "Self Voice" : "Hear Self"}
                      </span>
                    </button>
                  </div>
                )}

                {/* End / Cancel Call Button */}
                <button
                  onClick={endActiveCall}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-semibold text-sm transition-all shadow-md shadow-red-200 hover:scale-[1.02] active:scale-[0.98]"
                >
                  <PhoneOff size={18} />
                  {isRinging ? "Cancel Call" : "End Call"}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}


