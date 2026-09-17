import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Sahayak Mesh Custom 128-bit Bluetooth GATT UUIDs
 */
export const SAHAYAK_SERVICE_UUID = '0000ffe0-0000-1000-8000-00805f9b34fb';
export const PEER_ID_CHAR_UUID = '0000ffe1-0000-1000-8000-00805f9b34fb';
export const CHAT_MESSAGE_CHAR_UUID = '0000ffe2-0000-1000-8000-00805f9b34fb';

const STORAGE_KEY_CACHED_PROFILE = 'sahayak_cached_citizen_profile';

// ============================================================================
// AMBIENT TYPES FOR WEB BLUETOOTH API
// ============================================================================

interface BluetoothCharacteristic {
  uuid: string;
  readValue: () => Promise<DataView>;
  writeValue?: (value: BufferSource) => Promise<void>;
  writeValueWithResponse?: (value: BufferSource) => Promise<void>;
  writeValueWithoutResponse?: (value: BufferSource) => Promise<void>;
  startNotifications?: () => Promise<BluetoothCharacteristic>;
  addEventListener?: (type: string, listener: (event: Event) => void) => void;
  removeEventListener?: (type: string, listener: (event: Event) => void) => void;
}

interface BluetoothGattService {
  uuid: string;
  getCharacteristic: (characteristic: string) => Promise<BluetoothCharacteristic>;
}

interface BluetoothGattServer {
  connected: boolean;
  connect: () => Promise<BluetoothGattServer>;
  disconnect: () => void;
  getPrimaryService: (service: string) => Promise<BluetoothGattService>;
}

interface BluetoothDeviceInstance extends EventTarget {
  id: string;
  name?: string;
  gatt?: BluetoothGattServer;
  addEventListener: (type: string, listener: (event: Event) => void) => void;
  removeEventListener: (type: string, listener: (event: Event) => void) => void;
}

interface BluetoothRequestDeviceOptions {
  filters?: Array<{
    name?: string;
    namePrefix?: string;
    services?: string[];
  }>;
  optionalServices?: string[];
  acceptAllDevices?: boolean;
}

interface WebBluetoothAPI {
  requestDevice: (options?: BluetoothRequestDeviceOptions) => Promise<BluetoothDeviceInstance>;
  getAvailability?: () => Promise<boolean>;
}

// ============================================================================
// PUBLIC MESH DATA INTERFACES
// ============================================================================

export interface BlePeer {
  deviceId: string;
  peerId: string;
  peerName: string;
  connected: boolean;
}

export interface BleChatMessage {
  id: string;
  senderId: string;
  senderName?: string;
  text: string;
  timestamp: string;
  // Mesh radio telemetry metadata
  hops?: number;         // Simulated packet hop count (1–3)
  rssi?: number;         // Received signal strength in dBm (e.g. -65 to -85)
  batteryLevel?: number; // Transmitting node battery % (e.g. 60–95)
  isAmbient?: boolean;   // True for unsolicited ambient bulletins
}

export interface LocalPeerProfile {
  peerId: string;
  peerName: string;
  citizenId?: string;
  phone?: string;
}

export interface UseBleMeshReturn {
  // Platform capability & identity gate
  isSupported: boolean;
  isRegistered: boolean;
  localPeer: LocalPeerProfile | null;

  // Dual-mode Control (Real Web Bluetooth vs Simulated Pitch Mode)
  isDemoMode: boolean;
  toggleDemoMode: (enable?: boolean) => void;

  // Peer state & scanning
  peers: BlePeer[];
  isScanning: boolean;
  scanForPeers: () => Promise<BlePeer | null>;
  disconnectPeer: (deviceId: string) => void;

  // Ephemeral messaging (single unified broadcast feed)
  messages: BleChatMessage[];
  sendMessage: (text: string, targetDeviceId?: string) => Promise<boolean>;
  clearMessages: () => void;

  // Diagnostics & Status
  error: string | null;
  clearError: () => void;
}

// ============================================================================
// DEMO MODE CONSTANTS
// ============================================================================

const DEFAULT_LOCAL_PEER: LocalPeerProfile = {
  peerId: 'CIT-LOCAL',
  peerName: 'My Device (Demo)',
  citizenId: 'CIT-DEMO-001',
};

