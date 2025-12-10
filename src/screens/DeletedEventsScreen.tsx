import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  StatusBar,
  Modal,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useEventsStore } from '../stores/useEventsStore';
import { parseTimeToPST } from '../utils';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Feather from 'react-native-vector-icons/Feather';
import TrashIcon from '../assets/svgs/trash.svg';
import {
  moderateScale,
  scaleHeight,
  scaleWidth,
  screenHeight,
  screenWidth,
} from '../utils/dimensions';
import {
  colors,
  fontSize,
  spacing,
  borderRadius,
  shadows,
} from '../utils/LightTheme';
import { Fonts } from '../constants/Fonts';
import CustomLoader from '../global/CustomLoader';
import CustomDrawer from '../components/CustomDrawer';
import { useActiveAccount } from '../stores/useActiveAccount';
import { BlockchainService } from '../services/BlockChainService';
import { useToken } from '../stores/useTokenStore';
import { useApiClient } from '../hooks/useApi';
import PlainHeader from '../components/PlainHeader';
import {
  buildEventMetadata,
  prepareEventForBlockchain,
  encryptWithNECJS,
} from '../utils/eventUtils';
import moment from 'moment';

const DeletedEventsScreen: React.FC = () => {
  const navigation = useNavigation();
  const {
    deletedUserEvents,
    userEventsLoading,
    getUserEvents,
    optimisticallyRestoreEvent,
    optimisticallyPermanentDeleteEvent,
    revertOptimisticDeletedUpdate,
  } = useEventsStore();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedEventMenu, setSelectedEventMenu] = useState<string | null>(
    null,
  );
  const [menuPosition, setMenuPosition] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);
  const [showClearBinModal, setShowClearBinModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [eventToDelete, setEventToDelete] = useState<any>(null);
  const menuButtonRefs = React.useRef<{ [key: string]: View | null }>({});
  const activeAccount = useActiveAccount(state => state.account);
  const blockchainService = React.useMemo(() => new BlockchainService(), []);
  const token = useToken.getState().token;
  const { api } = useApiClient();

  // Debug: Log when modal state changes
  useEffect(() => {
    console.log('🔔 MODAL STATE CHANGE:');
    console.log('  showDeleteModal:', showDeleteModal);
    console.log('  eventToDelete:', eventToDelete);
    console.log('  eventToDelete?.title:', eventToDelete?.title);
    if (showDeleteModal) {
      console.log('✅ Modal should be VISIBLE now!');
    } else {
      console.log('❌ Modal is HIDDEN');
    }
  }, [showDeleteModal, eventToDelete]);

  const handleMenuPress = () => {
    setIsDrawerOpen(true);
  };

  const handleDrawerClose = () => {
    setIsDrawerOpen(false);
  };

  const formatDateHeader = (dateString: string) => {
    const date = parseTimeToPST(dateString);
    if (!date) return 'Invalid Date';

    return date.toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    const date = parseTimeToPST(dateString);
    if (!date) return 'Invalid Time';

    return date
      .toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      })
      .toLowerCase()
      .replace(' ', '');
  };

  const calculateDuration = (fromTime: string, toTime: string) => {
    const from = parseTimeToPST(fromTime);
    const to = parseTimeToPST(toTime);
    if (!from || !to) return '0h';

    const diffMs = to.getTime() - from.getTime();
    const diffHours = Math.round(diffMs / (1000 * 60 * 60));
    return `${diffHours}h`;
  };

  const getEventType = (event: any) => {
    // Check if it's a task or event based on event properties
    const typeItem = event.list?.find((item: any) => item.key === 'type');
    if (typeItem?.value === 'task' || event.type === 'task') {
      return 'task';
    }
    return 'event';
  };

  const groupEventsByDate = () => {
    const grouped: { [key: string]: any[] } = {};
    // Remove duplicates by UID before grouping
    const uniqueEventsMap = new Map();
    deletedUserEvents.forEach(event => {
      if (event.uid && !uniqueEventsMap.has(event.uid)) {
        uniqueEventsMap.set(event.uid, event);
      }
    });
    const uniqueEvents = Array.from(uniqueEventsMap.values());

    uniqueEvents.forEach(event => {
      const dateKey = formatDateHeader(event.fromTime);
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(event);
    });
    return grouped;
  };

  const handleClearBin = () => {
    setShowClearBinModal(true);
  };

  const handleConfirmClearBin = async () => {
    setShowClearBinModal(false);
    // Delete all events permanently
    for (const event of deletedUserEvents) {
      await blockchainService.deleteEventPermanent(
        event.uid,
        activeAccount,
        token,
        api,
      );
    }
  };

  const handleRestore = async (event: any) => {
    setSelectedEventMenu(null);
    setMenuPosition(null);
    try {
      // Optimistically restore event by removing isDeleted flag
      const { setUserEvents, userEvents, deletedUserEvents } =
        useEventsStore.getState();
      // Combine all events and remove duplicates by UID (keep the first occurrence)
      const allEventsMap = new Map();
      [...(userEvents || []), ...(deletedUserEvents || [])].forEach(
        (ev: any) => {
          if (!allEventsMap.has(ev.uid)) {
            allEventsMap.set(ev.uid, ev);
          }
        },
      );
      const allEvents = Array.from(allEventsMap.values());

      const updatedEvents = allEvents.map((ev: any) => {
        if (ev.uid === event.uid) {
          const existingList = ev.list || [];
          const filteredList = existingList.filter(
            (item: any) =>
              item.key !== 'isDeleted' && item.key !== 'deletedTime',
          );
          return {
            ...ev,
            list: filteredList,
          };
        }
        return ev;
      });
      setUserEvents(updatedEvents);

      // Restore on blockchain
      await blockchainService.restoreEvent(event, activeAccount, token, api);

      // Refresh events in background
      getUserEvents(activeAccount.userName, api).catch(err => {
        console.error('Background event refresh failed:', err);
      });
    } catch (err) {
      console.error('Restore Event Failed:', err);
      Alert.alert('Error', 'Failed to restore the event');
      // Refresh to revert optimistic update
      getUserEvents(activeAccount.userName, api);
    }
  };

  const handleDelete = (event: any) => {
    console.log('========== handleDelete START ==========');
    console.log('handleDelete called with event:', event);
    console.log('Event UID:', event?.uid);
    console.log('Event title:', event?.title);

    // Close menu modal first
    console.log('Closing menu modal...');
    setSelectedEventMenu(null);
    setMenuPosition(null);

    // Set event and show modal immediately
    console.log('Setting eventToDelete and showDeleteModal...');
    setEventToDelete(event);
    setShowDeleteModal(true);

    console.log('showDeleteModal should now be: true');
    console.log('eventToDelete should now be:', event);
    console.log('========== handleDelete END ==========');
  };

  const handleConfirmDelete = async () => {
    if (eventToDelete) {
      setShowDeleteModal(false);
      try {
        await blockchainService.deleteEventPermanent(
          eventToDelete.uid,
          activeAccount,
          token,
          api,
        );
        // Refresh events after deletion
        await getUserEvents(activeAccount.userName, api);
      } catch (error) {
        console.error('Error deleting event permanently:', error);
        Alert.alert('Error', 'Failed to permanently delete the event');
      } finally {
        setEventToDelete(null);
      }
    }
  };

  const renderEventCard = (event: any, index: number) => {
    const eventType = getEventType(event);
    const duration = calculateDuration(event.fromTime, event.toTime);
    const startTime = formatTime(event.fromTime);
    const endTime = formatTime(event.toTime);
    const timeRange = `${startTime}-${endTime}`;

    return (
      <View key={event.uid || `event-${index}`} style={styles.eventCard}>
        <View style={styles.eventContent}>
          <Text
            style={styles.eventTitle}
            numberOfLines={2}
            ellipsizeMode="tail"
          >
            {event.title}
          </Text>

          <View style={styles.eventLabels}>
            {/* Time/Duration Label */}
            <View style={styles.timeLabel}>
              <View style={styles.strikethroughIcon}>
                <Feather name="clock" size={12} color="#717680" />
              </View>
              <Text style={styles.timeLabelText} numberOfLines={1}>
                {duration} ({timeRange})
              </Text>
            </View>

            {/* Event/Task Type Label */}
            <View
              style={[
                styles.typeLabel,
                eventType === 'task' ? styles.taskLabel : styles.eventLabel,
              ]}
            >
              <View style={styles.strikethroughIcon}>
                {eventType === 'task' ? (
                  <Feather name="clipboard" size={12} color="#717680" />
                ) : (
                  <Feather name="calendar" size={12} color="#717680" />
                )}
              </View>
              <Text
                style={[
                  styles.typeLabelText,
                  eventType === 'task'
                    ? styles.taskLabelText
                    : styles.eventLabelText,
                ]}
                numberOfLines={1}
              >
                {eventType === 'task' ? 'Task' : 'Event'}
              </Text>
            </View>
          </View>
        </View>

        {/* Three Dots Menu */}
        <View
          ref={ref => {
            if (ref) menuButtonRefs.current[event.uid] = ref;
          }}
          style={styles.menuButtonContainer}
        >
          <TouchableOpacity
            style={styles.menuButton}
            onPress={() => {
              const ref = menuButtonRefs.current[event.uid];
              if (ref) {
                ref.measure((x, y, width, height, pageX, pageY) => {
                  setMenuPosition({ x: pageX, y: pageY, width, height });
                  setSelectedEventMenu(event.uid);
                });
              } else {
                setSelectedEventMenu(event.uid);
              }
            }}
          >
            <MaterialIcons name="more-vert" size={20} color="#000" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const groupedEvents = groupEventsByDate();
  const totalCount = deletedUserEvents.length;

  return (
    <View style={styles.container}>
      <PlainHeader onMenuPress={handleMenuPress} title="Recycle bin" />

      {userEventsLoading ? (
        <CustomLoader />
      ) : deletedUserEvents.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={styles.emptyIconContainer}>
            <TrashIcon
              width={moderateScale(32)}
              height={moderateScale(32)}
              fill={colors.primaryBlue}
            />
          </View>
          <Text style={styles.emptyStateTitle}>No Items Found</Text>
          <Text style={styles.emptyStateDescription}>
            You currently have no deleted or completed activities. Any activity
            removed or completed will be listed here for you to restore or
            delete forever.
          </Text>
        </View>
      ) : (
        <>
          <ScrollView
            style={styles.content}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* Header with Completed activities and Clear bin */}
            <View style={styles.headerSection}>
              <Text style={styles.headerTitle}>
                Completed activities ({totalCount})
              </Text>
              <TouchableOpacity onPress={handleClearBin}>
                <Text style={styles.clearBinButton}>Clear bin</Text>
              </TouchableOpacity>
            </View>

            {/* Grouped Events by Date */}
            {Object.entries(groupedEvents).map(([dateKey, events]) => (
              <View key={dateKey} style={styles.dateGroup}>
                <View style={styles.dateHeader}>
                  <Text style={styles.dateHeaderText} numberOfLines={1}>
                    {dateKey}
                  </Text>
                  <View style={styles.dateDivider} />
                </View>
                {events.map((event, index) => renderEventCard(event, index))}
              </View>
            ))}
          </ScrollView>

          {/* Menu Modal - positioned correctly */}
          {selectedEventMenu && menuPosition && (
            <Modal
              transparent={true}
              visible={true}
              onRequestClose={() => {
                setSelectedEventMenu(null);
                setMenuPosition(null);
              }}
              animationType="fade"
            >
              <TouchableOpacity
                style={styles.menuOverlay}
                activeOpacity={1}
                onPress={() => {
                  setSelectedEventMenu(null);
                  setMenuPosition(null);
                }}
              >
                <View
                  style={[
                    styles.menuPopup,
                    {
                      position: 'absolute',
                      top:
                        menuPosition.y + menuPosition.height + scaleHeight(4),
                      right: screenWidth - menuPosition.x - menuPosition.width,
                    },
                  ]}
                >
                  <TouchableOpacity
                    style={styles.menuItem}
                    onPress={() => {
                      const event = deletedUserEvents.find(
                        e => e.uid === selectedEventMenu,
                      );
                      if (event) {
                        handleRestore(event);
                      }
                    }}
                  >
                    <Text style={styles.menuItemText}>Restore</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.menuItem}
                    onPress={() => {
                      console.log('Delete button clicked in menu');
                      console.log('selectedEventMenu:', selectedEventMenu);
                      const event = deletedUserEvents.find(
                        e => e.uid === selectedEventMenu,
                      );
                      console.log('Found event:', event);
                      if (event) {
                        console.log('Calling handleDelete with event:', event);
                        handleDelete(event);
                        setMenuPosition(null);
                      } else {
                        console.log(
                          'Event not found for uid:',
                          selectedEventMenu,
                        );
                      }
                    }}
                  >
                    <Text style={styles.menuItemDelete}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            </Modal>
          )}
        </>
      )}

      {/* Clear Bin Confirmation Modal */}
      <Modal
        transparent={true}
        visible={showClearBinModal}
        animationType="fade"
        onRequestClose={() => setShowClearBinModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowClearBinModal(false)}
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={e => e.stopPropagation()}
            style={styles.modalContainer}
          >
            <Text style={styles.modalTitle}>Clear bin?</Text>
            <Text style={styles.modalMessage}>
              Are you sure you want to delete all the completed activities in
              the bin? They will be permanently deleted and you cannot restore
              them.
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setShowClearBinModal(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalClearButton}
                onPress={handleConfirmClearBin}
              >
                <Text style={styles.modalClearText}>Clear</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Permanently Delete Confirmation Modal */}
      <Modal
        transparent={true}
        visible={showDeleteModal}
        animationType="fade"
        onRequestClose={() => {
          console.log('Modal onRequestClose called');
          setShowDeleteModal(false);
          setEventToDelete(null);
        }}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => {
            setShowDeleteModal(false);
            setEventToDelete(null);
          }}
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={e => e.stopPropagation()}
            style={styles.modalContainer}
          >
            <Text style={styles.modalTitle}>Permanently Delete</Text>
            <Text style={styles.modalMessage}>
              Are you sure you want to permanently delete "
              {eventToDelete?.title}"? This action cannot be undone.
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[
                  styles.modalCancelButton,
                  { backgroundColor: 'transparent' },
                ]}
                onPress={() => {
                  setShowDeleteModal(false);
                  setEventToDelete(null);
                }}
              >
                <Text style={[styles.modalCancelText, { color: '#000000' }]}>
                  CANCEL
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalDeleteButton,
                  { backgroundColor: '#FF4444' },
                ]}
                onPress={handleConfirmDelete}
              >
                <Text style={[styles.modalDeleteText, { color: '#FFFFFF' }]}>
                  DELETE
                </Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Custom Drawer */}
      <CustomDrawer isOpen={isDrawerOpen} onClose={handleDrawerClose} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing.xl,
  },
  headerSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: scaleWidth(20),
    paddingTop: scaleHeight(20),
    paddingBottom: scaleHeight(16),
  },
  headerTitle: {
    fontSize: moderateScale(18),
    fontWeight: '700',
    color: '#000',
    fontFamily: Fonts.latoBold,
  },
  clearBinButton: {
    fontSize: moderateScale(16),
    fontWeight: '500',
    color: '#00AEEF',
    fontFamily: Fonts.latoMedium,
  },
  dateGroup: {
    marginBottom: scaleHeight(24),
    paddingHorizontal: scaleWidth(20),
  },
  dateHeader: {
    fontSize: moderateScale(16),
    fontWeight: '600',
    color: '#000',
    marginBottom: scaleHeight(12),
    fontFamily: Fonts.latoBold,
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateHeaderText: {
    fontSize: moderateScale(16),
    fontWeight: '600',
    color: '#000',
    fontFamily: Fonts.latoBold,
    marginRight: scaleWidth(12),
  },
  dateDivider: {
    flex: 1,
    height: 1,
    backgroundColor: '#E0E0E0',
  },
  eventCardWrapper: {
    position: 'relative',
    marginBottom: scaleHeight(12),
  },
  eventCard: {
    backgroundColor: '#fff',
    borderRadius: moderateScale(12),
    padding: scaleWidth(16),
    borderLeftWidth: 4,
    borderLeftColor: '#00AEEF',
    ...shadows.sm,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: scaleHeight(12),
  },
  eventContent: {
    flex: 1,
  },
  eventTitle: {
    fontSize: moderateScale(16),
    fontWeight: '600',
    color: '#717680',
    marginBottom: scaleHeight(8),
    fontFamily: Fonts.latoBold,
    flexWrap: 'wrap',
    textDecorationLine: 'line-through',
  },
  eventLabels: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: scaleWidth(8),
  },
  timeLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: scaleWidth(8),
    paddingVertical: scaleHeight(4),
    borderRadius: moderateScale(16),
    backgroundColor: 'transparent',
    borderWidth: 0.5,
    borderColor: '#D5D7DA',
    gap: scaleWidth(4),
  },
  timeLabelText: {
    fontSize: moderateScale(12),
    fontWeight: '500',
    color: '#717680',
    fontFamily: Fonts.latoMedium,
    textDecorationLine: 'line-through',
  },
  typeLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: scaleWidth(8),
    paddingVertical: scaleHeight(4),
    borderRadius: moderateScale(16),
    borderWidth: 0.5,
    gap: scaleWidth(4),
  },
  eventLabel: {
    backgroundColor: 'transparent',
    borderColor: '#00AEEF',
    borderWidth: 1,
  },
  taskLabel: {
    backgroundColor: 'transparent',
    borderColor: '#10B981',
    borderWidth: 1,
  },
  typeLabelText: {
    fontSize: moderateScale(12),
    fontWeight: '500',
    color: '#717680',
    fontFamily: Fonts.latoMedium,
    textDecorationLine: 'line-through',
  },
  eventLabelText: {
    color: '#717680',
  },
  taskLabelText: {
    color: '#717680',
  },
  menuButtonContainer: {
    marginLeft: scaleWidth(8),
  },
  menuButton: {
    padding: scaleWidth(4),
  },
  menuPopup: {
    backgroundColor: '#fff',
    borderRadius: moderateScale(8),
    paddingVertical: scaleHeight(4),
    minWidth: scaleWidth(120),
    ...shadows.md,
  },
  strikethroughIcon: {
    opacity: 0.6,
  },
  menuOverlay: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  menuItem: {
    paddingHorizontal: scaleWidth(16),
    paddingVertical: scaleHeight(12),
  },
  menuItemText: {
    fontSize: moderateScale(16),
    fontWeight: '400',
    color: '#000',
    fontFamily: Fonts.latoRegular,
  },
  menuItemDelete: {
    fontSize: moderateScale(16),
    fontWeight: '400',
    color: '#FF4444',
    fontFamily: Fonts.latoRegular,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
  },
  emptyIconContainer: {
    width: scaleWidth(72),
    height: scaleWidth(72),
    borderRadius: scaleWidth(36),
    backgroundColor: '#E5F2FB',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  emptyStateTitle: {
    fontSize: fontSize.textSize16,
    fontWeight: '700',
    color: colors.black,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  emptyStateDescription: {
    fontSize: fontSize.textSize14,
    color: '#717680',
    textAlign: 'center',
    lineHeight: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: scaleWidth(20),
    zIndex: 10000,
    elevation: 10000,
  },
  modalContainer: {
    backgroundColor: colors.white,
    borderRadius: moderateScale(16),
    padding: scaleWidth(24),
    width: '100%',
    maxWidth: scaleWidth(340),
    zIndex: 10001,
    elevation: 10001,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  modalTitle: {
    fontSize: fontSize.textSize18,
    fontWeight: '700',
    color: '#000',
    fontFamily: Fonts.latoBold,
    marginBottom: scaleHeight(16),
    textAlign: 'left',
  },
  modalMessage: {
    fontSize: fontSize.textSize14,
    fontWeight: '400',
    color: '#717680',
    fontFamily: Fonts.latoRegular,
    marginBottom: scaleHeight(24),
    lineHeight: scaleHeight(20),
    textAlign: 'left',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: scaleWidth(12),
  },
  modalCancelButton: {
    paddingVertical: scaleHeight(12),
    paddingHorizontal: scaleWidth(24),
    borderRadius: moderateScale(8),
    backgroundColor: 'transparent',
  },
  modalCancelText: {
    fontSize: fontSize.textSize14,
    fontWeight: '600',
    color: '#000',
    fontFamily: Fonts.latoSemiBold,
    letterSpacing: 0,
  },
  modalClearButton: {
    paddingVertical: scaleHeight(12),
    paddingHorizontal: scaleWidth(24),
    borderRadius: moderateScale(8),
    backgroundColor: '#FF4444',
  },
  modalClearText: {
    fontSize: fontSize.textSize14,
    fontWeight: '500',
    color: colors.white,
    fontFamily: Fonts.latoSemiBold,
  },
  modalDeleteButton: {
    paddingVertical: scaleHeight(12),
    paddingHorizontal: scaleWidth(24),
    borderRadius: moderateScale(8),
    backgroundColor: '#FF4444',
  },
  modalDeleteText: {
    fontSize: fontSize.textSize14,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: Fonts.latoSemiBold,
    letterSpacing: 0,
  },
});

export default DeletedEventsScreen;
