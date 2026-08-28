"use client";

import { create } from 'zustand';
import { ResourceItem, WorkforceRequest, AIInsightCard, ResourceCategory, ResourceStatus, ResourceSubtype } from './types';
import {
  fetchResources,
  fetchInsightsApi,
  fetchWorkforceQueueApi,
  createResourceApi,
  updateResourceApi,
  executeHandoverApi,
  broadcastNeedApi,
  connectResourceWebSocket,
  ResourceWebSocketEvent
} from './resourceApi';

interface ResourceState {
  /* ── State ───────────────────────────────────────── */
  resources: ResourceItem[];
  workforceRequests: WorkforceRequest[];
  aiInsights: AIInsightCard[];
  searchQuery: string;
  categoryFilter: string;
  statusFilter: string;
  isLoading: boolean;
  isConnected: boolean;
  error: string | null;

  /* ── Actions ─────────────────────────────────────── */
  addResource: (item: Omit<ResourceItem, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  updateResourceStatus: (id: string, status: ResourceStatus, assigned_to?: string | null) => Promise<void>;
  completeHandover: (requestId: string, resourceId: string) => Promise<void>;
  broadcastNeed: (category: ResourceCategory, subtype: ResourceSubtype, qty: number) => Promise<void>;
  
  setSearchQuery: (query: string) => void;
  setSelectedCategory: (category: string) => void;
  setSelectedStatus: (status: string) => void;

  /** Fetch initial data from backend */
  loadData: () => Promise<void>;

  /** Start the WebSocket connection for real-time updates */
  initWebSocket: () => () => void;
}

// Fallback mock data in case backend is down
const mockResources: ResourceItem[] = [
  { id: 'R-01', category: 'personnel', subtype: 'Rescue/Boat Operator', name: 'NDRF 5th Battalion Water Rescue Squad', quantity: 12, status: 'available', location: { lat: 18.99, lng: 73.11, zoneName: 'Panvel Creek / Uran Naka Base' }, source: 'government', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'R-02', category: 'personnel', subtype: 'Medic', name: 'Trauma & Emergency Medical Unit', quantity: 8, status: 'assigned', location: { lat: 18.98, lng: 73.10, zoneName: 'Panvel Sub-District Hospital, Old Panvel' }, assigned_to: 'Med Unit 1', source: 'government', created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
];

const mockRequests: WorkforceRequest[] = [
  { id: 'REQ-1', team_name: 'NDRF Unit Alpha', team_type: 'NDRF', requested_category: 'vehicle', requested_subtype: 'Rescue Boat', quantity: 2, urgency: 'critical', zone: 'Zone 2', timestamp: new Date().toISOString() }
];

const mockAIInsights: AIInsightCard[] = [
  { id: 'AI-1', type: 'depletion', title: 'Infant Formula Depleted', message: 'Infant Formula Crates depleted in Takka Colony. Immediate restocking required.', severity: 'amber', timestamp: new Date().toISOString() }
];

export const useResourceStore = create<ResourceState>((set, get) => ({
  resources: [],
  workforceRequests: [],
  aiInsights: [],
  searchQuery: '',
  categoryFilter: 'All',
  statusFilter: 'All Statuses',
  isLoading: true,
  isConnected: false,
  error: null,

  /* ── Load initial data from backend ──────────────── */
  loadData: async () => {
    set({ isLoading: true, error: null });
    try {
      const [resData, insightsData, queueData] = await Promise.all([
        fetchResources(),
        fetchInsightsApi(),
        fetchWorkforceQueueApi()
      ]);
      set({ 
        resources: resData, 
        aiInsights: insightsData,
        workforceRequests: queueData,
        isLoading: false 
      });
    } catch (err) {
      console.warn('[ResourceManager] Backend unavailable, falling back to mock data:', err);
      set({
        resources: mockResources,
        aiInsights: mockAIInsights,
        workforceRequests: mockRequests,
        isLoading: false,
        error: 'Using offline mock data — backend unreachable.'
      });
    }
  },

  /* ── API mutations ───────────────────────────────── */
  addResource: async (item) => {
    try {
      const newResource = await createResourceApi(item);
      // Wait for WS update, but we can optimistically update
      set((state) => ({
        resources: [...state.resources, newResource]
      }));
    } catch (err) {
      console.error('Failed to create resource:', err);
      // fallback logic if needed
    }
  },

  updateResourceStatus: async (id, status, assigned_to = null) => {
    try {
      const updated = await updateResourceApi(id, { status, assigned_to });
      set((state) => ({
        resources: state.resources.map(r => r.id === id ? updated : r)
      }));
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  },

  completeHandover: async (requestId, resourceId) => {
    try {
      // Mock officer_id since we don't have auth currently
      const officerId = 'officer-123';
      const result = await executeHandoverApi(requestId, resourceId, officerId);
      set((state) => ({
        workforceRequests: state.workforceRequests.filter(r => r.id !== requestId),
        resources: state.resources.map(r => r.id === resourceId ? result : r)
      }));
    } catch (err) {
      console.error('Failed to complete handover:', err);
    }
  },

  broadcastNeed: async (category, subtype, qty) => {
    try {
      // Using 'Zone 1' and 'high' urgency as defaults, you could extend the UI to support them
      await broadcastNeedApi(category, subtype, qty, 'Zone 1', 'high');
      console.log(`Successfully broadcasted need to Citizen Portal: ${qty}x ${subtype} (${category})`);
    } catch (err) {
      console.error('Failed to broadcast need:', err);
    }
  },

  /* ── Local filtering ─────────────────────────────── */
  setSearchQuery: (query) => set({ searchQuery: query }),
  setSelectedCategory: (category) => set({ categoryFilter: category }),
  setSelectedStatus: (status) => set({ statusFilter: status }),

  /* ── WebSocket connection ────────────────────────── */
  initWebSocket: () => {
    const handleEvent = (event: ResourceWebSocketEvent) => {
      const { event: eventType, payload } = event;

      switch (eventType) {
        case 'INVENTORY_UPDATE':
        case 'HANDOVER_EXECUTED': {
          const updated = payload as ResourceItem;
          set((state) => {
            const exists = state.resources.some(r => r.id === updated.id);
            if (exists) {
              return { resources: state.resources.map(r => r.id === updated.id ? updated : r) };
            } else {
              return { resources: [...state.resources, updated] };
            }
          });
          break;
        }

        case 'AI_INSIGHT_ALERT': {
          const newInsight = payload as AIInsightCard;
          set((state) => ({
            aiInsights: [newInsight, ...state.aiInsights.filter(i => i.id !== newInsight.id)]
          }));
          break;
        }

        case 'BROADCAST_TRIGGERED': {
          // You could show a toast notification here
          console.log('Broadcast event received from WS:', payload);
          break;
        }
      }
    };

    const handleStatus = (connected: boolean) => {
      set({ isConnected: connected });
    };

    return connectResourceWebSocket(handleEvent, handleStatus);
  }
}));
