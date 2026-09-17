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
  Info, 
  Loader2, 
  RefreshCw, 
  XCircle, 
  AlertTriangle 
} from 'lucide-react';
import { GovHeader } from '@/components/GovHeader';
import { useBleMesh } from '@/hooks/useBleMesh';

const EMERGENCY_QUICK_MESSAGES = [
  '🚨 MEDICAL PRIORITY 1: Immediate triage & cold-chain emergency.',
  '✅ SITREP: Group safe and accounted for at current coordinates.',
  '💧 SUPPLY REQ: Urgent clean drinking water & dry rations.',
  '📍 NAV REQ: Requesting passable high-ground route to shelter.',
];

export default function BleChatPage() {
  const { 
    isSupported, 
    isRegistered, 
    localPeer, 
    isDemoMode,
    toggleDemoMode,
    peers, 
    isScanning, 
    scanForPeers, 
    messages,
    sendMessage,
    clearMessages,
    error,
    clearError
  } = useBleMesh();

  const [inputText, setInputText] = useState<string>('');
  const [isSending, setIsSending] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll to bottom of broadcast message feed
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleScan = async () => {
    clearError();
    await scanForPeers();
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || isSending) return;

    const textToSend = inputText.trim();
    setInputText('');
    setIsSending(true);

    try {
      await sendMessage(textToSend);
    } catch (err) {
      console.error('Failed to dispatch BLE broadcast packet:', err);
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
        {/* UNIFIED OPEN MESH BROADCAST CHANNEL */}
        {/* ========================================================================= */}
        <div className="bg-white border border-slate-200 rounded-sm shadow-sm flex flex-col flex-1 min-h-[520px]">
          {/* Sticky Ephemeral Disclaimer Banner */}
          <div className="bg-slate-100 border-b border-slate-200 px-4 py-2 text-[11px] sm:text-xs text-slate-600 flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
              <span>Direct Device-to-Device Mesh (Offline). All packets broadcast to nearby nodes without central servers.</span>
            </div>
            <span className="hidden sm:inline font-mono text-[10px] text-slate-500 uppercase">
              GATT Service 0xFFE0 • Open Broadcast
            </span>
          </div>

          {/* Chat Window Header */}
          <div className="p-3 sm:p-4 border-b border-slate-200 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-[#0B3D6E]/10 flex items-center justify-center text-[#0B3D6E]">
                <Radio className="w-5 h-5 text-[#0B3D6E]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm sm:text-base font-bold text-[#07284B] leading-tight">
                    Sector Community Mesh (Open Broadcast)
                  </h2>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span>Open Channel</span>
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Disaster Sector 4 • Panvel Cluster • All nearby relay nodes receiving
                </p>
              </div>
            </div>

            {/* Right Header Action Cluster: Mode Toggle + Scan / Sync Nodes + Clear */}
            <div className="flex items-center gap-2 self-end sm:self-auto flex-wrap">
              {/* Mode Toggle Button */}
              <button
                type="button"
                onClick={() => toggleDemoMode()}
                title="Click to toggle between Zero-Hardware Mesh Simulation and Physical Web Bluetooth GATT Scanning"
                className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1.5 rounded border shadow-sm transition-all cursor-pointer ${
                  isDemoMode
                    ? 'bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-300'
                    : 'bg-blue-50 hover:bg-blue-100 text-blue-800 border-blue-400'
                }`}
              >
                <span>{isDemoMode ? '📡' : '⚡'}</span>
                <span className="hidden sm:inline">
                  {isDemoMode ? 'Mesh Simulation (Virtual)' : 'Physical BLE GATT (Web Bluetooth)'}
                </span>
                <span className="sm:hidden">
                  {isDemoMode ? 'Simulation' : 'Physical BLE'}
                </span>
              </button>

              <button
                type="button"
                onClick={handleScan}
                disabled={isScanning}
                className="inline-flex items-center gap-1.5 bg-white hover:bg-slate-100 text-[#0B3D6E] text-xs font-semibold px-3 py-1.5 rounded border border-slate-300 shadow-sm transition-colors disabled:opacity-50 cursor-pointer"
                title="Scan Bluetooth frequencies for nearby relay nodes"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin text-blue-600' : ''}`} />
                <span>{isScanning ? 'Scanning Mesh...' : 'Scan / Sync Nodes'}</span>
              </button>

              {messages.length > 0 && (
                <button
                  type="button"
                  onClick={clearMessages}
                  className="text-xs text-slate-500 hover:text-red-700 px-2.5 py-1.5 rounded hover:bg-red-50 border border-transparent hover:border-red-200 transition-colors"
                  title="Clear local broadcast feed"
                >
                  Clear Feed
                </button>
              )}
            </div>
          </div>

          {/* Active Relay Nodes Strip */}
          <div className="bg-slate-50/80 border-b border-slate-200 px-4 py-2 flex flex-wrap items-center gap-2 text-xs text-slate-600">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
              <Users className="w-3.5 h-3.5" />
              <span>Active Relay Nodes ({peers.filter((p) => p.connected).length}):</span>
            </span>
            {peers.map((peer) => (
              <span
                key={peer.deviceId}
                className="inline-flex items-center gap-1.5 bg-white border border-slate-200 px-2.5 py-0.5 rounded-full text-[11px] text-slate-700 shadow-2xs"
              >
                <span className={`w-1.5 h-1.5 rounded-full ${peer.connected ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                <span className="font-medium">{peer.peerName}</span>
              </span>
            ))}
          </div>

          {/* Scanning Progress Notification Banner */}
          {isScanning && (
            <div className="bg-blue-50 border-b border-blue-200 px-4 py-2 text-xs text-blue-800 flex items-center gap-2 animate-pulse">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-[#0B3D6E]" />
              <span>Scanning 2.4 GHz Bluetooth mesh frequencies for nearby relay nodes (30-50m line of sight)...</span>
            </div>
          )}

          {/* Message Area */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-[#FBFBFB] min-h-[280px] max-h-[460px]">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-500 space-y-2">
                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-[#0B3D6E]">
                  <Radio className="w-6 h-6" />
                </div>
                <p className="text-sm font-bold text-slate-800">
                  Sector Community Mesh Channel Active
                </p>
                <p className="text-xs text-slate-500 max-w-md">
                  Broadcast emergency situations, resource queries, or safe status updates. Packets hop across all local nodes within 30-50m line of sight.
                </p>
              </div>
            ) : (
              messages.map((msg) => {
                const isLocal =
                  msg.senderId === (localPeer?.peerId || 'CITIZEN-LOCAL') ||
                  msg.senderId === 'CIT-LOCAL' ||
                  msg.senderName === 'You (Local Node)';

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
                      {isLocal ? (
                        <span className="text-emerald-700 font-bold">You (Local Node) • Broadcasted</span>
                      ) : (
                        <span className="text-[#0B3D6E] font-bold">
                          {msg.senderName || 'Rahul (Relay Node - 15m away)'}
                        </span>
                      )}
                      <span>•</span>
                      <span>{timeFormatted}</span>
                      {msg.isAmbient && (
                        <span className="text-[9px] text-amber-600 italic font-normal ml-0.5">[auto-bulletin]</span>
                      )}
                    </div>
                    <div
                      className={`max-w-[85%] sm:max-w-[75%] px-3.5 py-2.5 rounded-lg text-xs sm:text-sm shadow-sm leading-relaxed break-words ${
                        isLocal
                          ? 'bg-[#0B3D6E] text-white rounded-br-none'
                          : 'bg-slate-100 text-slate-800 border border-slate-200 rounded-bl-none'
                      }`}
                    >
                      {msg.text}
                    </div>
                    {/* Micro-telemetry pill row — only for incoming mesh packets */}
                    {!isLocal && (
                      <div className="text-[10px] text-slate-400 font-mono flex items-center gap-2 mt-1 px-1">
                        <span>Hops: {msg.hops ?? 1}</span>
                        <span className="text-slate-300">•</span>
                        <span>RSSI: {msg.rssi ?? -72} dBm</span>
                        <span className="text-slate-300">•</span>
                        <span>Node Bat: {msg.batteryLevel ?? 80}%</span>
                      </div>
                    )}
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
                className="text-[11px] bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded px-2.5 py-1 whitespace-nowrap transition-colors cursor-pointer"
              >
                {preset}
              </button>
            ))}
          </div>

          {/* Message Input Form */}
          <form onSubmit={handleSendMessage} className="p-3 sm:p-4 border-t border-slate-200 bg-white">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                disabled={isSending}
                placeholder="Broadcast message to Sector Community Mesh..."
                className="flex-1 bg-slate-50 border border-slate-300 focus:border-[#0B3D6E] focus:bg-white focus:outline-none rounded-sm px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={!inputText.trim() || isSending}
                className="inline-flex items-center justify-center gap-1.5 bg-[#0B3D6E] hover:bg-[#07284B] text-white font-semibold text-xs sm:text-sm px-5 py-2.5 rounded-sm shadow-sm transition-colors disabled:opacity-50 cursor-pointer"
              >
                {isSending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Radio className="w-4 h-4 text-emerald-400" />
                    <span>Broadcast</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

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