const MOCK_PEERS: BlePeer[] = [
  {
    deviceId: 'dev-demo-8831',
    peerId: 'CIT-DEMO-8831',
    peerName: 'Rahul (Relay Node - 15m away)',
    connected: true,
  },
  {
    deviceId: 'dev-demo-9942',
    peerId: 'CIT-DEMO-9942',
    peerName: 'Priya (Shelter Coordinator - 40m away)',
    connected: true,
  },
];

// ============================================================================
// AMBIENT SITUATIONAL BULLETIN POOL
// Unsolicited background transmissions injected into the mesh broadcast feed.
// ============================================================================

const AMBIENT_BULLETINS: Array<{ senderId: string; senderName: string; text: string }> = [
  {
    senderId: 'CIT-DEMO-9942',
    senderName: 'Priya (Shelter Coordinator - 40m away)',
    text: 'BULLETIN: NDMA relief truck reached Sector 4 primary school junction with water packets and ORS sachets. Estimated distribution start: 20 minutes.',
  },
  {
    senderId: 'CIT-DEMO-8831',
    senderName: 'Rahul (Relay Node - 15m away)',
    text: 'BULLETIN: Culvert water level receded by 15 cm along the elevated rail approach. Confirmed safe for pedestrian crossing. Avoid ground-level underpass.',
  },
  {
    senderId: 'CIT-RELAY-0004',
    senderName: 'Relief Boat 04 (Mobile Node)',
    text: 'BULLETIN: Mobile patrol active along sector perimeter. Flash high-contrast cloth or phone flashlight if stranded on rooftop. We are scanning rooftop signatures.',
  },
  {
    senderId: 'CIT-DEMO-9942',
    senderName: 'Priya (Shelter Coordinator - 40m away)',
    text: 'BULLETIN: Municipal High School shelter at capacity. Overflow relief point active at Pillai Engineering College ground floor. 47 persons currently sheltered.',
  },
  {
    senderId: 'CIT-DEMO-8831',
    senderName: 'Rahul (Relay Node - 15m away)',
    text: 'BULLETIN: NDRF rope-rescue team deployed at Sector 4 substation crossroads. If within 300m, broadcast SOS on this channel immediately for priority extraction.',
  },
  {
    senderId: 'CIT-RELAY-0004',
    senderName: 'Relief Boat 04 (Mobile Node)',
    text: 'BULLETIN: Power grid in sub-zone 4B still offline. Do not attempt to restart main MCBs until MSEDCL crew gives all-clear. ETA 3-4 hours.',
  },
];

// Helper: generate realistic mesh telemetry for incoming packets
function generateTelemetry(): { hops: number; rssi: number; batteryLevel: number } {
  return {
    hops: 1 + Math.floor(Math.random() * 3),              // 1 to 3
    rssi: -(65 + Math.floor(Math.random() * 21)),          // -65 to -85 dBm
    batteryLevel: 60 + Math.floor(Math.random() * 36),    // 60% to 95%
  };
}

// ============================================================================
// CONTEXT-AWARE MOCK RESPONSES FOR DISASTER BLE MESH CHAT
// ============================================================================

// 1. Immediate Medical Emergency
const MOCK_REPLIES_MEDICAL = [
  'Got it — how many people need help? I will relay this urgent medical distress to the next mesh node right now.',
  'Understood, copying your medical emergency. Keep the patient stationary and warm. Relaying alert to the local triage node.',
  'Received loud and clear. Forwarding your medical distress packet through the node chain. Try to apply direct pressure if there is bleeding.',
  'Copy that, medical distress noted. I am broadcasting this with high-priority flag across our BLE cluster. Hang tight.',
];

// 2. Safe & Accounted For
const MOCK_REPLIES_SAFE = [
  'Good to hear you are safe. Are you staying put or moving toward one of the designated shelters?',
  'Copy that, relieved to hear it. Conserve your device battery and stay on higher ground if waters are still rising.',
  'Understood and logged into our peer table. Glad your group is accounted for. Broadcast an update if your status changes.',
  'Acknowledged. Great news. We have 3 others sheltered here on the 2nd floor, all accounted for as well.',
];

// 3. Clean Water & Rations
const MOCK_REPLIES_RATIONS = [
  'Noted, passing this request for water and rations to the relief coordinator through the mesh. ETA depends on node hop count.',
  'Copy that. A volunteer boat dropped clean water packets near the station junction earlier. Relaying your need to that sector.',
  'Received. Adding your location and supply request to the packet queue for the NDRF distribution team.',
  'Understood. Boil any available water if you can until the relief supply packets make it through our sector.',
];

