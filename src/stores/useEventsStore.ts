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

            // Legacy events state
            events: [],
            loading: false,
            error: null,

            // User events actions
            setUserEvents: events => {
                console.log('>>>>>>> events', events);

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
                    const hostContract = new BlockchainService(Config.NECJSPK);
                    const blockchainEvents = await hostContract.getAllEvents(userName);

                    if (blockchainEvents.uuids.length === 0) {
                        set({ userEvents: [], userEncryptedEvents: [], userEventsLoading: false });
                        console.log('No events found for user:', userName);
                        return;
                    }
                    // Call API with the passed apiClient
                    const payload = { uuid: blockchainEvents?.uuids };
                    const res = await apiClient(
                        'POST',
                        'getEncryptedCalendarDetails',
                        payload,
                    );

                    console.log('API response for user events:', res);
                    if (res?.data?.value) {
                        const encrypted = res?.data?.value;
                        set({ userEncryptedEvents: encrypted, userEventsLoading: false });
                        console.log('User events fetched successfully:', encrypted);

                        // Trigger bulk decryption with Wallet App
                        if (Array.isArray(encrypted) && encrypted.length > 0) {
                            try {
                                // Map API response to Ncog bulk-decrypt input
                                const bulkInput = encrypted.map((item: any) => {
                                    if (typeof item === 'string') return item;
                                    return {
                                        encrypted: item?.calendar_message ?? item?.encrypted ?? '',
                                        version: item?.version ?? 'v1',
                                        // uuid: item?.uuid ?? null,
                                    };
                                });
                                console.log("bulk input:", bulkInput);

                                await requestBulkDecrypt('dcalendar', 'dcalendar', bulkInput);
                            } catch (e) {
                                console.warn('Ncog decrypt request failed to start:', e);
                            }
                        }
                    }
                } catch (error) {
                    console.error('❌ Error fetching user events:', error);
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
