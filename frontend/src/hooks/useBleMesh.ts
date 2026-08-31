import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Sahayak Mesh Custom 128-bit Bluetooth GATT UUIDs
 */
export const SAHAYAK_SERVICE_UUID = '0000ffe0-0000-1000-8000-00805f9b34fb';
export const PEER_ID_CHAR_UUID = '0000ffe1-0000-1000-8000-00805f9b34fb';
export const CHAT_MESSAGE_CHAR_UUID = '0000ffe2-0000-1000-8000-00805f9b34fb';

const STORAGE_KEY_CACHED_PROFILE = 'sahayak_cached_citizen_profile';

// Ambient types for Web Bluetooth API to ensure universal compilation
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

    // Extract ble_peer_id with safe fallbacks
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
 */
export function useBleMesh(): UseBleMeshReturn {
  const [isSupported, setIsSupported] = useState<boolean>(false);
  const [localPeer, setLocalPeer] = useState<LocalPeerProfile | null>(null);
  const [peers, setPeers] = useState<BlePeer[]>([]);
  const [messages, setMessages] = useState<BleChatMessage[]>([]);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const connectedDevicesRef = useRef<Map<string, BluetoothDeviceInstance>>(new Map());

  // Initialize capability detection & local identity on mount
  useEffect(() => {
    const supported = typeof navigator !== 'undefined' && 'bluetooth' in navigator;
    setIsSupported(supported);

    const profile = parseLocalProfile();
    setLocalPeer(profile);

    // Synchronize if profile changes in storage
    const handleStorage = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY_CACHED_PROFILE) {
        setLocalPeer(parseLocalProfile());
      }
    };

    window.addEventListener('storage', handleStorage);
    return () => {
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  const isRegistered = Boolean(localPeer && localPeer.peerId);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  const disconnectPeer = useCallback((deviceId: string) => {
    const device = connectedDevicesRef.current.get(deviceId);
    if (device && device.gatt && device.gatt.connected) {
      try {
        device.gatt.disconnect();
      } catch (err) {
        console.debug('Error disconnecting BLE peer GATT server:', err);
      }
    }
    connectedDevicesRef.current.delete(deviceId);
    setPeers((prev) =>
      prev.map((p) => (p.deviceId === deviceId ? { ...p, connected: false } : p))
    );
  }, []);

  /**
   * User-initiated scan & pairing flow
   */
  const scanForPeers = useCallback(async (): Promise<BlePeer | null> => {
    setError(null);
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
  }, [isRegistered, localPeer]);

  /**
   * In-memory ephemeral message transmission (No DB/API writes)
   */
  const sendMessage = useCallback(
    async (targetDeviceId: string, text: string): Promise<boolean> => {
      const trimmed = text.trim();
      if (!trimmed) return false;

      const senderId = localPeer?.peerId || 'CITIZEN-LOCAL';
      const timestamp = new Date().toISOString();

      const messageObj: BleChatMessage = {
        id: `ble-msg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        senderId,
        text: trimmed,
        timestamp,
      };

      // 1. Maintain in-memory strictly in React state
      setMessages((prev) => [...prev, messageObj]);

      // 2. Dispatch packet over GATT characteristic if connected
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
          console.debug('GATT packet transmission simulation fallback:', gattErr);
        }
      }

      return true;
    },
    [localPeer]
  );

  return {
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
    clearError,
  };
}

export default useBleMesh;
