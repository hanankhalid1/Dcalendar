import { useNavigation } from '@react-navigation/native';
import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import AntDesign from 'react-native-vector-icons/AntDesign';
import Feather from 'react-native-vector-icons/Feather';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useApiClient } from '../hooks/useApi';
import { useActiveAccount } from '../stores/useActiveAccount';
import { moderateScale, scaleHeight, scaleWidth, screenWidth } from '../utils/dimensions';
import {
  borderRadius,
  colors,
  fontSize,
  shadows,
  spacing,
} from '../utils/LightTheme';
import { BlockchainService } from '../services/BlockChainService';
import { useToken } from '../stores/useTokenStore';
import { NECJSPRIVATE_KEY } from '../constants/Config';
import CustomLoader from '../global/CustomLoader';
import { useEventsStore } from '../stores/useEventsStore';

interface EventTag {
  id: string;
  label: string;
  icon: string;
  iconType?:
  | 'MaterialIcons'
  | 'MaterialCommunityIcons'
  | 'Feather'
  | 'FontAwesome'
  | 'AntDesign';
  color: string;
  textColor?: string;
  iconColor?: string;
}

interface CalendarEvent {
  id: string;
  eventId: string;
  title: string;
  time: string;
  date: string;
  userName: string;
  color: string;
  tags: EventTag[];
}

interface EventCardProps {
  title: string;
  eventId: string;
  time: string;
  date: string;
  color: string;
  tags: EventTag[];
  isExpandable?: boolean; // No longer used - all events are expandable, kept for backward compatibility
  hasActions?: boolean; // No longer used - all events show action buttons, kept for backward compatibility
  compact?: boolean;
  onPress?: () => void;
  onEventDeleted?: (eventId: string) => void;
  onEdit?: (event: CalendarEvent) => void;
  event: CalendarEvent;
  isExpanded?: boolean; // New prop to control expanded state from parent
}

// Helper function to render icons based on type
const renderIcon = (
  iconName: string,
  iconType: string = 'MaterialIcons',
  size: number = 16,
  color: string = colors.textPrimary,
) => {
  switch (iconType) {
    case 'MaterialIcons':
      return <MaterialIcons name={iconName} size={size} color={color} />;
    case 'MaterialCommunityIcons':
      return (
        <MaterialCommunityIcons name={iconName} size={size} color={color} />
      );
    case 'Feather':
      return <Feather name={iconName} size={size} color={color} />;
    case 'FontAwesome':
      return <FontAwesome name={iconName} size={size} color={color} />;
    case 'AntDesign':
      return <AntDesign name={iconName} size={size} color={color} />;
    default:
      return <MaterialIcons name={iconName} size={size} color={color} />;
  }
};

