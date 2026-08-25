import { create } from 'zustand';
import { TwinMapState, TwinDiffPayload } from '@/components/digital_twin/types';

export interface TwinState {
  entities: Record<string, TwinMapState>;
  isConnected: boolean;
  lastUpdated: string | null;

  setInitialState: (entities: Record<string, TwinMapState>) => void;
  applyDiff: (diff: TwinDiffPayload) => void;
  setConnectionStatus: (status: boolean) => void;
}

export const useTwinStore = create<TwinState>((set) => ({
  entities: {},
  isConnected: false,
  lastUpdated: null,

  setInitialState: (entities: Record<string, TwinMapState>) =>
    set({
      entities: { ...entities },
      lastUpdated: new Date().toISOString(),
    }),

  applyDiff: (diff: TwinDiffPayload) =>
    set((state) => {
      const nextEntities = { ...state.entities };

      // Process added items
      if (diff.added && Array.isArray(diff.added)) {
        for (const item of diff.added) {
          if (item && item.id) {
            nextEntities[item.id] = item;
          }
        }
      }

      // Process updated items
      if (diff.updated && Array.isArray(diff.updated)) {
        for (const item of diff.updated) {
          if (item && item.id) {
            nextEntities[item.id] = item;
          }
        }
      }

      // Process removed items
      if (diff.removed && Array.isArray(diff.removed)) {
        for (const id of diff.removed) {
          delete nextEntities[id];
        }
      }

      return {
        entities: nextEntities,
        lastUpdated: new Date().toISOString(),
      };
    }),

  setConnectionStatus: (status: boolean) =>
    set({
      isConnected: status,
    }),
}));
