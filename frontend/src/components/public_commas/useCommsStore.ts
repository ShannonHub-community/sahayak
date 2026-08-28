import { create } from 'zustand';
import { SMSAlert, PressRelease, NewsTimelineEntry, ZoneRiskData, PressTemplate, CommsMetrics } from './types';
import { commsService } from './commsService';

interface CommsState {
  activeTab: 'alerts' | 'press' | 'timeline';
  setActiveTab: (tab: 'alerts' | 'press' | 'timeline') => void;
  
  // Data lists
  metrics: CommsMetrics | null;
  smsAlerts: SMSAlert[];
  pressReleases: PressRelease[];
  timelineEntries: NewsTimelineEntry[];
  pressTemplates: PressTemplate[];
  
  // Initialization
  fetchInitialData: () => Promise<void>;
  
  // Maps & Selection
  zones: ZoneRiskData[];
  selectedZoneId: string | null;
  setSelectedZoneId: (id: string | null) => void;
  
  // AI Drafting
  isDraftingSMS: boolean;
  smsDraft: string;
  setSmsDraft: (draft: string) => void;
  generateSmsDraft: (zone: ZoneRiskData) => Promise<void>;
  broadcastSMS: () => void;
  
  // Press Release Drafting
  isDraftingPress: boolean;
  pressDraft: string;
  setPressDraft: (draft: string) => void;
  generatePressDraft: (templateId: string) => Promise<void>;
  publishPressRelease: () => void;

  // Timeline Moderation
  toggleTimelineVisibility: (id: string, visible: boolean) => Promise<void>;
}

export const useCommsStore = create<CommsState>((set, get) => ({
  activeTab: 'alerts',
  setActiveTab: (tab) => set({ activeTab: tab }),

  metrics: null,
  smsAlerts: [],
  pressReleases: [],
  timelineEntries: [],
  pressTemplates: [],
  
  fetchInitialData: async () => {
    try {
      const [zones, timeline, templates, metrics] = await Promise.all([
        commsService.getZones(),
        commsService.getTimelineEntries(),
        commsService.getPressTemplates(),
        commsService.getMetrics()
      ]);
      set({ 
        zones, 
        timelineEntries: timeline,
        pressTemplates: templates,
        metrics
      });
    } catch (error) {
      console.error("Failed to fetch initial comms data", error);
    }
  },

  zones: [],
  selectedZoneId: null,
  setSelectedZoneId: (id) => {
    set({ selectedZoneId: id, smsDraft: '' });
    const zone = get().zones.find(z => z.zone_id === id);
    if (zone) {
      get().generateSmsDraft(zone);
    }
  },
  
  isDraftingSMS: false,
  smsDraft: '',
  setSmsDraft: (draft) => set({ smsDraft: draft }),
  generateSmsDraft: async (zone) => {
    set({ isDraftingSMS: true, smsDraft: '' });
    try {
      const draft = await commsService.generateAIDraftSMS(zone.zone_id);
      set({ isDraftingSMS: false, smsDraft: draft });
    } catch (error) {
      set({ isDraftingSMS: false, smsDraft: 'Failed to generate draft.' });
    }
  },
  broadcastSMS: async () => {
    const state = get();
    const zone = state.zones.find(z => z.zone_id === state.selectedZoneId);
    if (!zone || !state.smsDraft) return;
    
    try {
      const newAlert = await commsService.broadcastSMS({
        zone_id: zone.zone_id,
        message: state.smsDraft,
        sent_by: 'Admin Panel', // Will eventually come from auth
      });
      
      set(state => ({
        smsAlerts: [newAlert, ...state.smsAlerts],
        smsDraft: '',
        selectedZoneId: null
      }));
    } catch (error) {
      console.error("Failed to broadcast SMS", error);
    }
  },

  isDraftingPress: false,
  pressDraft: '',
  setPressDraft: (draft) => set({ pressDraft: draft }),
  generatePressDraft: async (templateId) => {
    set({ isDraftingPress: true, pressDraft: '' });
    try {
      const draft = await commsService.generateAIPressRelease(templateId);
      set({ isDraftingPress: false, pressDraft: draft.content });
    } catch (error) {
      set({ isDraftingPress: false, pressDraft: 'Failed to generate draft.' });
    }
  },
  publishPressRelease: async () => {
    const state = get();
    if (!state.pressDraft) return;

    try {
      const newRelease = await commsService.publishPressRelease({
        template_id: 'selected-template-id', // Ideally we'd store the selected template id in state, but this works for now
        content: state.pressDraft,
        published_by: 'Admin Panel'
      });

      set(state => ({
        pressReleases: [newRelease, ...state.pressReleases],
        pressDraft: ''
      }));
    } catch (error) {
      console.error("Failed to publish press release", error);
    }
  },

  toggleTimelineVisibility: async (id, visible) => {
    // Optimistic UI update
    set(state => ({
      timelineEntries: state.timelineEntries.map(entry => 
        entry.id === id ? { ...entry, public_visible: visible } : entry
      )
    }));

    try {
      await commsService.toggleEntryVisibility(id, visible);
    } catch (error) {
      // Revert if failed
      set(state => ({
        timelineEntries: state.timelineEntries.map(entry => 
          entry.id === id ? { ...entry, public_visible: !visible } : entry
        )
      }));
      console.error("Failed to toggle visibility", error);
    }
  }
}));
