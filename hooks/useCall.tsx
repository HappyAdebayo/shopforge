"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import { useAuth } from "./useAuth";
import { callService } from "@/lib/api/call";
import { vendorService } from "@/lib/api/vendor";
import {
  getSocket,
  joinVendorRoom,
  joinUserRoom,
  joinCallRoom,
  leaveCallRoom,
} from "@/lib/socket";
import type { Call } from "@/types";

export type CallUIStatus =
  | "idle"
  | "calling" // Outgoing call ringing
  | "incoming" // Vendor receiving incoming call
  | "connected" // Active ongoing call
  | "rejected" // Call declined
  | "ended"; // Call ended

interface CallContextType {
  activeCall: Call | null;
  incomingCall: Call | null;
  callStatus: CallUIStatus;
  callDuration: number;
  isMuted: boolean;
  isSpeaker: boolean;
  hearMyself: boolean;
  micLevel: number;
  isVideoEnabled: boolean;
  isRemoteVideoEnabled: boolean;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  otherPartyName: string;
  errorMessage: string | null;
  startCall: (vendorId: number, vendorName?: string) => Promise<void>;
  acceptIncomingCall: () => Promise<void>;
  rejectIncomingCall: () => Promise<void>;
  endActiveCall: () => Promise<void>;
  toggleMute: () => void;
  toggleSpeaker: () => void;
  toggleHearMyself: () => void;
  toggleVideo: () => Promise<void>;
  clearCallState: () => void;
}

const CallContext = createContext<CallContextType | undefined>(undefined);

const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" },
  ],
};

