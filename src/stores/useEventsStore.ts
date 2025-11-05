import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import Config from '../config';
import { BlockchainService } from '../services/BlockChainService';
import { requestBulkDecrypt } from '../utils';

// User Event type definition (from blockchain)
export interface UserEvent {
    uuid?: string;
    uid: string;
    title: string;
    description?: string;
    fromTime: string;
    toTime: string;
    done?: boolean;
    list?: Array<{
        key: string;
        value: string;
    }>;
}

// Legacy Event type definition (for API compatibility)
export interface Event {
    id: string;
    title: string;
    description?: string;
    startDate: string;
    endDate: string;
    location?: string;
    attendees?: string[];
    isAllDay?: boolean;
    // Add more fields as needed based on your API response
}

type EventsStore = {
    // User events from blockchain
    userEvents: UserEvent[];
    deletedUserEvents: UserEvent[];
    userEncryptedEvents: any[];
    userEventsLoading: boolean;
    userEventsError: string | null;
    blockchainEventsMetadata: any[]; // Store blockchain metadata to merge with decrypted data

    // Legacy events (keeping for compatibility)
    events: Event[];
    loading: boolean;
    error: string | null;

    // User events actions
    setUserEvents: (events: UserEvent[]) => void;
    clearUserEvents: () => void;
    setUserEventsLoading: (loading: boolean) => void;
    setUserEventsError: (error: string | null) => void;
    getUserEvents: (
        userName: string,
        apiClient: any,
        ncog?: { appId: string; returnScheme: string },
    ) => Promise<void>;
    clearAllEventsData: () => void;
};

