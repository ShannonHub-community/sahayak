'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Radio, 
  WifiOff, 
  ShieldCheck, 
  Bluetooth, 
  Users, 
  MessageSquare, 
  Info,
  ExternalLink,
  Send,
  Loader2,
  RefreshCw,
  XCircle,
  CheckCircle2,
  AlertTriangle,
  User,
  PowerOff
} from 'lucide-react';
import { GovHeader } from '@/components/GovHeader';
import { useBleMesh, BlePeer } from '@/hooks/useBleMesh';

const EMERGENCY_QUICK_MESSAGES = [
  '🚨 SOS: Need immediate medical assistance!',
  '✅ We are safe and accounted for.',
  '💧 Need clean drinking water / rations.',
  '📍 What is the safest route to local NDRF shelter?'
];

export default function BleChatPage() {
  const { 
    isSupported, 
    isRegistered, 
    localPeer, 
    peers, 
    isScanning, 
    scanForPeers, 
    disconnectPeer,
    messages,
    sendMessage,
    clearMessages,
    error,
    clearError
  } = useBleMesh();

  const [activeChatPeer, setActiveChatPeer] = useState<BlePeer | null>(null);
  const [inputText, setInputText] = useState<string>('');
  const [isSending, setIsSending] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Keep activeChatPeer synchronized with peers state updates (e.g. disconnect events)
  const currentPeer = activeChatPeer 
    ? peers.find((p) => p.deviceId === activeChatPeer.deviceId) || activeChatPeer
    : null;

  // Auto-scroll to bottom of message thread
  useEffect(() => {
    if (activeChatPeer && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, activeChatPeer]);

  const handleScan = async () => {
    clearError();
    const foundPeer = await scanForPeers();
    if (foundPeer) {
      setActiveChatPeer(foundPeer);
    }
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!currentPeer || !inputText.trim() || isSending) return;

    const textToSend = inputText.trim();
    setInputText('');
    setIsSending(true);

    try {
      await sendMessage(currentPeer.deviceId, textToSend);
    } catch (err) {
      console.error('Failed to dispatch BLE packet:', err);
    } finally {
      setIsSending(false);
    }
  };

  const handleQuickSend = (text: string) => {
    setInputText(text);
  };

  return (
    <div className="min-h-screen bg-[#F4F6F8] flex flex-col font-sans text-slate-900">
      {/* National Portal Standard Header */}
      <GovHeader />

      {/* Main Content Area */}
      <main id="main-content" className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 flex flex-col">
        {/* Navigation Breadcrumb / Back Button */}
        <div className="mb-4 sm:mb-6 flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-[#0B3D6E] hover:text-[#07284B] bg-white border border-slate-300 hover:border-slate-400 px-3.5 py-1.5 rounded-sm shadow-sm transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Citizen Home / मुख्य पृष्ठ</span>
          </Link>

          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="font-mono">BLE GATT 0xFFE0</span>
          </div>
        </div>

        {/* Global Error Banner */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-sm p-4 text-xs text-red-800 flex items-start justify-between gap-3 shadow-sm">
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Bluetooth Notice:</span> {error}
              </div>
            </div>
            <button
              onClick={clearError}
              className="text-red-600 hover:text-red-900 font-bold ml-2"
              aria-label="Dismiss error"
            >
              <XCircle className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Page Header Banner */}
        <div className="bg-white border border-slate-200 rounded-sm shadow-sm p-4 sm:p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-[#0B3D6E]/10 rounded text-[#0B3D6E]">
                  <Radio className="w-6 h-6 text-[#0B3D6E]" />
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#07284B]">
                    Local Mesh Communications
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
                    Direct device-to-device chat via Web Bluetooth.
                  </p>
                </div>
              </div>
            </div>

            {/* Zero Internet Indicator */}
            <div className="flex items-center gap-2 bg-slate-100 border border-slate-300 px-3 py-1.5 rounded text-xs self-start sm:self-auto">
              <WifiOff className="w-4 h-4 text-amber-600 flex-shrink-0" />
              <div>
                <span className="font-semibold text-slate-800">Zero Internet Required</span>
                <span className="block text-[11px] text-slate-500">Decentralized P2P Mesh</span>
              </div>
            </div>
          </div>
        </div>

        {/* Diagnostics & Readiness Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {/* 1. Web Bluetooth Capability */}
          <div className="bg-white border border-slate-200 rounded-sm p-4 shadow-sm flex items-start gap-3">
            <div className={`p-2 rounded ${isSupported ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
              <Bluetooth className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                Web Bluetooth API
              </h2>
              <div className="mt-1 flex items-center gap-1.5">
                <span className={`inline-block w-2 h-2 rounded-full ${isSupported ? 'bg-emerald-500' : 'bg-red-500'}`} />
                <span className="text-sm font-semibold text-slate-900">
                  {isSupported ? 'Hardware Supported' : 'Unsupported Browser'}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                {isSupported 
                  ? 'Ready for peer-to-peer radio frequency discovery.' 
                  : 'Requires Chrome/Edge on Android or desktop.'}
              </p>
            </div>
          </div>

          {/* 2. Citizen Identity Gate */}
          <div className="bg-white border border-slate-200 rounded-sm p-4 shadow-sm flex items-start gap-3">
            <div className={`p-2 rounded ${isRegistered ? 'bg-blue-50 text-[#0B3D6E]' : 'bg-amber-50 text-amber-700'}`}>
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                Mesh Node Identity
              </h2>
              <div className="mt-1 flex items-center gap-1.5">
                <span className={`inline-block w-2 h-2 rounded-full ${isRegistered ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                <span className="text-sm font-semibold text-slate-900 truncate">
                  {isRegistered ? localPeer?.peerName : 'Profile Not Registered'}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1 truncate">
                {isRegistered ? `Peer ID: ${localPeer?.peerId}` : 'Register profile to broadcast identity.'}
              </p>
            </div>
          </div>

          {/* 3. Mesh Network Status */}
          <div className="bg-white border border-slate-200 rounded-sm p-4 shadow-sm flex items-start gap-3">
            <div className="p-2 bg-slate-100 text-slate-700 rounded">
              <Users className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                Mesh Topology
              </h2>
              <div className="mt-1 flex items-center gap-1.5">
                <span className={`inline-block w-2 h-2 rounded-full ${peers.some((p) => p.connected) ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                <span className="text-sm font-semibold text-slate-900">
                  {peers.filter((p) => p.connected).length} Connected Peers
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Direct RF radius: 30-50 meters line of sight.
              </p>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* VIEW 1: ACTIVE CHAT THREAD */}
        {/* ========================================================================= */}
        {currentPeer ? (
          <div className="bg-white border border-slate-200 rounded-sm shadow-sm flex flex-col flex-1 min-h-[480px]">
            {/* Sticky Ephemeral Disclaimer Banner */}
            <div className="bg-slate-100 border-b border-slate-200 px-4 py-2 text-[11px] sm:text-xs text-slate-600 flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 font-medium">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                <span>Direct Device-to-Device (Offline). Messages are ephemeral and not saved to any database.</span>
              </div>
              <span className="hidden sm:inline font-mono text-[10px] text-slate-500 uppercase">
                GATT Service 0xFFE0
              </span>
            </div>

            {/* Chat Thread Header */}
            <div className="p-3 sm:p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setActiveChatPeer(null)}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-[#0B3D6E] hover:text-[#07284B] bg-white border border-slate-300 px-2.5 py-1.5 rounded-sm shadow-sm transition-colors"
                  title="Return to Discovery Radar"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Radar</span>
                </button>

                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-[#0B3D6E]/10 flex items-center justify-center text-[#0B3D6E] font-bold text-xs">
                    <User className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-[#07284B] leading-tight">
                      {currentPeer.peerName}
                    </h2>
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-mono">
                      <span>ID: {currentPeer.peerId.length > 16 ? `${currentPeer.peerId.slice(0, 16)}...` : currentPeer.peerId}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Status and Disconnect */}
              <div className="flex items-center gap-2">
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-sm text-xs font-medium border ${
                    currentPeer.connected
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-red-50 text-red-700 border-red-200'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${currentPeer.connected ? 'bg-emerald-500' : 'bg-red-500'}`} />
                  <span>{currentPeer.connected ? 'Connected' : 'Disconnected'}</span>
                </span>

                {currentPeer.connected && (
                  <button
                    type="button"
                    onClick={() => disconnectPeer(currentPeer.deviceId)}
                    className="p-1.5 text-slate-500 hover:text-red-700 hover:bg-red-50 rounded border border-slate-200 transition-colors"
                    title="Disconnect Peer"
                  >
                    <PowerOff className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Message Area */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-[#FBFBFB] min-h-[260px] max-h-[420px]">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-500 space-y-2">
                  <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                    <MessageSquare className="w-5 h-5" />
                  </div>
                  <p className="text-xs font-semibold text-slate-700">
                    Encrypted mesh radio channel established
                  </p>
                  <p className="text-[11px] text-slate-500 max-w-sm">
                    Send a direct message below to communicate with {currentPeer.peerName} without internet connectivity.
                  </p>
                </div>
              ) : (
                messages.map((msg) => {
                  const isLocal = msg.senderId === (localPeer?.peerId || 'CITIZEN-LOCAL');
                  const timeFormatted = new Date(msg.timestamp).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  });

                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isLocal ? 'items-end' : 'items-start'}`}
                    >
                      <div className="text-[10px] text-slate-500 mb-1 px-1 flex items-center gap-1 font-mono">
                        <span>{isLocal ? 'You' : currentPeer.peerName}</span>
                        <span>•</span>
                        <span>{timeFormatted}</span>
                      </div>
                      <div
                        className={`max-w-[85%] sm:max-w-[70%] px-3.5 py-2.5 rounded-lg text-xs sm:text-sm shadow-sm leading-relaxed break-words ${
                          isLocal
                            ? 'bg-[#0B3D6E] text-white rounded-br-none'
                            : 'bg-slate-100 text-slate-800 border border-slate-200 rounded-bl-none'
                        }`}
                      >
                        {msg.text}
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Emergency Action Chips */}
            <div className="px-3 py-2 bg-slate-50 border-t border-slate-200 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              <span className="text-[10px] uppercase font-bold text-slate-500 flex-shrink-0">Quick SOS:</span>
              {EMERGENCY_QUICK_MESSAGES.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleQuickSend(preset)}
                  disabled={!currentPeer.connected}
                  className="text-[11px] bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded px-2 py-0.5 whitespace-nowrap transition-colors disabled:opacity-50"
                >
                  {preset}
                </button>
              ))}
            </div>

            {/* Message Input Form */}
            <form onSubmit={handleSendMessage} className="p-3 sm:p-4 border-t border-slate-200 bg-white">
              {!currentPeer.connected && (
                <div className="mb-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  <span>Peer disconnected. Return to Discovery Radar to reconnect.</span>
                </div>
              )}

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  disabled={!currentPeer.connected || isSending}
                  placeholder={
                    currentPeer.connected
                      ? `Type message to ${currentPeer.peerName}...`
                      : 'Connection lost. Please reconnect.'
                  }
                  className="flex-1 bg-slate-50 border border-slate-300 focus:border-[#0B3D6E] focus:bg-white focus:outline-none rounded-sm px-3 py-2 text-xs sm:text-sm text-slate-900 disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={!currentPeer.connected || !inputText.trim() || isSending}
                  className="inline-flex items-center justify-center gap-1.5 bg-[#0B3D6E] hover:bg-[#07284B] text-white font-semibold text-xs sm:text-sm px-4 py-2 rounded-sm shadow-sm transition-colors disabled:opacity-50"
                >
                  {isSending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span className="hidden sm:inline">Send</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        ) : (
          /* ========================================================================= */
          /* VIEW 2: DISCOVERY & RADAR PEER LIST */
          /* ========================================================================= */
          <div className="space-y-6">
            {/* Scan / Discovery Action Center */}
            <div className="bg-white border border-slate-200 rounded-sm shadow-sm p-6 sm:p-8 text-center">
              <div className="max-w-lg mx-auto space-y-4">
                {/* Radar Icon Animation */}
                <div className="relative w-16 h-16 mx-auto flex items-center justify-center">
                  {isScanning && (
                    <>
                      <span className="absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75 animate-ping"></span>
                      <span className="absolute inline-flex h-12 w-12 rounded-full bg-blue-300 opacity-50 animate-pulse"></span>
                    </>
                  )}
                  <div className="relative w-12 h-12 bg-[#0B3D6E] rounded-full flex items-center justify-center text-white shadow-sm">
                    {isScanning ? (
                      <Loader2 className="w-6 h-6 animate-spin" />
                    ) : (
                      <Radio className="w-6 h-6" />
                    )}
                  </div>
                </div>

                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-[#07284B]">
                    {isScanning ? 'Scanning Mesh Frequencies...' : 'BLE Mesh Offline Discovery'}
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed">
                    Broadcast and connect to nearby Sahayak nodes within 30-50m line of sight. No SIM card, cell towers, or WiFi needed.
                  </p>
                </div>

                {!isRegistered && (
                  <div className="bg-amber-50 border border-amber-200 rounded p-3 text-left flex items-start gap-2.5 text-xs text-amber-900">
                    <Info className="w-4 h-4 text-amber-700 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold">Notice:</span> For other devices to verify your name, complete pre-registration first.
                      <div className="mt-1">
                        <Link
                          href="/citizen/register"
                          className="inline-flex items-center gap-1 font-bold text-[#0B3D6E] underline hover:text-[#07284B]"
                        >
                          <span>Complete Pre-Registration</span>
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                      </div>
                    </div>
                  </div>
                )}

                {/* Primary Scan Button */}
                <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={handleScan}
                    disabled={isScanning || !isSupported}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#0B3D6E] hover:bg-[#07284B] text-white text-xs sm:text-sm font-semibold px-6 py-2.5 rounded-sm shadow-sm transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    {isScanning ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Scanning Bluetooth Frequencies...</span>
                      </>
                    ) : (
                      <>
                        <Radio className="w-4 h-4 text-emerald-400" />
                        <span>Scan for Nearby Users</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Verified Peers Section */}
            <div className="bg-white border border-slate-200 rounded-sm shadow-sm p-4 sm:p-6">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-[#0B3D6E]" />
                  <h2 className="text-sm font-bold text-[#07284B] uppercase tracking-wide">
                    Verified Sahayak Mesh Peers ({peers.length})
                  </h2>
                </div>
                {peers.length > 0 && (
                  <button
                    type="button"
                    onClick={handleScan}
                    disabled={isScanning}
                    className="inline-flex items-center gap-1 text-xs text-[#0B3D6E] hover:text-[#07284B] font-semibold"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin' : ''}`} />
                    <span>Scan Again</span>
                  </button>
                )}
              </div>

              {peers.length === 0 ? (
                <div className="text-center py-8 px-4 text-slate-500 space-y-2">
                  <div className="w-10 h-10 rounded-full bg-slate-100 mx-auto flex items-center justify-center text-slate-400">
                    <WifiOff className="w-5 h-5" />
                  </div>
                  <p className="text-xs sm:text-sm font-semibold text-slate-700">
                    No verified Sahayak peers found in Bluetooth range (30-50m).
                  </p>
                  <p className="text-[11px] text-slate-500 max-w-md mx-auto">
                    Ensure nearby devices have Bluetooth turned on and are running the Sahayak portal. Tap &quot;Scan for Nearby Users&quot; to initiate pairing.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {peers.map((peer) => (
                    <div
                      key={peer.deviceId}
                      onClick={() => setActiveChatPeer(peer)}
                      className={`p-3.5 rounded-sm border transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                        peer.connected
                          ? 'border-slate-200 hover:border-[#0B3D6E] bg-white hover:shadow-sm'
                          : 'border-slate-200 bg-slate-50 opacity-75'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-full bg-[#0B3D6E]/10 flex items-center justify-center text-[#0B3D6E] font-bold text-xs">
                            <User className="w-5 h-5" />
                          </div>
                          <div>
                            <h3 className="text-sm font-bold text-[#07284B] leading-tight">
                              {peer.peerName}
                            </h3>
                            <span className="text-[11px] text-slate-500 font-mono">
                              ID: {peer.peerId.length > 14 ? `${peer.peerId.slice(0, 14)}...` : peer.peerId}
                            </span>
                          </div>
                        </div>

                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                            peer.connected
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-slate-200 text-slate-700'
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${peer.connected ? 'bg-emerald-500' : 'bg-slate-500'}`} />
                          <span>{peer.connected ? 'Connected' : 'Offline'}</span>
                        </span>
                      </div>

                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                        <span className="text-[11px] text-slate-500">
                          {peer.connected ? 'Ready for direct messaging' : 'Tap to open chat thread'}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveChatPeer(peer);
                          }}
                          className="inline-flex items-center gap-1 bg-[#0B3D6E] hover:bg-[#07284B] text-white text-xs font-semibold px-3 py-1 rounded-sm shadow-sm transition-colors"
                        >
                          <MessageSquare className="w-3 h-3" />
                          <span>Open Chat</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Security & Protocol Notice */}
        <div className="mt-6 p-4 bg-slate-100 border border-slate-200 rounded-sm text-xs text-slate-600 flex items-start gap-3">
          <Info className="w-4 h-4 text-slate-500 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold text-slate-800">
              NDMA Direct Ephemeral Radio Mesh Standard (GATT Service 0xFFE0)
            </p>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              All peer-to-peer transmissions are ephemeral and held in device memory. No data is logged to central servers while in offline mesh mode.
            </p>
          </div>
        </div>
      </main>

      {/* Standard Footer */}
      <footer className="bg-[#07284B] text-white text-xs py-4 px-4 text-center mt-auto border-t border-blue-900">
        <p className="text-blue-200">
          Government of India • National Disaster Management Authority (NDMA) • BLE Mesh Comm Standard
        </p>
      </footer>
    </div>
  );
}
