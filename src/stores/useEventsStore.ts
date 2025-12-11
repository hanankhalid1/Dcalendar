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
        options?: { skipLoading?: boolean },
    ) => Promise<void>;
    clearAllEventsData: () => void;
    
    // Optimistic update methods for instant UI updates
    optimisticallyAddEvent: (event: UserEvent) => void;
    optimisticallyUpdateEvent: (uid: string, updates: Partial<UserEvent>) => void;
    optimisticallyDeleteEvent: (uid: string) => void;
    optimisticallyRestoreEvent: (uid: string) => void;
    optimisticallyPermanentDeleteEvent: (uid: string) => void;
    revertOptimisticUpdate: (previousEvents: UserEvent[]) => void;
    revertOptimisticDeletedUpdate: (previousDeletedEvents: UserEvent[]) => void;
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
            getUserEvents: async (userName: string, apiClient: any, ncog?: { appId: string; returnScheme: string }, options?: { skipLoading?: boolean }) => {
                if (!options?.skipLoading) {
                    set({ userEventsLoading: true, userEventsError: null });
                }

                try {
                    const hostContract = new BlockchainService(Config.NECJSPK);
                    const blockchainEvents = await hostContract.getAllEvents(userName);

                    if (blockchainEvents.uuids.length === 0) {
                        set({ userEvents: [], userEncryptedEvents: [], ...(options?.skipLoading ? {} : { userEventsLoading: false }) });
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
                        set({ userEncryptedEvents: encrypted, ...(options?.skipLoading ? {} : { userEventsLoading: false }) });
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
                    set({ userEventsError: errorMessage, ...(options?.skipLoading ? {} : { userEventsLoading: false }) });
                }
            },
            
            // Optimistic update methods for instant UI feedback
            optimisticallyAddEvent: (event: UserEvent) => {
                const currentEvents = get().userEvents;
                // Check if event already exists (avoid duplicates)
                const exists = currentEvents.some(e => e.uid === event.uid);
                if (!exists) {
                    // Use the event's list if provided (it should already have metadata)
                    // Otherwise create an empty list
                    const eventList = event.list || [];
                    // Check if optimistic flag already exists
                    const hasOptimistic = eventList.some(item => item.key === '_optimistic');
                    // Mark as optimistic so it's preserved during getUserEvents
                    const optimisticEvent = {
                        ...event,
                        list: hasOptimistic 
                            ? eventList 
                            : [...eventList, { key: '_optimistic', value: 'true' }]
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
                    console.log('✅ Added event list:', optimisticEvent.list);
                }
            },
            
            optimisticallyUpdateEvent: (uid: string, updates: Partial<UserEvent>) => {
                const currentEvents = get().userEvents;
                const updatedEvents = currentEvents.map(event => {
                    if (event.uid === uid) {
                        // If updates includes a new list, use it (it should already have metadata)
                        // Otherwise, preserve existing list and add optimistic flag
                        let finalList: Array<{key: string; value: string}>;
                        if (updates.list && updates.list.length > 0) {
                            // Use the new list from updates, but ensure optimistic flag is present
                            const hasOptimistic = updates.list.some(item => item.key === '_optimistic');
                            finalList = hasOptimistic 
                                ? updates.list 
                                : [...updates.list, { key: '_optimistic', value: 'true' }];
                        } else {
                            // No new list provided, preserve existing list and add optimistic flag
                            const hasOptimistic = event.list?.some(item => item.key === '_optimistic');
                            finalList = hasOptimistic 
                                ? event.list 
                                : [...(event.list || []), { key: '_optimistic', value: 'true' }];
                        }
                        return { 
                            ...event, 
                            ...updates,
                            list: finalList
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
                console.log('✅ Updated event list:', updatedEvents.find(e => e.uid === uid)?.list);
            },
            
            optimisticallyDeleteEvent: (uid: string) => {
                const currentEvents = get().userEvents;
                const currentDeletedEvents = get().deletedUserEvents;
                
                // Find the event to delete
                const eventToDelete = currentEvents.find(event => event.uid === uid);
                if (!eventToDelete) {
                    console.log('⚠️ Event not found for deletion:', uid);
                    return;
                }
                
                // Mark event as deleted by adding isDeleted flag to list
                const existingList = eventToDelete.list || [];
                // Remove any existing isDeleted or deletedTime items
                const filteredList = existingList.filter((item: any) => 
                    item.key !== 'isDeleted' && item.key !== 'deletedTime'
                );
                // Add isDeleted and deletedTime (format: YYYYMMDDTHHMMSS expected by parseTimeToPST)
                const now = new Date();
                const deletedTime = [
                    now.getFullYear().toString().padStart(4, '0'),
                    (now.getMonth() + 1).toString().padStart(2, '0'),
                    now.getDate().toString().padStart(2, '0'),
                ].join('') +
                    'T' +
                    [
                        now.getHours().toString().padStart(2, '0'),
                        now.getMinutes().toString().padStart(2, '0'),
                        now.getSeconds().toString().padStart(2, '0'),
                    ].join('');
                const updatedList = [
                    ...filteredList,
                    { key: 'isDeleted', value: 'true' },
                    { key: 'deletedTime', value: deletedTime }
                ];
                
                const markedAsDeletedEvent = {
                    ...eventToDelete,
                    list: updatedList
                };
                
                // Remove from active events
                const activeEvents = currentEvents.filter(event => event.uid !== uid);
                
                // Add to deleted events (avoid duplicates)
                const updatedDeletedEvents = currentDeletedEvents.filter(event => event.uid !== uid);
                updatedDeletedEvents.push(markedAsDeletedEvent);
                
                set({ 
                    userEvents: activeEvents,
                    deletedUserEvents: updatedDeletedEvents
                });
                console.log('✅ Optimistically deleted event:', uid, '- Active events:', activeEvents.length, '- Deleted events:', updatedDeletedEvents.length);
            },
            
            optimisticallyRestoreEvent: (uid: string) => {
                const currentDeletedEvents = get().deletedUserEvents;
                const currentEvents = get().userEvents;
                
                // Find the event in deleted events
                const eventToRestore = currentDeletedEvents.find(event => event.uid === uid);
                if (!eventToRestore) {
                    console.warn('Event not found in deleted events:', uid);
                    return;
                }
                
                // Remove from deleted events
                const updatedDeletedEvents = currentDeletedEvents.filter(event => event.uid !== uid);
                
                // Add to active events with optimistic flag
                const restoredEvent = {
                    ...eventToRestore,
                    list: [
                        ...(eventToRestore.list || []).filter(item => 
                            item.key !== 'isDeleted' && 
                            item.key !== 'deletedTime' && 
                            item.key !== '_optimistic'
                        ),
                        { key: 'isDeleted', value: 'false' },
                        { key: '_optimistic', value: 'true' }
                    ]
                };
                
                const updatedEvents = [...currentEvents, restoredEvent];
                const activeEvents = updatedEvents.filter(ev => {
                    if (!ev.list) return true;
                    const isDeletedItem = ev.list.find(item => item.key === 'isDeleted');
                    return !isDeletedItem || isDeletedItem.value !== 'true';
                });
                
                set({ 
                    userEvents: activeEvents,
                    deletedUserEvents: updatedDeletedEvents
                });
                console.log('✅ Optimistically restored event:', uid, '- Deleted events:', updatedDeletedEvents.length);
            },
            
            optimisticallyPermanentDeleteEvent: (uid: string) => {
                const currentDeletedEvents = get().deletedUserEvents;
                const filteredDeletedEvents = currentDeletedEvents.filter(event => event.uid !== uid);
                set({ deletedUserEvents: filteredDeletedEvents });
                console.log('✅ Optimistically permanently deleted event:', uid, '- Deleted events:', filteredDeletedEvents.length);
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
            
            revertOptimisticDeletedUpdate: (previousDeletedEvents: UserEvent[]) => {
                set({ deletedUserEvents: previousDeletedEvents });
                console.log('↩️ Reverted optimistic deleted events update');
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
