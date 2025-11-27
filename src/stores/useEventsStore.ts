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
    
    // Optimistic update methods for instant UI updates
    optimisticallyAddEvent: (event: UserEvent) => void;
    optimisticallyUpdateEvent: (uid: string, updates: Partial<UserEvent>) => void;
    optimisticallyDeleteEvent: (uid: string) => void;
    revertOptimisticUpdate: (previousEvents: UserEvent[]) => void;
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

                // Get current optimistic events (events marked with _optimistic flag)
                const currentEvents = get().userEvents;
                const optimisticEvents = currentEvents.filter(event => 
                    event.list?.some(item => item.key === '_optimistic')
                );

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

                // Merge optimistic events with fetched events
                // Optimistic events take precedence (they're newer)
                const mergedEvents = [...activeEvents];
                optimisticEvents.forEach(optimisticEvent => {
                    const existingIndex = mergedEvents.findIndex(e => e.uid === optimisticEvent.uid);
                    if (existingIndex >= 0) {
                        // Replace with optimistic version (it's more recent)
                        mergedEvents[existingIndex] = optimisticEvent;
                    } else {
                        // Add optimistic event if it doesn't exist in fetched events
                        mergedEvents.push(optimisticEvent);
                    }
                });

                console.log("deleted events in event store:", deletedEvents);
                console.log("✅ Merged events (including optimistic):", mergedEvents.length);
                set({
                    userEvents: mergedEvents,
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
            
            // Optimistic update methods for instant UI feedback
            optimisticallyAddEvent: (event: UserEvent) => {
                const currentEvents = get().userEvents;
                // Check if event already exists (avoid duplicates)
                const exists = currentEvents.some(e => e.uid === event.uid);
                if (!exists) {
                    // Mark as optimistic so it's preserved during getUserEvents
                    const optimisticEvent = {
                        ...event,
                        list: [
                            ...(event.list || []),
                            { key: '_optimistic', value: 'true' }
                        ]
                    };
                    const newEvents = [...currentEvents, optimisticEvent];
                    // Filter and set events (bypassing setUserEvents to avoid recursion)
                    const activeEvents = newEvents.filter(ev => {
                        if (!ev.list) return true;
                        const isDeletedItem = ev.list.find(item => item.key === 'isDeleted');
                        return !isDeletedItem || isDeletedItem.value !== 'true';
                    });
                    set({ userEvents: activeEvents });
                    console.log('✅ Optimistically added event:', event.uid, '- Total events:', activeEvents.length);
                }
            },
            
            optimisticallyUpdateEvent: (uid: string, updates: Partial<UserEvent>) => {
                const currentEvents = get().userEvents;
                const updatedEvents = currentEvents.map(event => {
                    if (event.uid === uid) {
                        // Preserve optimistic flag if it exists
                        const hasOptimistic = event.list?.some(item => item.key === '_optimistic');
                        const updatedList = hasOptimistic 
                            ? event.list 
                            : [...(event.list || []), { key: '_optimistic', value: 'true' }];
                        return { 
                            ...event, 
                            ...updates,
                            list: updatedList
                        };
                    }
                    return event;
                });
                // Filter and set events (bypassing setUserEvents to avoid recursion)
                const activeEvents = updatedEvents.filter(ev => {
                    if (!ev.list) return true;
                    const isDeletedItem = ev.list.find(item => item.key === 'isDeleted');
                    return !isDeletedItem || isDeletedItem.value !== 'true';
                });
                set({ userEvents: activeEvents });
                console.log('✅ Optimistically updated event:', uid, '- Total events:', activeEvents.length);
            },
            
            optimisticallyDeleteEvent: (uid: string) => {
                const currentEvents = get().userEvents;
                const filteredEvents = currentEvents.filter(event => event.uid !== uid);
                // Filter and set events (bypassing setUserEvents to avoid recursion)
                const activeEvents = filteredEvents.filter(ev => {
                    if (!ev.list) return true;
                    const isDeletedItem = ev.list.find(item => item.key === 'isDeleted');
                    return !isDeletedItem || isDeletedItem.value !== 'true';
                });
                set({ userEvents: activeEvents });
                console.log('✅ Optimistically deleted event:', uid, '- Total events:', activeEvents.length);
            },
            
            revertOptimisticUpdate: (previousEvents: UserEvent[]) => {
                // Filter and set events (bypassing setUserEvents to avoid recursion)
                const activeEvents = previousEvents.filter(ev => {
                    if (!ev.list) return true;
                    const isDeletedItem = ev.list.find(item => item.key === 'isDeleted');
                    return !isDeletedItem || isDeletedItem.value !== 'true';
                });
                set({ userEvents: activeEvents });
                console.log('↩️ Reverted optimistic update');
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
