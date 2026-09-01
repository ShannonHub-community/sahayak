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
  text: string;
  timestamp: string;
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

  // Ephemeral messaging
  messages: BleChatMessage[];
  sendMessage: (targetDeviceId: string, text: string) => Promise<boolean>;
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
    peerName: 'Rahul (Test Device 1)',
    connected: true,
  },
  {
    deviceId: 'dev-demo-9942',
    peerId: 'CIT-DEMO-9942',
    peerName: 'Priya (Test Device 2)',
    connected: true,
  },
];

const MOCK_REPLIES = [
  'I am safe, moving to the higher ground now.',
  'Do you have any drinking water left?',
  'NDRF rescue boat just crossed the main road. Heading towards the relief camp.',
  'Understood! Conserving battery. Will broadcast our coordinates every 10 mins.',
  'We are sheltered on the 2nd floor of the Community Center with 4 others.',
];

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
  const replyIndexRef = useRef<number>(0);

  // Initialize capability detection & local identity on mount
  useEffect(() => {
    const supported = typeof navigator !== 'undefined' && 'bluetooth' in navigator;
    setHardwareSupported(supported);

    const profile = parseLocalProfile();
    setLocalPeer(profile || (isDemoMode ? DEFAULT_LOCAL_PEER : null));

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
        setLocalPeer((curr) => curr || DEFAULT_LOCAL_PEER);
      } else {
        setLocalPeer(parseLocalProfile());
      }
      return nextMode;
    });
    setError(null);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

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
   * - Demo Mode: Immediately appends message, then triggers a 2-4s delayed contextual peer auto-reply
   * - Hardware Mode: Encodes packet and writes to CHAT_MESSAGE_CHAR_UUID GATT characteristic
   */
  const sendMessage = useCallback(
    async (targetDeviceId: string, text: string): Promise<boolean> => {
      const trimmed = text.trim();
      if (!trimmed) return false;

      const senderId = localPeer?.peerId || (isDemoMode ? 'CIT-LOCAL' : 'CITIZEN-LOCAL');
      const timestamp = new Date().toISOString();

      const messageObj: BleChatMessage = {
        id: `ble-msg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        senderId,
        text: trimmed,
        timestamp,
      };

      // 1. Maintain in-memory in React state
      setMessages((prev) => [...prev, messageObj]);

      // 2. DEMO MODE: Simulate peer response with 2-4s realistic radio latency
      if (isDemoMode) {
        const targetPeer =
          peers.find((p) => p.deviceId === targetDeviceId) ||
          MOCK_PEERS.find((p) => p.deviceId === targetDeviceId) ||
          MOCK_PEERS[0];
        const replySenderId = targetPeer.peerId;

        const delayMs = 2000 + Math.floor(Math.random() * 2000); // 2000ms - 4000ms
        const replyText = MOCK_REPLIES[replyIndexRef.current % MOCK_REPLIES.length];
        replyIndexRef.current += 1;

        setTimeout(() => {
          const replyMessage: BleChatMessage = {
            id: `ble-reply-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            senderId: replySenderId,
            text: replyText,
            timestamp: new Date().toISOString(),
          };
          setMessages((prev) => [...prev, replyMessage]);
        }, delayMs);

        return true;
      }

      // 3. HARDWARE MODE: Dispatch packet over GATT characteristic if connected
      const device = connectedDevicesRef.current.get(targetDeviceId);
      if (device && device.gatt && device.gatt.connected) {
        try {
          const service = await device.gatt.getPrimaryService(SAHAYAK_SERVICE_UUID);
          const char = await service.getCharacteristic(CHAT_MESSAGE_CHAR_UUID);
          const encoder = new TextEncoder();
          const payload = JSON.stringify({
            senderId,
            text: trimmed,
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