// 4. Safest Route & NDRF Shelter
const MOCK_REPLIES_ROUTE = [
  'Head toward higher ground via the main bypass. Avoid the river road — peers confirmed it flooded 30 minutes ago.',
  'The nearest active shelter is at Pillai College. Take Station Road along the elevated walkway; underpasses are completely submerged.',
  'Copy that. Move towards the High School relief camp on the eastern ridge. Sector 4 was reported clear of fallen debris.',
  'Avoid Shivaji Chowk due to waterlogging. Take the elevated flyover approach towards the municipal relief staging area.',
];

// 5. Radio / Mesh / Battery Status
const MOCK_REPLIES_RADIO = [
  'Mesh link is solid. Conserve your battery by lowering screen brightness — messages will queue and sync over BLE automatically.',
  'Signal strength across our node hop is holding steady. I am keeping this device in low-power broadcast mode.',
  'Copy that. We are acting as a relay bridge between your sector and the main camp. Keep this channel open.',
];

// 6. Greetings & Connection Check
const MOCK_REPLIES_GREETING = [
  'Hello, receiving you loud and clear over local mesh radio. All cellular towers are down in Panvel. How is your area holding up?',
  'Mesh connection confirmed! Our devices are connected peer-to-peer over Bluetooth. What is your current situation?',
  'Loud and clear. Local mesh channel is active. Broadcast your status or let me know if you need assistance relayed.',
];

// 7. Varied Natural Fallback Responses for Unmatched Free Text
const MOCK_REPLIES_FALLBACK = [
  'Message received and acknowledged over mesh. Passing the packet along the node chain to keep the network updated.',
  'Copy that. We have line-of-sight BLE connection. Let me know if you need medical relay, supplies, or shelter directions.',
  'Received loud and clear. I am monitoring this frequency from our shelter point. Stay safe.',
  'Understood. Radio link is holding strong. Let us keep transmissions concise to conserve node battery.',
  'Noted and stored in local mesh cache. Will rebroadcast to the next node as soon as another device comes within range.',
];

function selectNextReply(category: string, pool: string[], indexMap: Record<string, number>): string {
  const currentIndex = indexMap[category] ?? 0;
  const reply = pool[currentIndex % pool.length];
  indexMap[category] = currentIndex + 1;
  return reply;
}

export function generateContextualPeerReply(incomingText: string, indexMap: Record<string, number>): string {
  const lower = incomingText.toLowerCase();

  // 1. Immediate Medical Emergency
  if (
    lower.includes('medical') || 
    lower.includes('immediate') || 
    lower.includes('doctor') || 
    lower.includes('first aid') || 
    lower.includes('injury') || 
    lower.includes('injured') || 
    lower.includes('bleeding') || 
    lower.includes('ambulance') || 
    lower.includes('patient') ||
    lower.includes('sos:')
  ) {
    return selectNextReply('medical', MOCK_REPLIES_MEDICAL, indexMap);
  }

  // 2. Safe & Accounted for
  if (
    lower.includes('safe') || 
    lower.includes('accounted') || 
    lower.includes('all good') || 
    lower.includes('okay') || 
    lower.includes('survived') || 
    lower.includes('fine')
  ) {
    return selectNextReply('safe', MOCK_REPLIES_SAFE, indexMap);
  }

  // 3. Water & Rations
  if (
    lower.includes('water') || 
    lower.includes('ration') || 
    lower.includes('food') || 
    lower.includes('drink') || 
    lower.includes('supplies') || 
    lower.includes('hunger') ||
    lower.includes('starving')
  ) {
    return selectNextReply('rations', MOCK_REPLIES_RATIONS, indexMap);
  }

  // 4. Safest Route & Shelter
  if (
    lower.includes('route') || 
    lower.includes('shelter') || 
    lower.includes('ndrf') || 
    lower.includes('road') || 
    lower.includes('flood') || 
    lower.includes('direction') || 
    lower.includes('where to go') || 
    lower.includes('bridge') || 
    lower.includes('way') ||
    lower.includes('safest')
  ) {
    return selectNextReply('route', MOCK_REPLIES_ROUTE, indexMap);
  }

  // 5. Battery / Radio / Signal
  if (
    lower.includes('battery') || 
    lower.includes('charge') || 
    lower.includes('radio') || 
    lower.includes('signal') || 
    lower.includes('power') ||
    lower.includes('mesh')
  ) {
    return selectNextReply('radio', MOCK_REPLIES_RADIO, indexMap);
  }

  // 6. Greetings / Check-in
  if (
    lower.includes('hello') || 
    lower.includes('hi ') || 
    lower === 'hi' ||
    lower.includes('hey') || 
    lower.includes('test') || 
    lower.includes('ping') || 
    lower.includes('anyone')
  ) {
    return selectNextReply('greeting', MOCK_REPLIES_GREETING, indexMap);
  }

  // 7. Varied natural disaster mesh fallbacks
  return selectNextReply('fallback', MOCK_REPLIES_FALLBACK, indexMap);
}

