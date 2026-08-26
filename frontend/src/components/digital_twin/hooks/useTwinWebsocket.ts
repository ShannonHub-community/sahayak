import { useEffect, useRef } from 'react';
import { useTwinStore } from '@/store/twinStore';
import { TwinDiffPayload, TwinMapState } from '../types';

const DEFAULT_WS_URL = 'ws://localhost:8000/api/twin_aggregator/ws';

export function useTwinWebsocket(url?: string) {
  const wsUrl = url || process.env.NEXT_PUBLIC_WS_URL || DEFAULT_WS_URL;
  const setInitialState = useTwinStore((state) => state.setInitialState);
  const applyDiff = useTwinStore((state) => state.applyDiff);
  const setConnectionStatus = useTwinStore((state) => state.setConnectionStatus);

  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isInitialRef = useRef<boolean>(true);
  const isMountedRef = useRef<boolean>(true);

  useEffect(() => {
    isMountedRef.current = true;
    isInitialRef.current = true;

    function connect() {
      if (!isMountedRef.current) return;

      try {
        const socket = new WebSocket(wsUrl);
        socketRef.current = socket;

        socket.onopen = () => {
          if (!isMountedRef.current) return;
          console.log('[Digital Twin WS] Connected to', wsUrl);
          setConnectionStatus(true);
        };

        socket.onmessage = (event) => {
          if (!isMountedRef.current) return;

          try {
            const data = JSON.parse(event.data);

            if (isInitialRef.current) {
              isInitialRef.current = false;
              if (
                data &&
                typeof data === 'object' &&
                !Array.isArray(data) &&
                ('added' in data || 'updated' in data || 'removed' in data)
              ) {
                const diff = data as TwinDiffPayload;
                const initialMap: Record<string, TwinMapState> = {};
                if (diff.added && Array.isArray(diff.added)) {
                  for (const item of diff.added) {
                    if (item && item.id) {
                      initialMap[item.id] = item;
                    }
                  }
                }
                setInitialState(initialMap);
              } else if (data && typeof data === 'object' && !Array.isArray(data)) {
                setInitialState(data as Record<string, TwinMapState>);
              } else if (Array.isArray(data)) {
                const initialMap: Record<string, TwinMapState> = {};
                for (const item of data) {
                  if (item && item.id) {
                    initialMap[item.id] = item;
                  }
                }
                setInitialState(initialMap);
              }
            } else {
              if (
                data &&
                typeof data === 'object' &&
                ('added' in data || 'updated' in data || 'removed' in data)
              ) {
                applyDiff(data as TwinDiffPayload);
              }
            }
          } catch (err) {
            console.error('[Digital Twin WS] Parse error:', err);
          }
        };

        socket.onerror = (error) => {
          if (!isMountedRef.current) return; // Ignores the Strict Mode phantom error
          console.error('[Digital Twin WS] Connection error:', error);
        };

        socket.onclose = (event) => {
          if (!isMountedRef.current) return;
          console.warn('[Digital Twin WS] Socket disconnected:', event.reason || 'Closed');
          setConnectionStatus(false);

          if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
          }
          reconnectTimeoutRef.current = setTimeout(() => {
            if (isMountedRef.current) {
              connect();
            }
          }, 3000);
        };
      } catch (err) {
        console.error('[Digital Twin WS] Failed to create WebSocket connection:', err);
        setConnectionStatus(false);
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
        }
        reconnectTimeoutRef.current = setTimeout(() => {
          if (isMountedRef.current) {
            connect();
          }
        }, 3000);
      }
    }

    connect();

    return () => {
      isMountedRef.current = false;
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, [wsUrl, setInitialState, applyDiff, setConnectionStatus]);

  return {
    isConnected: useTwinStore((state) => state.isConnected),
    entities: useTwinStore((state) => state.entities),
    lastUpdated: useTwinStore((state) => state.lastUpdated),
  };
}