const EventCard: React.FC<EventCardProps> = ({
  title,
  eventId,
  time,
  date,
  color,
  tags,
  isExpandable = false,
  hasActions = false,
  event,

  onEventDeleted,
  onEdit,
  compact = false,

  onPress,
  isExpanded = false,
}) => {
  const [internalExpanded, setInternalExpanded] = useState(false);
  const navigation = useNavigation();
  const { api } = useApiClient();
  const account = useActiveAccount(state => state.account);
  const [isLoading, setIsLoading] = useState(false);
  // Use external expanded state if provided, otherwise use internal state
  const expanded = isExpanded !== undefined ? isExpanded : internalExpanded;
  const [modalVisible, setModalVisible] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const token = useToken(state => state.token);
  const blockchainService = new BlockchainService(NECJSPRIVATE_KEY);
  const { 
    getUserEvents, 
    optimisticallyDeleteEvent,
    revertOptimisticUpdate,
    userEvents 
  } = useEventsStore();


  // In your React Native component (e.g., EventCard or a wrapper screen)

  const handleDeleteEvent = async (eventId: string) => {
    try {
      if (!account) {
        console.log('Error', 'No active account found. Please log in again.');
        return false;
      }
      
      console.log("Account found: ", account);
      
      // Store current events for potential revert
      const currentEvents = [...(userEvents || [])];
      
      // ✅ OPTIMISTIC UPDATE: Remove event from UI immediately
      optimisticallyDeleteEvent(eventId);

      // ✅ BACKGROUND OPERATIONS: Run blockchain/API calls in background
      (async () => {
        try {
          // Call the service to modify data, re-encrypt, and submit the transaction.
          await blockchainService.deleteEventSoft(eventId, account, token, api);

          // Delayed refresh in background (non-blocking, skip loading screen)
          setTimeout(() => {
            getUserEvents(account.userName, api, undefined, { skipLoading: true }).catch(err => {
              console.error('Background event refresh failed:', err);
              // If refresh fails, revert optimistic update
              revertOptimisticUpdate(currentEvents);
            });
          }, 2000);
        } catch (err) {
          console.error("Delete Event Failed:", err);
          // Revert optimistic update on error
          revertOptimisticUpdate(currentEvents);
          Alert.alert("Error", "Failed to move the event to the trash");
        }
      })();

    } catch (err) {
      console.error("Delete Event Failed:", err);
      Alert.alert("Error", "Failed to move the event to the trash");
    }
  };

  //   try {
  //     console.log(event);
  //     const updatePayload = {
  //       events: [{ ...event, isDeleted: true }],
  //       active: account?.userName,
  //       type: 'update',
  //     };
  //     console.log(updatePayload);

  //     const response = await api('POST', '/updateevents', updatePayload);
  //     if (response.data) {
  //       // Update local Zustand store for immediate UI update

  //       Alert.alert('Success', 'Event deleted successfully!', [
  //         { text: 'OK', onPress: () => navigation.goBack() },
  //       ]);

  //       // Optional: refresh blockchain events
  //     } else {
  //       Alert.alert(
  //         'Error',
  //         response.data?.message || 'Failed to delettte event',
  //       );
  //     }
  //   } catch (error) {
  //     console.log(error);

  //     Alert.alert('Error', 'Failed to delete event');
  //   }
  // };
  const handlePress = () => {
    // All events are now expandable
    if (isExpanded === undefined) {
      setInternalExpanded(!internalExpanded);
    }
    onPress?.();
  };



  if (compact) {
    const ContainerComponent = onPress ? TouchableOpacity : View;
    const containerProps = onPress
      ? { onPress: handlePress, activeOpacity: 0.8 }
      : {};

    return (
      <>
        {isLoading && (

          <CustomLoader />

        )}
        <ContainerComponent
          style={[
            expanded ? styles.compactContainerExpanded : styles.compactContainer,
            {
              backgroundColor: `${color}20`, // Add 20% opacity to the color
              borderLeftWidth: 1, // Remove left border since it's nested
            },
          ]}
          {...containerProps}
        >
          {/* Compact Header - Time, Title, Edit Button, and Chevron */}
          <View style={expanded ? styles.compactHeader1 : styles.compactHeader2}>
            <View style={styles.compactTitleContainer}>
              <View
                style={[styles.compactColorIndicator, { backgroundColor: color }]}
              />
              {expanded ? (
                <View style={styles.compactTitleRow}>
                  <Text
                    numberOfLines={2}
                    ellipsizeMode="tail"
                    style={styles.compactTitle}
                  >
                    {title}
                  </Text>
                  <TouchableOpacity
                    style={styles.compactEditButton}
                    onPress={() => onEdit?.(event)}
                  >
                    {renderIcon('edit', 'MaterialIcons', 18, colors.black)}
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.compactTimeTitleColumn}>
                  <View style={styles.compactTitleRow}>
                    <Text
                      numberOfLines={2} // Allow 2 lines for longer titles
                      ellipsizeMode="tail"
                      style={styles.compactTitle}
                    >
                      {title}
                    </Text>
                    <TouchableOpacity
                      style={styles.compactEditButton}
                      onPress={() => onEdit?.(event)}
                    >
                      {renderIcon('edit', 'MaterialIcons', 18, colors.black)}
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.compactTime}>{time}</Text>
                </View>
              )}
            </View>
            {/* Show chevron for all events */}
            <View style={styles.chevronContainer}>
              <AntDesign
                name={expanded ? 'up' : 'down'}
                size={screenWidth < 375 ? 12 : 14} // Smaller icon on small screens
                color={colors.textSecondary}
              />
            </View>
          </View>

          {/* Compact Expanded Content - Show when expanded */}
          {expanded && (
            <ScrollView
              style={styles.expandedScrollView}
              showsVerticalScrollIndicator={false}
              nestedScrollEnabled={true}
            >
              <View style={styles.expandedContentContainer}>
                {/* Time and Date Information */}
                <Text style={styles.compactTimeDate}>
                  {time}, {date}
                </Text>

                {/* Tags - Only show if event has tags */}
                {/* {tags.length > 0 && (
                <View style={styles.compactTagsContainer}>
                  {tags.map(tag => (
                    <View
                      key={tag.id}
                      style={[
                        styles.compactTag,
                        // {
                        //   backgroundColor: tag.color,
                        //   borderColor:
                        //     tag.color === 'transparent'
                        //       ? 'rgba(0, 0, 0, 0.2)'
                        //       : 'transparent',
                        //   // borderWidth: tag.color === 'transparent' ? 1 : 0,
                        // },
                      ]}
                    >
                      {renderIcon(
                        tag.icon,
                        tag.iconType || 'MaterialIcons',
                        12,
                        tag.iconColor || colors.navired,
                      )}
                      <Text
                        style={[
                          styles.compactTagLabel,
                          { color: tag.textColor || colors.white },
                        ]}
                      >
                        {tag.label}
                      </Text>
                    </View>
                  ))}
                </View>
              )} */}

                {/* Action Icons - Delete button and other actions when expanded */}
                <View style={styles.compactActionIcons}>
                  <TouchableOpacity
                    style={styles.compactActionIcon}
                    // 1. Wrap the logic in an inline function
                    onPress={() => {
                      // 2. Use Alert.alert to show the confirmation dialog
                      Alert.alert(
                        "Confirm Deletion", // Title
                        "Are you sure you want to move this event to the trash?", // Message
                        [
                          // Button 1: Cancel (does nothing)
                          {
                            text: "Cancel",
                            style: "cancel",
                          },
                          // Button 2: Delete (calls the main handler)
                          {
                            text: "Delete",
                            style: "destructive", // To show it in red/warning color
                            onPress: () => handleDeleteEvent(eventId),
                          },
                        ],
                        // Optional: Configuration options (e.g., { cancelable: false })
                        { cancelable: true }
                      );
                    }}
                  >
                    {renderIcon('delete', 'MaterialIcons', 18, colors.navired)}
                  </TouchableOpacity>
                  {/* <TouchableOpacity style={styles.compactActionIcon}>
                  {renderIcon('email', 'MaterialIcons', 18, colors.black)}
                </TouchableOpacity>
                <TouchableOpacity style={styles.compactActionIcon}>
                  {renderIcon('print', 'MaterialIcons', 18, colors.black)}
                </TouchableOpacity>
                <TouchableOpacity style={styles.compactActionIcon}>
                  {renderIcon('more-vert', 'MaterialIcons', 18, colors.black)}
                </TouchableOpacity> */}
                </View>

              
              </View>
            </ScrollView>
          )}
        </ContainerComponent>
      </>

    );
  }

  // Original standalone card design
  return (
    <>
      {isLoading && (
          <CustomLoader />
      )}


      <TouchableOpacity
        style={[styles.container, { borderLeftColor: color }]}
        onPress={handlePress}
        activeOpacity={0.8}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <View style={[styles.colorIndicator, { backgroundColor: color }]} />
            <Text style={styles.title}>{title}</Text>
          </View>
          {/* Show chevron for all events */}
          <AntDesign name="up" size={14} color={colors.textSecondary} />
        </View>

        {/* Time and Date */}
        <Text style={styles.timeDate}>
          {time}, {date}
        </Text>

        {/* Expanded Content - Now available for all events */}
        {expanded && (
          <View style={styles.expandedContent}>
            {/* Tags - Only show if event has tags */}
            {tags.length > 0 && (
              <View style={styles.tagsContainer}>
                {tags.map(tag => (
                  <View
                    key={tag.id}
                    style={[
                      styles.tag,
                      {
                        backgroundColor: tag.color,
                        borderColor:
                          tag.color === 'transparent'
                            ? 'rgba(0, 0, 0, 0.2)'
                            : 'transparent',
                        borderWidth: tag.color === 'transparent' ? 1 : 0,
                      },
                    ]}
                  >
                    {renderIcon(
                      tag.icon,
                      tag.iconType || 'MaterialIcons',
                      12,
                      tag.iconColor || colors.navired,
                    )}
                    <Text
                      style={[
                        styles.tagLabel,
                        { color: tag.textColor || colors.white },
                      ]}
                    >
                      {tag.label}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            {/* Action Icons - Now shown for all events when expanded */}
            <View style={styles.actionIcons}>
              <TouchableOpacity style={styles.actionIcon}>
                {renderIcon('edit', 'MaterialIcons', 16, colors.textPrimary)}
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionIcon}>
                {renderIcon('delete', 'MaterialIcons', 16, colors.textPrimary)}
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionIcon}>
                {renderIcon('email', 'MaterialIcons', 16, colors.textPrimary)}
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionIcon}>
                {renderIcon('print', 'MaterialIcons', 16, colors.textPrimary)}
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionIcon}>
                {renderIcon(
                  'more-vert',
                  'MaterialIcons',
                  16,
                  colors.textPrimary,
                )}
              </TouchableOpacity>
            </View>

          
          </View>
        )}
      </TouchableOpacity>
    </>
  );
};

