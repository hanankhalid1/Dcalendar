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
                    
                    // Fetch appointments from API (like web does)
                    let appointmentsFromAPI: any[] = [];
                    try {
                        console.log('📅 [getUserEvents] Fetching appointments from API...');
                        const appointmentsResponse = await apiClient('GET', `/appointmentScheduleList/${userName}`);
                        appointmentsFromAPI = appointmentsResponse?.data?.data || appointmentsResponse?.data || [];
                        console.log('📅 [getUserEvents] Appointments from API:', appointmentsFromAPI.length);
                        if (appointmentsFromAPI.length > 0) {
                            console.log('📅 [getUserEvents] API appointment IDs:', appointmentsFromAPI.map((apt: any) => ({
                                appointment_schedule_id: apt.appointment_schedule_id,
                                appointment_title: apt.appointment_title,
                                appointment_uid: apt.appointment_uid
                            })));
                        }
                    } catch (apiError) {
                        console.warn('⚠️ [getUserEvents] Failed to fetch appointments from API:', apiError);
                        // Continue without appointments - don't fail the whole operation
                    }
                    
                    // Fetch events from blockchain
                    const hostContract = new BlockchainService(Config.NECJSPK);
                    const blockchainEvents = await hostContract.getAllEvents(userName);
                    console.log('🔍 [getUserEvents] Blockchain events:', blockchainEvents);
                    console.log('🔍 [getUserEvents] UUIDs count:', blockchainEvents?.uuids?.length || 0);
                    
                    // Log appointments from blockchain
                    const appointmentsFromBlockchain = blockchainEvents.events.filter((event: any) => 
                        event.uid?.startsWith('appt_') || 
                        event.list?.some((item: any) => item?.key === 'appointment')
                    );
                    console.log('📅 [getUserEvents] Appointments from blockchain:', appointmentsFromBlockchain.length);
                    if (appointmentsFromBlockchain.length > 0) {
                        console.log('📅 [getUserEvents] Blockchain appointment UIDs:', appointmentsFromBlockchain.map(apt => ({
                            uid: apt.uid,
                            title: apt.title,
                            fromTime: apt.fromTime,
                            list: apt.list
                        })));
                    } else {
                        console.log('⚠️ [getUserEvents] NO appointments found in blockchain events');
                        console.log('📋 [getUserEvents] Sample blockchain event UIDs:', blockchainEvents.events.slice(0, 3).map((e: any) => ({
                            uid: e.uid,
                            title: e.title,
                            hasList: !!e.list
                        })));
                    }

                    // Convert API appointments to event-like format for merging
                    const normalizedApiAppointments = appointmentsFromAPI.map((apt: any) => {
                        // Helper function to decode hex strings (like web code does)
                        const decodeHex = (hexString: string | null | undefined): string => {
                            if (!hexString || typeof hexString !== 'string') return '';
                            try {
                                // Check if it's a hex string (starts with 0x or all hex chars)
                                if (hexString.startsWith('0x')) {
                                    hexString = hexString.substring(2);
                                }
                                // Convert hex to string
                                let result = '';
                                for (let i = 0; i < hexString.length; i += 2) {
                                    const hex = hexString.substr(i, 2);
                                    const charCode = parseInt(hex, 16);
                                    if (charCode > 0) {
                                        result += String.fromCharCode(charCode);
                                    }
                                }
                                return result.trim() || hexString; // Return original if decode fails
                            } catch {
                                return hexString; // Return original if decode fails
                            }
                        };
                        
                        // Decode hex-encoded fields
                        // Priority: decoded appointment_title > raw appointment_title > title (but not if title is just an ID)
                        let decodedTitle = '';
                        if (apt.appointment_title) {
                            decodedTitle = decodeHex(apt.appointment_title) || apt.appointment_title;
                        } else if (apt.title && !apt.title.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i) && !apt.title.match(/^appt_/)) {
                            // Use title only if it's not a UUID or appointment ID
                            decodedTitle = apt.title;
                        }
                        decodedTitle = decodedTitle || 'Untitled Appointment';
                        
                        const decodedDescription = decodeHex(apt.appointment_description) || apt.appointment_description || apt.description || '';
                        
                        console.log('📝 [getUserEvents] Decoding appointment:', {
                            appointment_schedule_id: apt.appointment_schedule_id,
                            raw_appointment_title: apt.appointment_title,
                            decoded_title: decodedTitle,
                            raw_title: apt.title
                        });
                        
                        // Generate UID if not present
                        const appointmentUID = apt.appointment_uid || apt.appointment_schedule_id || `appt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                        
                        // Get current time in event format if not present
                        const currentTime = new Date();
                        const fromTime = currentTime.toISOString().replace(/[-:]/g, '').split('.')[0];
                        const toTime = new Date(currentTime.getTime() + 30 * 60000).toISOString().replace(/[-:]/g, '').split('.')[0];
                        
                        // Build normalized appointment object - spread apt FIRST, then override with decoded values
                        const normalized = {
                            // Spread all original fields first (but exclude title to avoid overwriting)
                            ...Object.fromEntries(
                                Object.entries(apt).filter(([key]) => key !== 'title')
                            ),
                            // Override with normalized values (these take precedence)
                            uid: appointmentUID,
                            appointment_uid: appointmentUID,
                            title: decodedTitle, // ✅ Use decoded title, not ID
                            appointment_title: decodedTitle, // ✅ Use decoded title
                            description: decodedDescription, // ✅ Use decoded description
                            appointment_description: decodedDescription,
                            fromTime: fromTime,
                            toTime: toTime,
                            done: false,
                            list: [
                                { 
                                    key: 'appointment', 
                                    value: 'appointment',
                                    color: '#18F06E'
                                }
                            ],
                        };
                        
                        return normalized;
                    });
                    
                    console.log('📅 [getUserEvents] Normalized API appointments:', normalizedApiAppointments.length);

                    // If no blockchain events, still proceed with API appointments
                    if (blockchainEvents.uuids.length === 0 && normalizedApiAppointments.length === 0) {
                        set({ userEvents: [], userEncryptedEvents: [], userEventsLoading: false, blockchainEventsMetadata: [] });
                        console.log('⚠️ [getUserEvents] No events or appointments found for user:', userName);
                        return;
                    }
                    
                    // Store blockchain metadata to merge with decrypted data later
                    set({ blockchainEventsMetadata: blockchainEvents.events });
                    console.log('📋 [getUserEvents] Stored blockchain metadata for', blockchainEvents.events.length, 'events');
                    
                    // If we have blockchain events, fetch encrypted data
                    let encrypted: any[] = [];
                    if (blockchainEvents.uuids.length > 0) {
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
                            encrypted = res?.data?.value;
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
                                    
                                    // Store normalized API appointments temporarily - they'll be merged after decryption in ncogHandler
                                    // For now, we'll add them directly to the store after a delay
                                    setTimeout(() => {
                                        const currentEvents = get().userEvents || [];
                                        const existingAppointmentUIDs = new Set(
                                            currentEvents.map((e: any) => e.uid || e.appointment_uid).filter(Boolean)
                                        );
                                        
                                        // Only add appointments that aren't already in the store
                                        const newAppointments = normalizedApiAppointments.filter((apt: any) => 
                                            !existingAppointmentUIDs.has(apt.uid)
                                        );
                                        
                                        if (newAppointments.length > 0) {
                                            console.log('📅 [getUserEvents] Adding', newAppointments.length, 'API appointments to store');
                                            const { setUserEvents } = get();
                                            setUserEvents([...currentEvents, ...newAppointments]);
                                        }
                                    }, 2000);
                                } catch (e) {
                                    console.error('❌ [getUserEvents] Ncog decrypt request failed:', e);
                                    console.error('❌ [getUserEvents] Error details:', e);
                                    
                                    // If decryption fails, still add API appointments
                                    const currentEvents = get().userEvents || [];
                                    const { setUserEvents } = get();
                                    setUserEvents([...currentEvents, ...normalizedApiAppointments]);
                                }
                            } else {
                                console.warn('⚠️ [getUserEvents] Encrypted data is not a valid array or is empty');
                                // Still add API appointments even if no encrypted events
                                const currentEvents = get().userEvents || [];
                                const { setUserEvents } = get();
                                setUserEvents([...currentEvents, ...normalizedApiAppointments]);
                            }
                        } else {
                            console.warn('⚠️ [getUserEvents] No value in API response:', res?.data);
                            // Still add API appointments even if no encrypted events
                            const currentEvents = get().userEvents || [];
                            const { setUserEvents } = get();
                            setUserEvents([...currentEvents, ...normalizedApiAppointments]);
                            set({ userEventsLoading: false });
                        }
                    } else {
                        // No blockchain events, but we have API appointments
                        if (normalizedApiAppointments.length > 0) {
                            console.log('📅 [getUserEvents] Setting API appointments directly (no blockchain events)');
                            const { setUserEvents } = get();
                            setUserEvents(normalizedApiAppointments);
                            set({ userEventsLoading: false });
                        } else {
                            set({ userEventsLoading: false });
                        }
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