export const CallProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { user } = useAuth();
  const [activeCall, setActiveCall] = useState<Call | null>(null);
  const [incomingCall, setIncomingCall] = useState<Call | null>(null);
  const [callStatus, setCallStatus] = useState<CallUIStatus>("idle");
  const [callDuration, setCallDuration] = useState<number>(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeaker, setIsSpeaker] = useState(false);
  const [hearMyself, setHearMyself] = useState(false);
  const [micLevel, setMicLevel] = useState<number>(0);
  const [isVideoEnabled, setIsVideoEnabled] = useState(false);
  const [isRemoteVideoEnabled, setIsRemoteVideoEnabled] = useState(false);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [otherPartyName, setOtherPartyName] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const durationTimerRef = useRef<NodeJS.Timeout | null>(null);
  const resetTimerRef = useRef<NodeJS.Timeout | null>(null);

  // WebRTC & Audio Refs
  const localStreamRef = useRef<MediaStream | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const loopbackGainRef = useRef<GainNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Setup hidden audio element for remote WebRTC stream playback
  useEffect(() => {
    if (typeof window !== "undefined") {
      const audio = document.createElement("audio");
      audio.autoplay = true;
      audio.setAttribute("playsinline", "true");
      audio.style.display = "none";
      document.body.appendChild(audio);
      remoteAudioRef.current = audio;

      return () => {
        if (remoteAudioRef.current && remoteAudioRef.current.parentNode) {
          remoteAudioRef.current.parentNode.removeChild(remoteAudioRef.current);
        }
      };
    }
  }, []);

  // Stop local tracks and Web Audio nodes
  const cleanupMediaAndPeer = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }

    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    if (loopbackGainRef.current) {
      try {
        loopbackGainRef.current.disconnect();
      } catch (e) {
        console.warn("Loopback gain disconnect error:", e);
      }
      loopbackGainRef.current = null;
    }

    if (audioContextRef.current) {
      try {
        audioContextRef.current.close();
      } catch (e) {
        console.warn("AudioContext close error:", e);
      }
      audioContextRef.current = null;
    }

    if (remoteAudioRef.current) {
      remoteAudioRef.current.srcObject = null;
    }

    setLocalStream(null);
    setRemoteStream(null);
    setIsVideoEnabled(false);
    setIsRemoteVideoEnabled(false);
    setMicLevel(0);
  }, []);

  // Start microphone stream & local visualizer analysis
  const initLocalAudio = useCallback(async (): Promise<MediaStream | null> => {
    try {
      if (localStreamRef.current) {
        return localStreamRef.current;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        video: false,
      });

      localStreamRef.current = stream;
      setLocalStream(stream);

      // Web Audio API for Mic Metering & Sidetone (Hear Myself)
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        audioContextRef.current = ctx;

        const source = ctx.createMediaStreamSource(stream);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 256;
        source.connect(analyser);

        // Loopback / Sidetone gain node
        const loopbackGain = ctx.createGain();
        loopbackGain.gain.value = hearMyself ? 0.7 : 0;
        source.connect(loopbackGain);
        loopbackGain.connect(ctx.destination);
        loopbackGainRef.current = loopbackGain;

        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        const updateLevel = () => {
          analyser.getByteFrequencyData(dataArray);
          let sum = 0;
          for (let i = 0; i < dataArray.length; i++) {
            sum += dataArray[i];
          }
          const avg = sum / dataArray.length;
          const level = Math.min(100, Math.round((avg / 128) * 100));
          setMicLevel(level);
          animationFrameRef.current = requestAnimationFrame(updateLevel);
        };
        updateLevel();
      }

      return stream;
    } catch (err) {
      console.warn("[Media] Microphone access error:", err);
      return null;
    }
  }, [hearMyself]);

  // Adjust loopback gain when hearMyself changes
  useEffect(() => {
    if (loopbackGainRef.current && audioContextRef.current) {
      if (audioContextRef.current.state === "suspended") {
        audioContextRef.current.resume();
      }
      loopbackGainRef.current.gain.value = hearMyself ? 0.7 : 0;
    }
  }, [hearMyself]);

  // Create WebRTC Peer Connection
  const createPeerConnection = useCallback(
    (callId: number, stream: MediaStream | null): RTCPeerConnection => {
      if (peerConnectionRef.current) {
        return peerConnectionRef.current;
      }

      const socket = getSocket();
      const pc = new RTCPeerConnection(ICE_SERVERS);
      peerConnectionRef.current = pc;

      // Add local tracks
      if (stream) {
        stream.getTracks().forEach((track) => {
          pc.addTrack(track, stream);
        });
      }

      // Handle ICE candidates
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit("webrtc-signal", {
            callId,
            signal: { type: "candidate", candidate: event.candidate },
          });
        }
      };

      // Handle remote incoming tracks
      pc.ontrack = (event) => {
        console.log("[WebRTC] Received remote track:", event.track.kind);
        const rStream = event.streams[0];
        setRemoteStream(rStream);

        if (event.track.kind === "video") {
          setIsRemoteVideoEnabled(true);
        }

        if (remoteAudioRef.current && rStream) {
          remoteAudioRef.current.srcObject = rStream;
          remoteAudioRef.current
            .play()
            .catch((e) => console.warn("Remote audio play:", e));
        }
      };

      return pc;
    },
    []
  );

  // Toggle Video / Camera dynamically during a call
  const toggleVideo = async () => {
    const callId = activeCall?.id || incomingCall?.id;
    const socket = getSocket();

    if (!isVideoEnabled) {
      try {
        const videoStream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: "user",
          },
        });

        const videoTrack = videoStream.getVideoTracks()[0];
        if (!videoTrack) return;

        if (localStreamRef.current) {
          localStreamRef.current.addTrack(videoTrack);
        } else {
          localStreamRef.current = videoStream;
        }

        setLocalStream(new MediaStream(localStreamRef.current.getTracks()));
        setIsVideoEnabled(true);

        const pc = peerConnectionRef.current;
        if (pc && callId) {
          const senders = pc.getSenders();
          const videoSender = senders.find((s) => s.track?.kind === "video");

          if (videoSender) {
            await videoSender.replaceTrack(videoTrack);
          } else {
            pc.addTrack(videoTrack, localStreamRef.current);
          }

          // Renegotiate offer
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          socket.emit("webrtc-signal", {
            callId,
            signal: { type: "offer", sdp: offer },
          });
        }

        if (callId) {
          socket.emit("video-toggle", { callId, isVideoEnabled: true });
        }
      } catch (err) {
        console.warn("[Media] Camera access error:", err);
      }
    } else {
      // Disable camera
      if (localStreamRef.current) {
        const videoTracks = localStreamRef.current.getVideoTracks();
        videoTracks.forEach((t) => {
          t.stop();
          localStreamRef.current?.removeTrack(t);
        });
        setLocalStream(new MediaStream(localStreamRef.current.getTracks()));
      }

      setIsVideoEnabled(false);

      const pc = peerConnectionRef.current;
      if (pc && callId) {
        const senders = pc.getSenders();
        const videoSender = senders.find((s) => s.track?.kind === "video");
        if (videoSender) {
          pc.removeTrack(videoSender);
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          socket.emit("webrtc-signal", {
            callId,
            signal: { type: "offer", sdp: offer },
          });
        }
      }

      if (callId) {
        socket.emit("video-toggle", { callId, isVideoEnabled: false });
      }
    }
  };

  // Clear timers on unmount
  useEffect(() => {
    return () => {
      if (durationTimerRef.current) clearInterval(durationTimerRef.current);
      if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
      cleanupMediaAndPeer();
    };
  }, [cleanupMediaAndPeer]);

  const clearCallState = useCallback(() => {
    if (activeCall?.id) {
      leaveCallRoom(activeCall.id);
    }
    if (incomingCall?.id) {
      leaveCallRoom(incomingCall.id);
    }
    cleanupMediaAndPeer();
    setActiveCall(null);
    setIncomingCall(null);
    setCallStatus("idle");
    setCallDuration(0);
    setIsMuted(false);
    setIsSpeaker(false);
    setOtherPartyName("");
    setErrorMessage(null);
  }, [activeCall, incomingCall, cleanupMediaAndPeer]);

  // Duration timer when connected & Ringing timeout
  useEffect(() => {
    if (callStatus === "connected") {
      setCallDuration(0);
      durationTimerRef.current = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    } else {
      if (durationTimerRef.current) {
        clearInterval(durationTimerRef.current);
        durationTimerRef.current = null;
      }
    }

    if (callStatus === "calling") {
      const ringingTimer = setTimeout(() => {
        setErrorMessage("The vendor did not answer. Call timed out.");
        setCallStatus("ended");
        if (activeCall?.id) {
          callService.endCall(activeCall.id).catch(() => {});
        }
        resetTimerRef.current = setTimeout(() => {
          clearCallState();
        }, 3000);
      }, 40000);

      return () => clearTimeout(ringingTimer);
    }
  }, [callStatus, activeCall?.id, clearCallState]);

  // Connect socket and listen for rooms & events
  useEffect(() => {
    if (!user) return;

    const socket = getSocket();

    const joinRooms = () => {
      joinUserRoom(user.id);
      joinVendorRoom(user.id);
    };

    joinRooms();
    socket.on("connect", joinRooms);

    const handleIncomingCall = (data: {
      callId: number;
      callerId: number;
      vendorId: number;
      callerName?: string;
      vendorName?: string;
      status: string;
      createdAt?: string;
    }) => {
      console.log("[Call Hook] Received incoming-call:", data);
      setIncomingCall({
        id: data.callId,
        callerId: data.callerId,
        vendorId: data.vendorId,
        status: "ringing",
        createdAt: data.createdAt,
      });
      setOtherPartyName(data.callerName || `User #${data.callerId}`);
      setCallStatus("incoming");
      joinCallRoom(data.callId);
    };

    const handleCallAccepted = async (data: {
      callId: number;
      callerId: number;
      vendorId: number;
      callerName?: string;
      vendorName?: string;
      startedAt?: string;
    }) => {
      console.log("[Call Hook] Received call-accepted:", data);
      setCallStatus("connected");
      if (user.id === data.callerId && data.vendorName) {
        setOtherPartyName(data.vendorName);
      } else if (user.id === data.vendorId && data.callerName) {
        setOtherPartyName(data.callerName);
      }
      setActiveCall((prev) =>
        prev
          ? { ...prev, status: "accepted", startedAt: data.startedAt }
          : {
              id: data.callId,
              callerId: data.callerId,
              vendorId: data.vendorId,
              status: "accepted",
              startedAt: data.startedAt,
            }
      );

      // If we are the caller, initiate the WebRTC offer
      if (user.id === data.callerId) {
        try {
          const stream = await initLocalAudio();
          const pc = createPeerConnection(data.callId, stream);
          const offer = await pc.createOffer({
            offerToReceiveAudio: true,
            offerToReceiveVideo: true,
          });
          await pc.setLocalDescription(offer);
          socket.emit("webrtc-signal", {
            callId: data.callId,
            signal: { type: "offer", sdp: offer },
          });
        } catch (e) {
          console.warn("[WebRTC] Offer creation error:", e);
        }
      }
    };

    const handleWebRTCSignal = async ({
      callId,
      signal,
    }: {
      callId: number;
      signal: {
        type: "offer" | "answer" | "candidate";
        sdp?: RTCSessionDescriptionInit;
        candidate?: RTCIceCandidateInit;
      };
    }) => {
      console.log("[WebRTC] Received signal:", signal.type);
      try {
        let pc = peerConnectionRef.current;
        if (!pc) {
          const stream = await initLocalAudio();
          pc = createPeerConnection(callId, stream);
        }

        if (signal.type === "offer" && signal.sdp) {
          await pc.setRemoteDescription(new RTCSessionDescription(signal.sdp));
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          socket.emit("webrtc-signal", {
            callId,
            signal: { type: "answer", sdp: answer },
          });
        } else if (signal.type === "answer" && signal.sdp) {
          await pc.setRemoteDescription(new RTCSessionDescription(signal.sdp));
        } else if (signal.type === "candidate" && signal.candidate) {
          await pc.addIceCandidate(new RTCIceCandidate(signal.candidate));
        }
      } catch (e) {
        console.warn("[WebRTC] Signaling error:", e);
      }
    };

    const handleVideoToggle = ({
      isVideoEnabled: remoteVideoActive,
    }: {
      isVideoEnabled: boolean;
    }) => {
      console.log("[WebRTC] Remote video toggled:", remoteVideoActive);
      setIsRemoteVideoEnabled(remoteVideoActive);
    };

    const handleCallRejected = (data: { callId: number }) => {
      console.log("[Call Hook] Received call-rejected:", data);
      setCallStatus("rejected");
      setErrorMessage("The vendor declined the call.");
      resetTimerRef.current = setTimeout(() => {
        clearCallState();
      }, 3000);
    };

    const handleCallEnded = (data: { callId: number }) => {
      console.log("[Call Hook] Received call-ended:", data);
      setCallStatus("ended");
      resetTimerRef.current = setTimeout(() => {
        clearCallState();
      }, 2500);
    };

    socket.on("incoming-call", handleIncomingCall);
    socket.on("call-accepted", handleCallAccepted);
    socket.on("webrtc-signal", handleWebRTCSignal);
    socket.on("video-toggle", handleVideoToggle);
    socket.on("call-rejected", handleCallRejected);
    socket.on("call-ended", handleCallEnded);

    return () => {
      socket.off("connect", joinRooms);
      socket.off("incoming-call", handleIncomingCall);
      socket.off("call-accepted", handleCallAccepted);
      socket.off("webrtc-signal", handleWebRTCSignal);
      socket.off("video-toggle", handleVideoToggle);
      socket.off("call-rejected", handleCallRejected);
      socket.off("call-ended", handleCallEnded);
    };
  }, [user, clearCallState, initLocalAudio, createPeerConnection]);

  // Start outgoing call from customer to vendor
  const startCall = async (vendorId: number, vendorName?: string) => {
    if (!user) {
      setErrorMessage("Please log in to place a call.");
      return;
    }

    if (user.id === vendorId) {
      setErrorMessage("You cannot call your own store.");
      return;
    }

    const callerName = user.name || `User #${user.id}`;
    let targetVendorName = vendorName;

    if (!targetVendorName || targetVendorName.startsWith("Vendor #")) {
      try {
        const v = await vendorService.getVendorById(vendorId);
        if (v?.businessName) {
          targetVendorName = v.businessName;
        } else {
          const vu = await vendorService.getVendorByUserId(vendorId);
          if (vu?.businessName) {
            targetVendorName = vu.businessName;
          }
        }
      } catch {
        // ignore
      }
    }

    targetVendorName = targetVendorName || `Vendor #${vendorId}`;

    setErrorMessage(null);
    setOtherPartyName(targetVendorName);
    setCallStatus("calling");

    try {
      // Pre-warm local mic
      await initLocalAudio();
      const call = await callService.createCall(vendorId, {
        callerName,
        vendorName: targetVendorName,
      });
      setActiveCall(call);
      joinCallRoom(call.id);
    } catch (err: unknown) {
      let msg = "Failed to initiate call";
      if (err && typeof err === "object" && "response" in err) {
        const axiosErr = err as { response?: { data?: { message?: string } } };
        if (axiosErr.response?.data?.message) {
          msg = axiosErr.response.data.message;
        }
      } else if (err instanceof Error) {
        msg = err.message;
      }
      setErrorMessage(msg);
      setCallStatus("ended");
      resetTimerRef.current = setTimeout(() => {
        clearCallState();
      }, 3000);
    }
  };

  // Vendor accepts incoming call
  const acceptIncomingCall = async () => {
    if (!incomingCall) return;

    try {
      // Init microphone
      const stream = await initLocalAudio();
      createPeerConnection(incomingCall.id, stream);

      const updated = await callService.acceptCall(incomingCall.id);
      setActiveCall(updated);
      setIncomingCall(null);
      setCallStatus("connected");
      joinCallRoom(updated.id);
    } catch (err: unknown) {
      console.error("Error accepting call:", err);
      let msg = "Failed to accept call";
      if (err && typeof err === "object" && "response" in err) {
        const axiosErr = err as { response?: { data?: { message?: string } } };
        if (axiosErr.response?.data?.message) {
          msg = axiosErr.response.data.message;
        }
      }
      setErrorMessage(msg);
      clearCallState();
    }
  };

  // Vendor rejects incoming call
  const rejectIncomingCall = async () => {
    if (!incomingCall) return;

    try {
      await callService.rejectCall(incomingCall.id);
    } catch (err) {
      console.error("Error rejecting call:", err);
    } finally {
      clearCallState();
    }
  };

  // Either party ends active call
  const endActiveCall = async () => {
    const callId = activeCall?.id || incomingCall?.id;
    if (callId) {
      try {
        await callService.endCall(callId);
      } catch (err) {
        console.error("Error ending call:", err);
      }
    }
    setCallStatus("ended");
    resetTimerRef.current = setTimeout(() => {
      clearCallState();
    }, 1500);
  };

  const toggleMute = () => {
    setIsMuted((prev) => {
      const next = !prev;
      if (localStreamRef.current) {
        localStreamRef.current.getAudioTracks().forEach((track) => {
          track.enabled = !next;
        });
      }
      return next;
    });
  };

  const toggleSpeaker = () => {
    setIsSpeaker((prev) => {
      const next = !prev;
      if (remoteAudioRef.current) {
        remoteAudioRef.current.muted = next;
      }
      return next;
    });
  };

  const toggleHearMyself = () => {
    setHearMyself((prev) => !prev);
  };

  return (
    <CallContext.Provider
      value={{
        activeCall,
        incomingCall,
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
        startCall,
        acceptIncomingCall,
        rejectIncomingCall,
        endActiveCall,
        toggleMute,
        toggleSpeaker,
        toggleHearMyself,
        toggleVideo,
        clearCallState,
      }}
    >
      {children}
    </CallContext.Provider>
  );
};

export const useCall = (): CallContextType => {
  const context = useContext(CallContext);
  if (!context) {
    throw new Error("useCall must be used within a CallProvider");
  }
  return context;
};

