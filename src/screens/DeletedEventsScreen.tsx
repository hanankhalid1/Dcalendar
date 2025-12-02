import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Alert,
    StatusBar,
    Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useEventsStore } from '../stores/useEventsStore';
import { parseTimeToPST } from '../utils';
import {
    moderateScale,
    scaleHeight,
    scaleWidth,
    screenHeight,
} from '../utils/dimensions';
import {
    colors,
    fontSize,
    spacing,
    borderRadius,
    shadows,
} from '../utils/LightTheme';
import CustomLoader from '../global/CustomLoader';
import CustomDrawer from '../components/CustomDrawer';
import { useActiveAccount } from '../stores/useActiveAccount';
import { BlockchainService } from '../services/BlockChainService';
import { useToken } from '../stores/useTokenStore';
import { useApiClient } from '../hooks/useApi';
import { get } from 'react-native/Libraries/TurboModule/TurboModuleRegistry';
import PlainHeader from '../components/PlainHeader';
import { buildEventMetadata, prepareEventForBlockchain, encryptWithNECJS } from '../utils/eventUtils';
import moment from 'moment';


const DeletedEventsScreen: React.FC = () => {
    const navigation = useNavigation();
    const { 
        deletedUserEvents, 
        userEventsLoading, 
        getUserEvents,
        optimisticallyRestoreEvent,
        optimisticallyPermanentDeleteEvent,
        revertOptimisticDeletedUpdate
    } = useEventsStore();
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const activeAccount = useActiveAccount(state => state.account);
    const blockchainService = React.useMemo(() => new BlockchainService(), []);
    const token = useToken.getState().token;
    const { api } = useApiClient();

    console.log('Deleted Events in delete screen:', deletedUserEvents);
    const handleMenuPress = () => {
        setIsDrawerOpen(true);
    };

    const handleDrawerClose = () => {
        setIsDrawerOpen(false);
    };

    const formatDate = (dateString: string) => {
        const date = parseTimeToPST(dateString);
        if (!date) return 'Invalid Date';

        return date.toLocaleDateString('en-US', {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    const formatTime = (dateString: string) => {
        const date = parseTimeToPST(dateString);
        if (!date) return 'Invalid Time';

        return date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
        });
    };

    const getDeletedTime = (event: any) => {
        const deletedTimeItem = event.list?.find((item: any) => item.key === 'deletedTime');
        if (deletedTimeItem) {
            // Parse the deleted time (format: 20250919T080201)
            const deletedTimeStr = deletedTimeItem.value;
            const year = deletedTimeStr.substring(0, 4);
            const month = deletedTimeStr.substring(4, 6);
            const day = deletedTimeStr.substring(6, 8);
            const hour = deletedTimeStr.substring(9, 11);
            const minute = deletedTimeStr.substring(11, 13);
            const second = deletedTimeStr.substring(13, 15);

            const deletedDate = new Date(
                parseInt(year),
                parseInt(month) - 1,
                parseInt(day),
                parseInt(hour),
                parseInt(minute),
                parseInt(second)
            );

            return deletedDate.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                hour12: true,
            });
        }
        return 'Unknown';
    };



    const handleRestoreEvent = (event: any) => {
        Alert.alert(
            'Restore Event',
            `Are you sure you want to restore "${event.title}"?`,
            [
                {
                    text: 'Cancel',
                    style: 'cancel',
                },
                {
                    text: 'Restore',
                    style: 'default',
                    onPress: async () => {
                        // Store current deleted events for potential revert
                        const previousDeletedEvents = [...(deletedUserEvents || [])];
                        
                        try {
                            // ✅ OPTIMISTIC UPDATE: Remove from deleted events immediately
                            optimisticallyRestoreEvent(event.uid);
                            
                            // ✅ BACKGROUND OPERATIONS: Run blockchain/API calls in background (non-blocking)
                            (async () => {
                                try {
                                    // Restore event on blockchain (this will take time, but UI already updated)
                                    await blockchainService.restoreEvent(event, activeAccount, token, api);
                                    
                                    // No immediate refresh needed - optimistic update already updated UI
                                    // Skip getUserEvents to avoid loading screen - UI is already correct
                                } catch (err) {
                                    console.error("Restore Event Failed:", err);
                                    // Revert optimistic update on error
                                    revertOptimisticDeletedUpdate(previousDeletedEvents);
                                    Alert.alert("Error", "Failed to restore event. Please try again.");
                                }
                            })();
                        } catch (error: any) {
                            console.error('❌ Error in handleRestoreEvent:', error);
                            // Revert optimistic update on error
                            revertOptimisticDeletedUpdate(previousDeletedEvents);
                            Alert.alert('Error', error?.message || 'Failed to restore event. Please try again.');
                        }
                    },
                },
            ]
        );
    };

    const handlePermanentDelete = (event: any) => {
        Alert.alert(
            'Permanently Delete',
            `Are you sure you want to permanently delete "${event.title}"? This action cannot be undone.`,
            [
                {
                    text: 'Cancel',
                    style: 'cancel',
                },
                {
                    text: 'Delete Forever',
                    style: 'destructive',
                    onPress: async () => {
                        // Store current deleted events for potential revert
                        const previousDeletedEvents = [...(deletedUserEvents || [])];
                        
                        // ✅ START CONTRACT CALLS IMMEDIATELY (before optimistic update) for wallet auth
                        // Pre-fetch data in parallel to trigger wallet auth as fast as possible
                        const publicKeyPromise = blockchainService.hostContract.methods
                            .getPublicKeyOfUser(activeAccount?.userName)
                            .call()
                            .catch(err => {
                                console.warn('Pre-fetch public key failed, will fetch later:', err);
                                return null;
                            });

                        const allEventsPromise = blockchainService.getAllEvents(activeAccount.userName)
                            .catch(err => {
                                console.warn('Pre-fetch events failed, will fetch later:', err);
                                return { events: [] };
                            });

                        // ✅ OPTIMISTIC UPDATE: Remove from deleted events immediately (instant UI update)
                        optimisticallyPermanentDeleteEvent(event.uid);
                        
                        // ✅ BACKGROUND OPERATIONS: Run blockchain/API calls in background (non-blocking)
                        (async () => {
                            try {
                                // ✅ Wait for pre-fetched data in parallel
                                const [publicKey, allEvents] = await Promise.all([publicKeyPromise, allEventsPromise]);
                                
                                // Find the event and its UUID
                                const selected = (allEvents.events || []).find((ev: any) =>
                                    ev && (ev.uid === event.uid)
                                );

                                if (!selected) {
                                    throw new Error('Event not found');
                                }

                                // Prepare event data for permanent delete (same as blockchain service)
                                const listValue = (selected.list || []).filter((data: any) =>
                                    !(data.key === "isDeleted" || data.key === "deletedTime")
                                );

                                const updatedEvent = {
                                    ...selected,
                                    list: [
                                        ...listValue,
                                        { key: "isDeleted", value: "true" },
                                        { key: "isPermanentDelete", value: "true" },
                                        { key: "deletedTime", value: moment.utc().format("YYYYMMDDTHHmmss") }
                                    ]
                                };

                                const uid = updatedEvent.uid;
                                const uuid = selected.uuid;

                                // Prepare encryption data
                                const conferencingData = null;
                                const metadata = buildEventMetadata(updatedEvent as any, conferencingData);
                                const eventParams = prepareEventForBlockchain(updatedEvent as any, metadata, uid);
                                const encryptionData = JSON.stringify(eventParams);

                                // ✅ TRIGGER WALLET AUTHENTICATION IMMEDIATELY (like create/update)
                                // Start encryption as soon as we have public key - this shows the wallet modal FAST
                                // This triggers wallet authentication modal immediately
                                if (publicKey) {
                                    console.log('🔐 Triggering wallet authentication for permanent delete...');
                                    // Start encryption immediately - this triggers wallet auth modal
                                    // Don't await - let it run in parallel with blockchain operations
                                    encryptWithNECJS(
                                        encryptionData,
                                        publicKey,
                                        token,
                                        [uuid] // Use the existing UUID
                                    ).then(() => {
                                        console.log('✅ Wallet authentication triggered for permanent delete');
                                    }).catch(err => {
                                        console.error('❌ Early encryption failed (will retry in blockchain service):', err);
                                    });
                                } else {
                                    console.warn('⚠️ No public key available for wallet authentication');
                                }

                                // ✅ Continue with blockchain operations (they will also encrypt, but auth is already triggered)
                                // Wallet auth modal should already be showing from the early encryption call above
                                await blockchainService.deleteEventPermanent(event.uid, activeAccount, token, api);
                                
                                // No refresh needed - optimistic update already removed it from UI
                                // Skip getUserEvents to avoid loading screen - UI is already correct
                            } catch (err) {
                                console.error("Permanent Delete Event Failed:", err);
                                // Revert optimistic update on error
                                revertOptimisticDeletedUpdate(previousDeletedEvents);
                                Alert.alert("Error", "Failed to permanently delete event. Please try again.");
                            }
                        })();
                    },
                },
            ]
        );
    };

    const renderEventCard = (event: any, index: number) => {
        return (
            <View key={event.uid || index} style={styles.eventCard}>
                <View style={styles.eventHeader}>
                    <Text style={styles.eventTitle} numberOfLines={2}>
                        {event.title}
                    </Text>
                    <View style={styles.eventActions}>
                        <TouchableOpacity
                            style={[styles.actionButton, styles.restoreButton]}
                            onPress={() => handleRestoreEvent(event)}
                        >
                            <Text style={styles.restoreButtonText}>Restore</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.actionButton, styles.deleteButton]}
                            onPress={() => handlePermanentDelete(event)}
                        >
                            <Text style={styles.deleteButtonText}>Delete</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {event.description && (
                    <Text style={styles.eventDescription} numberOfLines={3}>
                        {event.description}
                    </Text>
                )}

                <View style={styles.eventDetails}>
                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Date:</Text>
                        <Text style={styles.detailValue}>{formatDate(event.fromTime)}</Text>
                    </View>

                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Time:</Text>
                        <Text style={styles.detailValue}>
                            {formatTime(event.fromTime)} - {formatTime(event.toTime)}
                        </Text>
                    </View>

                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Deleted:</Text>
                        <Text style={styles.detailValue}>{getDeletedTime(event)}</Text>
                    </View>
                </View>
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <PlainHeader onMenuPress={handleMenuPress} title="Deleted Events" />

            {userEventsLoading ? (
                <CustomLoader />
            ) : deletedUserEvents.length === 0 ? (
                <View style={styles.emptyState}>
                    <Text style={styles.emptyStateIcon}>🗑️</Text>
                    <Text style={styles.emptyStateTitle}>No Deleted Events</Text>
                    <Text style={styles.emptyStateDescription}>
                        Events you delete will appear here. You can restore them or delete them permanently.
                    </Text>
                </View>
            ) : (
                <ScrollView
                    style={styles.content}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.scrollContent}
                >
                    <View style={styles.header}>
                        <Text style={styles.headerTitle}>
                            {deletedUserEvents.length} Deleted Event{deletedUserEvents.length !== 1 ? 's' : ''}
                        </Text>
                        <Text style={styles.headerSubtitle}>
                            Tap "Restore" to bring back an event or "Delete" to remove it permanently.
                        </Text>
                    </View>

                    {deletedUserEvents.map((event, index) => renderEventCard(event, index))}
                </ScrollView>
            )}

            {/* Custom Drawer */}
            <CustomDrawer
                isOpen={isDrawerOpen}
                onClose={handleDrawerClose}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    content: {
        flex: 1,
    },
    scrollContent: {
        padding: spacing.md,
    },
    header: {
        marginBottom: spacing.lg,
        paddingBottom: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: colors.lightGrayishBlue,
    },
    headerTitle: {
        fontSize: fontSize.textSize20,
        fontWeight: '700',
        color: colors.blackText,
        marginBottom: spacing.xs,
    },
    headerSubtitle: {
        fontSize: fontSize.textSize14,
        color: colors.mediumgray,
        lineHeight: 20,
    },
    eventCard: {
        backgroundColor: '#F6F7F9', // Match EventCard background
        borderRadius: borderRadius.lg,
        padding: spacing.md,
        marginBottom: spacing.md,
        borderLeftWidth: 4,
        borderLeftColor: colors.error,
        borderWidth: 1,
        borderColor: '#ACCFFF', // Match DaySection border color
    },
    eventHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: spacing.sm,
    },
    eventTitle: {
        fontSize: fontSize.textSize16,
        fontWeight: '600',
        color: colors.blackText,
        flex: 1,
        marginRight: spacing.sm,
    },
    eventActions: {
        flexDirection: 'row',
        gap: spacing.xs,
    },
    actionButton: {
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.xs,
        borderRadius: borderRadius.sm,
        minWidth: scaleWidth(60),
        alignItems: 'center',
        ...shadows.sm,
    },
    restoreButton: {
        backgroundColor: colors.primary,
    },
    restoreButtonText: {
        color: colors.white,
        fontSize: fontSize.textSize12,
        fontWeight: '600',
    },
    deleteButton: {
        backgroundColor: colors.error,
    },
    deleteButtonText: {
        color: colors.white,
        fontSize: fontSize.textSize12,
        fontWeight: '600',
    },
    eventDescription: {
        fontSize: fontSize.textSize14,
        color: colors.mediumgray,
        marginBottom: spacing.sm,
        lineHeight: 20,
    },
    eventDetails: {
        gap: spacing.xs,
    },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    detailLabel: {
        fontSize: fontSize.textSize12,
        color: colors.mediumgray,
        fontWeight: '500',
        width: scaleWidth(60),
    },
    detailValue: {
        fontSize: fontSize.textSize12,
        color: colors.blackText,
        fontWeight: '400',
        flex: 1,
    },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: spacing.xl,
    },
    emptyStateIcon: {
        fontSize: moderateScale(64),
        marginBottom: spacing.lg,
    },
    emptyStateTitle: {
        fontSize: fontSize.textSize20,
        fontWeight: '600',
        color: colors.blackText,
        marginBottom: spacing.sm,
        textAlign: 'center',
    },
    emptyStateDescription: {
        fontSize: fontSize.textSize14,
        color: colors.mediumgray,
        textAlign: 'center',
        lineHeight: 20,
    },
});



export default DeletedEventsScreen;