const styles = StyleSheet.create({
  // Original standalone styles
  container: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginVertical: spacing.xs,
    marginLeft: spacing.md,
    borderLeftWidth: 4,
    ...shadows.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  colorIndicator: {
    width: moderateScale(12),
    height: moderateScale(12),
    borderRadius: moderateScale(6),
    marginRight: spacing.sm,
  },
  title: {
    fontSize: fontSize.textSize16,
    fontWeight: 'bold',
    color: colors.textPrimary,
    flex: 1,
  },

  timeDate: {
    fontSize: fontSize.textSize14,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  expandedContent: {
    borderTopWidth: 1,
    borderTopColor: colors.grey20,
    paddingTop: spacing.md,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: spacing.md,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 4,
    paddingRight: 6,
    paddingBottom: 4,
    paddingLeft: 6,
    borderRadius: 8,
    marginRight: spacing.xs,
    marginBottom: spacing.xs,
    gap: 6,
  },

  tagLabel: {
    fontSize: fontSize.textSize12,
    fontWeight: '500',
  },
  actionIcons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: spacing.md,
  },
  actionIcon: {
    width: moderateScale(32),
    height: moderateScale(32),
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: borderRadius.md,
  },

  inviteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    width: 170,
    height: 40,
    borderRadius: 80, // 80px radius for pill shape
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.2)', // 20% opacity black border
    gap: spacing.xs,
    alignSelf: 'center',
  },

  inviteButtonText: {
    fontSize: fontSize.textSize14,
    color: colors.textPrimary,
    fontWeight: '500',
  },

  // Compact styles for single-border layout
  compactContainer: {
    backgroundColor: '#F6F7F9', // Light beige background for both collapsed and expanded states
    paddingVertical: screenWidth < 375 ? scaleHeight(4) : scaleHeight(6), // Further reduced padding
    paddingHorizontal: screenWidth < 375 ? spacing.xs : spacing.sm, // Further reduced padding
    width: '100%',
    marginBottom: spacing.xs,
    borderLeftWidth: 0, // Remove left border since it's nested
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    alignSelf: 'stretch', // Stretch to fill available width
    minWidth: 120, // Minimum width for readability
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)', // Subtle border
  },
  // Expanded container style for when event is expanded
  compactContainerExpanded: {
    paddingVertical: screenWidth < 375 ? scaleHeight(4) : scaleHeight(6), // Same as collapsed
    paddingHorizontal: screenWidth < 375 ? spacing.xs : spacing.sm, // Same as collapsed
    borderRadius: borderRadius.lg,
    overflow: 'visible', // Allow content to be visible
    alignSelf: 'stretch', // Stretch to full width when expanded
    width: '100%', // Take full width when expanded
    maxHeight: scaleHeight(300), // Maximum height to prevent cutoff
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)', // Same border as collapsed
  },
  compactHeader1: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: scaleWidth(4), // Reduced margin
    minHeight: scaleHeight(28), // Reduced height
  },
  compactHeader2: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: scaleHeight(28), // Reduced height
  },
  compactTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: spacing.xs, // Reduced margin to give more space to title
    minWidth: 0, // Allow flex shrinking
  },
  compactTitleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start', // Align to top to handle 2-line titles
    flex: 1,
    flexWrap: 'wrap', // Allow wrapping to next line
    minWidth: 0, // Allow flex shrinking
    gap: spacing.xs, // Add gap between title and edit button
  },
  compactTimeTitleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start', // Align to top to handle 2-line titles
    flex: 1,
    minWidth: 0, // Allow flex shrinking
  },
  compactTimeTitleColumn: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    flex: 1,
    minWidth: 0, // Allow flex shrinking
  },
  chevronContainer: {
    width: screenWidth < 375 ? scaleWidth(14) : scaleWidth(16), // Even smaller to give more space to title
    height: screenWidth < 375 ? scaleHeight(14) : scaleHeight(16), // Even smaller to give more space to title
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0, // Prevent chevron from shrinking
    marginLeft: spacing.xs, // Small margin to separate from title
  },
  compactColorIndicator: {
    width: moderateScale(16), // Slightly smaller
    height: moderateScale(16), // Slightly smaller
    borderRadius: moderateScale(4), // Adjusted border radius
    marginRight: spacing.md, // Reduced margin
  },
  compactTime: {
    fontSize: screenWidth < 375 ? fontSize.textSize12 : fontSize.textSize14, // Smaller font on small screens
    color: colors.textSecondary,
    marginBottom: spacing.xs, // Margin below time for column layout
    flexShrink: 0, // Prevent time from shrinking
  },
  compactTitle: {
    fontSize: screenWidth < 375 ? fontSize.textSize14 : fontSize.textSize16, // Smaller font on small screens
    fontWeight: '500',
    color: colors.black,
    flex: 1,
    minWidth: 0, // Allow title to shrink and ellipsize
    lineHeight: screenWidth < 375 ? 18 : 20, // Set line height for better readability
  },
  compactEditButton: {
    padding: spacing.xs,
    flexShrink: 0, // Prevent button from shrinking
    marginLeft: spacing.xs,
  },
  compactTitleExpanded: {
    fontSize: fontSize.textSize20,
    fontWeight: 'bold',
    color: colors.textPrimary,
    flexShrink: 1,
  },
  compactTimeDate: {
    fontSize: fontSize.textSize18,
    color: colors.black,
    fontWeight: '400',
    marginBottom: moderateScale(10),
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.xs,
    paddingHorizontal: scaleWidth(10),
  },

  compactTagsContainer: {
    flexDirection: 'row',
    alignItems: 'center', // Align items vertically in the center
    flexWrap: 'wrap', // Allow tags to wrap to the next line if needed
  },
  compactTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: moderateScale(4), // Use consistent vertical padding
    paddingHorizontal: moderateScale(8), // Use consistent horizontal padding
    borderRadius: moderateScale(16), // A common, rounded style
    marginRight: moderateScale(8), // Space between tags
    gap: moderateScale(4), // Space between the icon and the text
    backgroundColor: '#0000001A',
    height: moderateScale(28),
  },
  compactTagLabel: {
    fontSize: fontSize.textSize12,
    fontWeight: '500',
    color: '#000000', // Set a default text color for consistency
  },
  compactActionIcons: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
    marginTop: spacing.sm,
  },
  compactActionIcon: {
    width: moderateScale(32),
    height: moderateScale(32),
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: borderRadius.md,
  },

  compactInviteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    width: scaleWidth(170),
    height: scaleHeight(40),
    borderRadius: borderRadius.xxl,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.2)', // 20% opacity black border
    gap: spacing.xs,
    alignSelf: 'center', // Center the button horizontally
    marginTop: spacing.sm, // Positive margin instead of negative
    marginBottom: spacing.sm, // Add bottom margin to prevent cutoff
  },

  compactInviteButtonText: {
    fontSize: fontSize.textSize18,
    color: colors.black,
    fontWeight: '400',
  },
  expandedScrollView: {
    maxHeight: scaleHeight(250), // Limit height to prevent cutoff
    flexGrow: 0, // Don't grow beyond content
    width: '100%', // Ensure full width
  },
  expandedContentContainer: {
    paddingBottom: spacing.sm, // Add bottom padding for better spacing
    width: '100%', // Ensure full width
  },

});

export default EventCard;