export const useEventsStore = create<EventsStore>()(
    persist(
        (set, get) => ({
            // User events state
            userEvents: [],
            deletedUserEvents: [],
            userEncryptedEvents: [],
            userEventsLoading: false,
            userEventsError: null,
            blockchainEventsMetadata: [], // Store blockchain metadata to merge with decrypted data

            // Legacy events state
            events: [],
            loading: false,
            error: null,

            // User events actions
            setUserEvents: events => {
                console.log('>>>>>>> events', events);
                console.log('📊 [useEventsStore] setUserEvents - Total events received:', events?.length || 0);
                
                // Log appointments in the incoming events
                const appointmentsInEvents = events.filter((event: any) => 
                    (event as any).uid?.startsWith('appt_') || 
                    (event as any).appointment_uid?.startsWith('appt_') ||
                    (event as any).title?.toLowerCase().includes('appointment')
                );
                console.log('📅 [useEventsStore] Appointments found in events:', appointmentsInEvents.length);
                if (appointmentsInEvents.length > 0) {
                    console.log('📅 [useEventsStore] Appointment details:', appointmentsInEvents.map(apt => ({
                        uid: (apt as any).uid,
                        appointment_uid: (apt as any).appointment_uid,
                        title: (apt as any).title,
                        appointment_title: (apt as any).appointment_title,
                    })));
                }

                // Filter events by isDeleted key in list array
                const activeEvents = events.filter(event => {
                    if (!event.list) return true; // If no list, consider it active
                    const isDeletedItem = event.list.find(item => item.key === 'isDeleted');
                    return !isDeletedItem || isDeletedItem.value !== 'true';
                });

                const deletedEvents = events.filter(event => {
                    if (!event.list) return false; // If no list, not deleted

                    // Check if permanently deleted
                    const isPermanentlyDeletedItem = event.list.find(item => item.key === 'isPermanentDelete');
                    if (isPermanentlyDeletedItem && isPermanentlyDeletedItem.value === 'true') {
                        return false; // Exclude permanently deleted events
                    }

                    // Check if soft deleted
                    const isDeletedItem = event.list.find(item => item.key === 'isDeleted');
                    return isDeletedItem && isDeletedItem.value === 'true';
                });

                console.log("deleted events in event store:", deletedEvents);
                console.log('✅ [useEventsStore] Setting activeEvents:', activeEvents.length);
                
                // Log appointments in active events
                const appointmentsInActive = activeEvents.filter((event: any) => 
                    (event as any).uid?.startsWith('appt_') || 
                    (event as any).appointment_uid?.startsWith('appt_')
                );
                console.log('📅 [useEventsStore] Appointments in activeEvents:', appointmentsInActive.length);
                
                set({
                    userEvents: activeEvents,
                    deletedUserEvents: deletedEvents
                });
            },
            clearUserEvents: () => set({ userEvents: [] }),
            setUserEventsLoading: loading => set({ userEventsLoading: loading }),
            setUserEventsError: error => set({ userEventsError: error }),
            clearAllEventsData: () => set({
                userEvents: [],
                deletedUserEvents: [],
                userEncryptedEvents: [],
                userEventsLoading: false,
                userEventsError: null,
                events: [],
                loading: false,
                error: null,
            }),
            getUserEvents: async (userName: string, apiClient: any) => {
                set({ userEventsLoading: true, userEventsError: null });

                try {
                    console.log('🔍 [getUserEvents] Starting fetch for user:', userName);
                    const hostContract = new BlockchainService(Config.NECJSPK);
                    const blockchainEvents = await hostContract.getAllEvents(userName);
                    console.log('🔍 [getUserEvents] Blockchain events:', blockchainEvents);
                    console.log('🔍 [getUserEvents] UUIDs count:', blockchainEvents?.uuids?.length || 0);
                    
                    // Log appointments from blockchain
                    const appointmentsFromBlockchain = blockchainEvents.events.filter((event: any) => 
                        event.uid?.startsWith('appt_')
                    );
                    console.log('📅 [getUserEvents] Appointments from blockchain:', appointmentsFromBlockchain.length);
                    if (appointmentsFromBlockchain.length > 0) {
                        console.log('📅 [getUserEvents] Blockchain appointment UIDs:', appointmentsFromBlockchain.map(apt => apt.uid));
                    }

                    if (blockchainEvents.uuids.length === 0) {
                        set({ userEvents: [], userEncryptedEvents: [], userEventsLoading: false, blockchainEventsMetadata: [] });
                        console.log('⚠️ [getUserEvents] No events found for user:', userName);
                        return;
                    }
                    
                    // Store blockchain metadata to merge with decrypted data later
                    set({ blockchainEventsMetadata: blockchainEvents.events });
                    console.log('📋 [getUserEvents] Stored blockchain metadata for', blockchainEvents.events.length, 'events');
                    
                    const payload = { uuid: blockchainEvents?.uuids };
                    console.log('🔍 [getUserEvents] API payload:', payload);
                    const res = await apiClient(
                        'POST',
                        'getEncryptedCalendarDetails',
                        payload,
                    );

                    console.log('====================================');
                    console.log('📥 [getUserEvents] Full API response:', JSON.stringify(res, null, 2));
                    console.log('📥 [getUserEvents] Response data:', res?.data);
                    console.log('📥 [getUserEvents] Response data.value:', res?.data?.value);
                    console.log('📥 [getUserEvents] Response status:', res?.status);
                    console.log('====================================');

                    if (res?.data?.value) {
                        const encrypted = res?.data?.value;
                        console.log('🔐 [getUserEvents] Encrypted data type:', typeof encrypted);
                        console.log('🔐 [getUserEvents] Encrypted data is array:', Array.isArray(encrypted));
                        console.log('🔐 [getUserEvents] Encrypted data length:', Array.isArray(encrypted) ? encrypted.length : 'N/A');
                        console.log('🔐 [getUserEvents] Encrypted data sample:', Array.isArray(encrypted) && encrypted.length > 0 ? encrypted[0] : encrypted);

                        set({ userEncryptedEvents: encrypted, userEventsLoading: false });
                        console.log('✅ [getUserEvents] User events fetched successfully:', encrypted);

                        if (Array.isArray(encrypted) && encrypted.length > 0) {
                            try {
                                // Map API response to Ncog bulk-decrypt input
                                const bulkInput = encrypted.map((item: any) => {
                                    if (typeof item === 'string') return item;
                                    return {
                                        encrypted: item?.calendar_message ?? item?.encrypted ?? '',
                                        version: item?.version ?? 'v1',
                                    };
                                });
                                console.log('🔐 [getUserEvents] Bulk input prepared:', bulkInput);
                                console.log('🔐 [getUserEvents] Bulk input length:', bulkInput.length);

                                await requestBulkDecrypt('dcalendar', 'dcalendar', bulkInput);
                                console.log('✅ [getUserEvents] Bulk decrypt request sent to Ncog wallet');
                            } catch (e) {
                                console.error('❌ [getUserEvents] Ncog decrypt request failed:', e);
                                console.error('❌ [getUserEvents] Error details:', e);
                            }
                        } else {
                            console.warn('⚠️ [getUserEvents] Encrypted data is not a valid array or is empty');
                        }
                    } else {
                        console.warn('⚠️ [getUserEvents] No value in API response:', res?.data);
                        set({ userEventsLoading: false });
                    }
                } catch (error) {
                    console.error('❌ [getUserEvents] Error fetching user events:', error);
                    console.error('❌ [getUserEvents] Error stack:', error instanceof Error ? error.stack : 'No stack');
                    const errorMessage =
                        error instanceof Error
                            ? error.message
                            : 'Failed to fetch user events';
                    set({ userEventsError: errorMessage, userEventsLoading: false });
                }
            },
        }),
        {
            name: 'events-storage', // storage key
            storage: {
                getItem: async name => {
                    const value = await AsyncStorage.getItem(name);
                    return value ? JSON.parse(value) : null;
                },
                setItem: async (name, value) => {
                    if (value === null || value === undefined) {
                        await AsyncStorage.removeItem(name);
                    } else {
                        await AsyncStorage.setItem(name, JSON.stringify(value));
                    }
                },
                removeItem: async name => {
                    await AsyncStorage.removeItem(name);
                },
            },
        },
    ),
);