/**
 * Safely access the browser's Web Bluetooth API
 */
function getBluetoothApi(): WebBluetoothAPI | null {
  if (typeof navigator !== 'undefined' && 'bluetooth' in navigator) {
    return (navigator as unknown as { bluetooth: WebBluetoothAPI }).bluetooth;
  }
  return null;
}

/**
 * Parse local profile from offline storage
 */
function parseLocalProfile(): LocalPeerProfile | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CACHED_PROFILE);
    if (!raw) return null;
    const profile = JSON.parse(raw);

    const peerId = profile.ble_peer_id || profile.citizen_id || '';
    const peerName = (profile.name || '').trim() || 'Sahayak Citizen';

    if (!peerId) {
      return null;
    }

    return {
      peerId,
      peerName,
      citizenId: profile.citizen_id,
      phone: profile.phone,
    };
  } catch (err) {
    console.debug('Error reading citizen profile from localStorage:', err);
    return null;
  }
}

/**
 * Hook for managing Web Bluetooth Mesh peer discovery and ephemeral offline messaging
 * Supports Dual-Mode Architecture: Real Web Bluetooth GATT hardware or Simulated Demo Mode
 */
export function useBleMesh(): UseBleMeshReturn {
  // Dual-mode state (defaults to true for smooth presentations and offline fallback)
  const [isDemoMode, setIsDemoMode] = useState<boolean>(true);

  const [hardwareSupported, setHardwareSupported] = useState<boolean>(false);
  const [localPeer, setLocalPeer] = useState<LocalPeerProfile | null>(null);
  const [peers, setPeers] = useState<BlePeer[]>([]);
  const [messages, setMessages] = useState<BleChatMessage[]>([]);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const connectedDevicesRef = useRef<Map<string, BluetoothDeviceInstance>>(new Map());
  const replyCategoryIndicesRef = useRef<Record<string, number>>({});

  // Initialize capability detection & local identity on mount
  useEffect(() => {
    const supported = typeof navigator !== 'undefined' && 'bluetooth' in navigator;
    setHardwareSupported(supported);

    const profile = parseLocalProfile();
    setLocalPeer(profile || (isDemoMode ? DEFAULT_LOCAL_PEER : null));

    if (isDemoMode) {
      setPeers(MOCK_PEERS);
    }

    // Synchronize if profile changes in storage
    const handleStorage = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY_CACHED_PROFILE) {
        const updated = parseLocalProfile();
        setLocalPeer(updated || (isDemoMode ? DEFAULT_LOCAL_PEER : null));
      }
    };

    window.addEventListener('storage', handleStorage);
    return () => {
      window.removeEventListener('storage', handleStorage);
    };
  }, [isDemoMode]);

  // Capability gates
  const isSupported = isDemoMode ? true : hardwareSupported;
  const isRegistered = isDemoMode ? true : Boolean(localPeer && localPeer.peerId);

  const toggleDemoMode = useCallback((enable?: boolean) => {
    setIsDemoMode((prev) => {
      const nextMode = typeof enable === 'boolean' ? enable : !prev;
      if (nextMode) {
        // Switching TO simulation: restore mock mesh state
        setLocalPeer((curr) => curr || DEFAULT_LOCAL_PEER);
        setPeers(MOCK_PEERS);
      } else {
        // Switching TO physical BLE: clear simulated state, ready for real hardware scan
        setLocalPeer(parseLocalProfile());
        setPeers([]);
        setMessages([]);
      }
      return nextMode;
    });
    // Always reset scanning state on mode switch
    setIsScanning(false);
    setError(null);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  // Ambient background bulletin transmissions (demo mode only)
  // Fires every 30–45 seconds when peers are connected, simulating unsolicited mesh traffic
  useEffect(() => {
    if (!isDemoMode) return;

    const ambientIndicesRef = { current: 0 };

    const scheduleNext = () => {
      const delayMs = 30000 + Math.floor(Math.random() * 15000); // 30–45 seconds
      return setTimeout(() => {
        const bulletin = AMBIENT_BULLETINS[ambientIndicesRef.current % AMBIENT_BULLETINS.length];
        ambientIndicesRef.current += 1;
        const telemetry = generateTelemetry();

        const ambientMessage: BleChatMessage = {
          id: `ble-ambient-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          senderId: bulletin.senderId,
          senderName: bulletin.senderName,
          text: bulletin.text,
          timestamp: new Date().toISOString(),
          isAmbient: true,
          ...telemetry,
        };
        setMessages((prev) => [...prev, ambientMessage]);

        // Schedule the next one recursively
        timerId = scheduleNext();
      }, delayMs);
    };

    let timerId = scheduleNext();

    return () => {
      clearTimeout(timerId);
    };
  }, [isDemoMode]);

  const disconnectPeer = useCallback((deviceId: string) => {
    if (connectedDevicesRef.current.has(deviceId)) {
      const device = connectedDevicesRef.current.get(deviceId);
      if (device && device.gatt && device.gatt.connected) {
        try {
          device.gatt.disconnect();
        } catch (err) {
          console.debug('Error disconnecting BLE peer GATT server:', err);
        }
      }
      connectedDevicesRef.current.delete(deviceId);
    }
    setPeers((prev) =>
      prev.map((p) => (p.deviceId === deviceId ? { ...p, connected: false } : p))
    );
  }, []);

  /**
   * Scan for peers:
   * - Demo Mode: Runs mock radio discovery (2.5s delay, returns Rahul & Priya)
   * - Hardware Mode: Invokes navigator.bluetooth.requestDevice with SAHAYAK_SERVICE_UUID
   */
  const scanForPeers = useCallback(async (): Promise<BlePeer | null> => {
    setError(null);

    // 1. DEMO MODE PATH
    if (isDemoMode) {
      setIsScanning(true);
      return new Promise((resolve) => {
        setTimeout(() => {
          setIsScanning(false);
          setPeers(MOCK_PEERS);
          resolve(MOCK_PEERS[0]);
        }, 2500);
      });
    }

    // 2. HARDWARE WEB BLUETOOTH PATH
    const bluetooth = getBluetoothApi();

    if (!bluetooth) {
      const msg = 'Web Bluetooth is not supported in this browser. Please use Chrome/Edge on an Android or desktop device with Bluetooth enabled.';
      setError(msg);
      return null;
    }

    if (!isRegistered || !localPeer) {
      const msg = 'Citizen registration required: Please complete profile setup before initiating BLE Mesh.';
      setError(msg);
      return null;
    }

    setIsScanning(true);

    try {
      // Trigger native browser device selection dialog
      const device = await bluetooth.requestDevice({
        filters: [{ services: [SAHAYAK_SERVICE_UUID] }],
        optionalServices: [SAHAYAK_SERVICE_UUID],
      });

      if (!device) {
        setIsScanning(false);
        return null;
      }

      // Connect to GATT server
      let server: BluetoothGattServer | undefined;
      if (device.gatt) {
        try {
          server = await device.gatt.connect();
        } catch (gattErr: unknown) {
          console.warn('Direct GATT connection warning:', gattErr);
        }
      }

      let remotePeerId = `PEER-${device.id.substring(0, 8).toUpperCase()}`;
      let remotePeerName = device.name || `Sahayak Peer (${device.id.slice(0, 4)})`;

      // Read remote Peer ID characteristic if present
      if (server && server.connected) {
        try {
          const service = await server.getPrimaryService(SAHAYAK_SERVICE_UUID);
          const peerIdChar = await service.getCharacteristic(PEER_ID_CHAR_UUID);
          const val = await peerIdChar.readValue();
          const decoded = new TextDecoder('utf-8').decode(val);
          if (decoded) {
            remotePeerId = decoded;
          }
        } catch (charErr) {
          console.debug('GATT characteristic read fallback:', charErr);
        }
      }

      const connectedPeer: BlePeer = {
        deviceId: device.id,
        peerId: remotePeerId,
        peerName: remotePeerName,
        connected: device.gatt?.connected ?? true,
      };

      connectedDevicesRef.current.set(device.id, device);

      // Listen for disconnects
      const onDisconnect = () => {
        setPeers((prev) =>
          prev.map((p) => (p.deviceId === device.id ? { ...p, connected: false } : p))
        );
      };
      device.addEventListener('gattserverdisconnected', onDisconnect);

      setPeers((prev) => {
        const filtered = prev.filter((p) => p.deviceId !== device.id);
        return [...filtered, connectedPeer];
      });

      setIsScanning(false);
      return connectedPeer;
    } catch (err: unknown) {
      setIsScanning(false);
      const errorObj = err as Error;
      if (errorObj?.name === 'NotFoundError') {
        // User cancelled the browser device picker dialog
        console.info('BLE scan cancelled by user.');
        return null;
      }
      const errorMessage = errorObj?.message || 'Failed to scan and pair BLE peer.';
      setError(errorMessage);
      console.error('BLE Scan Error:', err);
      return null;
    }
  }, [isDemoMode, isRegistered, localPeer]);

  /**
   * Send message:
   * - Appends message to single, unified public broadcast feed
   * - Demo Mode: Randomly selects an active peer from the mesh to act as sender for contextual reply (2-4s latency)
   * - Hardware Mode: Encodes packet and writes to CHAT_MESSAGE_CHAR_UUID GATT characteristic
   */
  const sendMessage = useCallback(
    async (textOrTarget: string, maybeText?: string): Promise<boolean> => {
      const text = (maybeText !== undefined ? maybeText : textOrTarget).trim();
      const targetDeviceId = maybeText !== undefined ? textOrTarget : undefined;
      if (!text) return false;

      const senderId = localPeer?.peerId || (isDemoMode ? 'CIT-LOCAL' : 'CITIZEN-LOCAL');
      const senderName = 'You (Local Node)';
      const timestamp = new Date().toISOString();

      const messageObj: BleChatMessage = {
        id: `ble-msg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        senderId,
        senderName,
        text,
        timestamp,
      };

      // 1. Maintain in-memory in React state (unified global broadcast feed)
      setMessages((prev) => [...prev, messageObj]);

      // 2. DEMO MODE: Simulate peer response with 2-4s realistic radio latency
      if (isDemoMode) {
        // Randomly select an active peer from the mesh to act as the sender
        const candidatePool = (peers.length > 0 ? peers : MOCK_PEERS).filter((p) => p.connected);
        const activePool = candidatePool.length > 0 ? candidatePool : MOCK_PEERS;
        const randomPeer = activePool[Math.floor(Math.random() * activePool.length)];

        const replySenderId = randomPeer.peerId;
        const replySenderName = randomPeer.peerName;

        const delayMs = 2000 + Math.floor(Math.random() * 2000); // 2000ms - 4000ms
        const replyText = generateContextualPeerReply(text, replyCategoryIndicesRef.current);

        setTimeout(() => {
          const replyMessage: BleChatMessage = {
            id: `ble-reply-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            senderId: replySenderId,
            senderName: replySenderName,
            text: replyText,
            timestamp: new Date().toISOString(),
            ...generateTelemetry(),
          };
          setMessages((prev) => [...prev, replyMessage]);
        }, delayMs);

        return true;
      }

      // 3. HARDWARE MODE: Dispatch packet over GATT characteristic if connected
      const device = targetDeviceId
        ? connectedDevicesRef.current.get(targetDeviceId)
        : connectedDevicesRef.current.values().next().value;

      if (device && device.gatt && device.gatt.connected) {
        try {
          const service = await device.gatt.getPrimaryService(SAHAYAK_SERVICE_UUID);
          const char = await service.getCharacteristic(CHAT_MESSAGE_CHAR_UUID);
          const encoder = new TextEncoder();
          const payload = JSON.stringify({
            senderId,
            senderName,
            text,
            timestamp,
          });

          if (char.writeValue) {
            await char.writeValue(encoder.encode(payload));
          } else if (char.writeValueWithResponse) {
            await char.writeValueWithResponse(encoder.encode(payload));
          }
        } catch (gattErr) {
          console.debug('GATT packet transmission fallback:', gattErr);
        }
      }

      return true;
    },
    [isDemoMode, localPeer, peers]
  );

  return {
    isSupported,
    isRegistered,
    localPeer,
    isDemoMode,
    toggleDemoMode,
    peers,
    isScanning,
    scanForPeers,
    disconnectPeer,
    messages,
    sendMessage,
    clearMessages,
    error,
    clearError,
  };
}

export default useBleMesh;
