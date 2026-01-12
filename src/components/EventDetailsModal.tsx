import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Dimensions,
  Alert,
} from 'react-native';
import Clipboard from '@react-native-clipboard/clipboard';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Feather from 'react-native-vector-icons/Feather';
import FeatherIcon from 'react-native-vector-icons/Feather';
import { Colors } from '../constants/Colors';
import { Fonts } from '../constants/Fonts';
import { parseTimeToPST } from '../utils';
import * as DimensionsUtils from '../utils/dimensions';
import MeetIcon from '../assets/svgs/meet.svg';

const { width: screenWidth } = Dimensions.get('window');
const { scaleWidth, scaleHeight, moderateScale } = DimensionsUtils;

// Tablet detection
const isTablet = screenWidth >= 600;

// Helper function for tablet-safe dimensions
const getTabletSafeDimension = (
  mobileValue: number,
  tabletValue: number,
  maxValue: number,
) => {
  if (isTablet) {
    return Math.min(tabletValue, maxValue);
  }
  return mobileValue;
};

interface EventDetailsModalProps {
  visible: boolean;
  onClose: () => void;
  event: any;
  onEdit?: (event: any) => void;
  onDelete?: (event: any) => void;
}

const EventDetailsModal: React.FC<EventDetailsModalProps> = ({
  visible,
  onClose,
  event,
  onEdit,
  onDelete,
}) => {
  const [showGuestList, setShowGuestList] = useState(false);
  console.log('EventDetailsModal render:', { visible, event: event?.title });

  if (!event) {
    console.log('No event data, returning null');
    return null;
  }

  const formatEventDate = (dateString: string) => {
    const date = parseTimeToPST(dateString);
    if (!date) return '';

    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatEventTime = (dateString: string) => {
    const date = parseTimeToPST(dateString);
    if (!date) return '';

    const hours = date.getHours();
    const minutes = date.getMinutes();
    const displayHour = hours % 12 || 12;
    const ampm = hours >= 12 ? 'PM' : 'AM';
    return `${displayHour}:${String(minutes).padStart(2, '0')} ${ampm}`;
  };

  const extractEventTimezone = (): string | null => {
    if (event?.timezone && typeof event.timezone === 'string') {
      return event.timezone;
    }

    if (Array.isArray(event?.list)) {
      const timezoneTag = event.list.find(
        (tag: any) =>
          tag && tag.key === 'timezone' && typeof tag.value === 'string',
      );
      if (timezoneTag?.value) {
        return timezoneTag.value;
      }
    }

    return null;
  };

  const formatTimezoneAbbreviation = (timezone: string): string => {
    try {
      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: timezone,
        hour: 'numeric',
        timeZoneName: 'short',
      });
      const tzName = formatter
        .formatToParts(new Date())
        .find(part => part.type === 'timeZoneName')?.value;

      if (tzName) {
        return tzName;
      }
    } catch (error) {
      console.warn('Timezone formatting failed:', error);
    }

    return timezone;
  };

  const normalizeTimezone = (timezone?: string | null) =>
    (timezone || '').trim().toLowerCase();

  const getTimezoneLabel = (): string | null => {
    const eventTimezone = extractEventTimezone();
    if (!eventTimezone) return null;

    let deviceTimezone: string | null = null;
    try {
      deviceTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    } catch (error) {
      console.warn('Unable to resolve device timezone:', error);
    }

    const shouldShowTimezone =
      !deviceTimezone ||
      normalizeTimezone(eventTimezone) !== normalizeTimezone(deviceTimezone);

    return shouldShowTimezone
      ? formatTimezoneAbbreviation(eventTimezone)
      : null;
  };

  const formatEventDuration = () => {
    const startDate = parseTimeToPST(event.fromTime);
    const endDate = parseTimeToPST(event.toTime);

    if (!startDate || !endDate) return '';

    const startTime = formatEventTime(event.fromTime);
    const endTime = formatEventTime(event.toTime);
    const timezoneLabel = getTimezoneLabel();

    // Check if it's a multi-day event
    const startDay = startDate.toDateString();
    const endDay = endDate.toDateString();

    let baseTime = '';
    if (startDay === endDay) {
      baseTime = `${startTime} to ${endTime}`;
    } else {
      baseTime = `${formatEventDate(
        event.fromTime,
      )}, ${startTime} to ${formatEventDate(event.toTime)}, ${endTime}`;
    }

    return timezoneLabel ? `${baseTime} (${timezoneLabel})` : baseTime;
  };

  const getGuestCount = () => {
    if (!event.list) return 0;
    return event.list.filter((item: any) => item.key === 'guest').length;
  };

  const getLocation = () => {
    if (!event.list) return null;
    const locationItem = event.list.find(
      (item: any) => item.key === 'location',
    );
    const locationType = event.list.find(
      (item: any) => item.key === 'locationType',
    );
    // Only return location if it's not a meeting link (not google or zoom)
    if (
      locationItem &&
      locationType &&
      (locationType.value === 'google' || locationType.value === 'zoom')
    ) {
      return null; // This is a meeting link, not a physical location
    }
    return locationItem ? locationItem.value : null;
  };

  const getMeetingLink = () => {
    if (!event.list) return null;
    const locationType = event.list.find(
      (item: any) => item.key === 'locationType',
    );
    if (
      locationType &&
      (locationType.value === 'google' || locationType.value === 'zoom')
    ) {
      const locationItem = event.list.find(
        (item: any) => item.key === 'location',
      );
      // Return either the meeting link or a placeholder
      return locationItem?.value || 'no-meeting-link';
    }
    return null;
  };

  const getMeetingLinkType = () => {
    if (!event.list) return null;
    const locationType = event.list.find(
      (item: any) => item.key === 'locationType',
    );
    return locationType ? locationType.value : null;
  };

  const handleCopyLink = async (link: string) => {
    try {
      await Clipboard.setString(link);
      Alert.alert('Copied', 'Meeting link copied to clipboard');
    } catch (error) {
      Alert.alert('Error', 'Failed to copy link');
    }
  };

  const getOrganizer = () => {
    if (!event.list) return null;
    const organizerItem = event.list.find(
      (item: any) => item.key === 'organizer',
    );
    return organizerItem ? organizerItem.value : null;
  };

  const getGuestEmails = () => {
    if (!event.list) return [];
    return event.list
      .filter((item: any) => item.key === 'guest')
      .map((item: any) => item.value);
  };

  const renderIconWithGradient = (iconName: string, size: number = 20) => (
    <View style={styles.iconContainer}>
      <MaterialIcons name={iconName} size={size} color={Colors.primaryblue} />
    </View>
  );

  const renderIcon = (iconName: string, size: number = 20) => (
    <View style={styles.iconContainer}>
      <Feather name={iconName} size={size} color={Colors.gray500} />
    </View>
  );

  const renderDetailRow = (
    icon: React.ReactNode,
    label: string,
    value: string,
  ) => (
    <View style={styles.detailRow}>
      <View style={styles.iconWrapper}>{icon}</View>
      <View style={styles.detailContent}>
        <Text style={styles.detailLabel}>{label}</Text>
        <Text style={styles.detailValue}>{value}</Text>
      </View>
    </View>
  );

  const renderMeetingLinkRow = (link: string, linkType: string) => {
    const isGoogleMeet =
      linkType === 'google' || link.includes('meet.google.com');
    const isZoom = linkType === 'zoom' || link.includes('zoom.us');
    const isNoLink = link === 'no-meeting-link';

    const getIconComponent = () => {
      if (isGoogleMeet) {
        return <MeetIcon width={18} height={18} />;
      } else if (isZoom) {
        return <FeatherIcon name="video" size={18} color="#0B6DE0" />;
      } else {
        return (
          <MaterialIcons name="link" size={18} color={Colors.primaryblue} />
        );
      }
    };

    return (
      <View style={styles.detailRow}>
        <View style={styles.iconWrapper}>
          <View style={styles.iconContainer}>{getIconComponent()}</View>
        </View>
        <View style={styles.detailContent}>
          <Text style={styles.detailLabel}>
            {isGoogleMeet ? 'Google Meet' : isZoom ? 'Zoom' : 'Meeting Link'}
          </Text>
          {isNoLink ? (
            <Text style={styles.meetingLinkText}>No meeting link</Text>
          ) : (
            <View style={styles.meetingLinkContainer}>
              <Text style={styles.meetingLinkText} numberOfLines={1}>
                {link}
              </Text>
              <TouchableOpacity
                style={styles.copyButton}
                onPress={() => handleCopyLink(link)}
              >
                <Feather name="copy" size={16} color={Colors.primaryblue} />
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    );
  };

  const renderGuestAvatar = (email: string, index: number) => {
    const initial = email.charAt(0).toUpperCase();
    // Calculate negative margin to create overlap effect
    const marginLeft = index === 0 ? 0 : scaleWidth(-12);

    return (
      <View
        key={index}
        style={[styles.overlapAvatar, { marginLeft, zIndex: -index }]}
      >
        <View style={styles.avatarGradient}>
          <Text style={styles.avatarText}>{initial}</Text>
        </View>
      </View>
    );
  };

  const renderGuestListModal = () => {
    const guestEmails = getGuestEmails();

    return (
      <Modal
        visible={showGuestList}
        transparent
        animationType="fade"
        onRequestClose={() => setShowGuestList(false)}
      >
        <TouchableOpacity
          style={styles.guestListOverlay}
          activeOpacity={1}
          onPress={() => setShowGuestList(false)}
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={e => e.stopPropagation()}
            style={styles.guestListContainer}
          >
            <View style={styles.guestListHeader}>
              <Text style={styles.guestListTitle}>
                {guestEmails.length}{' '}
                {guestEmails.length === 1 ? 'Guest' : 'Guests'}
              </Text>
              <TouchableOpacity onPress={() => setShowGuestList(false)}>
                <Feather name="x" size={24} color={Colors.gray500} />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.guestListContent}
              showsVerticalScrollIndicator={false}
            >
              {guestEmails.map((email: string, index: number) => (
                <View key={index} style={styles.guestListItem}>
                  <View style={styles.guestListAvatar}>
                    <Text style={styles.guestListAvatarText}>
                      {email.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <Text style={styles.guestListEmail}>{email}</Text>
                </View>
              ))}
            </ScrollView>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.titleContainer}>
              <Text style={styles.eventTitle} numberOfLines={2}>
                {event.title || 'Untitled Event'}
              </Text>
            </View>

            <View style={styles.headerActions}>
              {onEdit && (
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => onEdit(event)}
                >
                  <Feather name="edit-2" size={20} color={Colors.gray500} />
                </TouchableOpacity>
              )}

              {onDelete && (
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => onDelete(event)}
                >
                  <Feather name="trash-2" size={20} color={Colors.red} />
                </TouchableOpacity>
              )}

              <TouchableOpacity style={styles.actionButton} onPress={onClose}>
                <Feather name="x" size={24} color={Colors.gray500} />
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView
            style={styles.content}
            showsVerticalScrollIndicator={false}
          >
            {/* Date and Time */}
            {renderDetailRow(
              renderIconWithGradient('schedule', 18),
              'Date & Time',
              formatEventDuration(),
            )}

            {/* Description */}
            {event.description &&
              renderDetailRow(
                renderIcon('file-text', 18),
                'Description',
                event.description,
              )}

            {/* Meeting Link - Separate from Location */}
            {getMeetingLink() &&
              renderMeetingLinkRow(
                getMeetingLink(),
                getMeetingLinkType() || '',
              )}

            {/* Location - Only show if it's not a meeting link */}
            {getLocation() &&
              renderDetailRow(
                renderIcon('map-pin', 18),
                'Location',
                getLocation(),
              )}

            {/* Guests */}
            {getGuestCount() > 0 && (
              <View style={styles.detailRow}>
                <View style={styles.iconWrapper}>
                  {renderIconWithGradient('people', 18)}
                </View>
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>
                    {getGuestCount()}{' '}
                    {getGuestCount() === 1 ? 'guest' : 'guests'}
                  </Text>
                  <TouchableOpacity
                    style={styles.guestsContainer}
                    onPress={() => setShowGuestList(true)}
                  >
                    {getGuestEmails().map((email: string, index: number) =>
                      renderGuestAvatar(email, index),
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Organizer */}
            {getOrganizer() &&
              renderDetailRow(
                renderIcon('user', 18),
                'Organizer',
                getOrganizer(),
              )}
          </ScrollView>
        </View>
      </View>
      {renderGuestListModal()}
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: scaleWidth(20),
  },
  modalContainer: {
    backgroundColor: Colors.white,
    borderRadius: moderateScale(14),
    width: '100%',
    maxWidth: scaleWidth(isTablet ? 280 : 340),
    maxHeight: isTablet ? '70%' : '80%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: scaleWidth(isTablet ? 12 : 20),
    paddingTop: scaleHeight(isTablet ? 12 : 18),
    paddingBottom: scaleHeight(isTablet ? 8 : 12),
    borderBottomWidth: 1,
    borderBottomColor: '#E8EAED',
  },
  titleContainer: {
    flex: 1,
    marginRight: scaleWidth(12),
  },
  eventTitle: {
    fontSize: moderateScale(getTabletSafeDimension(18, 9, 20)), // decreased tablet font size
    fontFamily: Fonts.bold,
    color: Colors.black,
    lineHeight: moderateScale(getTabletSafeDimension(26, 15, 28)),
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleWidth(isTablet ? 4 : 8),
  },
  actionButton: {
    padding: scaleWidth(isTablet ? 4 : 6),
  },
  content: {
    paddingHorizontal: scaleWidth(isTablet ? 12 : 20),
    paddingVertical: scaleHeight(isTablet ? 8 : 14),
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: scaleHeight(isTablet ? 12 : 20),
  },
  iconWrapper: {
    marginRight: scaleWidth(isTablet ? 10 : 12),
    marginTop: scaleHeight(2),
  },
  iconContainer: {
    width: scaleWidth(40),
    height: scaleHeight(40),
    borderRadius: moderateScale(20),
    backgroundColor: '#F0F4F8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconGradient: {
    width: scaleWidth(40),
    height: scaleHeight(40),
    borderRadius: moderateScale(20),
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: moderateScale(getTabletSafeDimension(12, 6, 13)),
    fontFamily: Fonts.latoMedium,
    color: '#717680',
    marginBottom: scaleHeight(4),
  },
  detailValue: {
    fontSize: moderateScale(getTabletSafeDimension(14, 8, 15)), // decreased tablet font size
    fontFamily: Fonts.latoRegular,
    color: '#252B37',
    lineHeight: moderateScale(getTabletSafeDimension(20, 13, 22)),
  },
  guestsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: scaleHeight(8),
  },
  overlapAvatar: {
    position: 'relative',
  },
  guestAvatar: {
    alignItems: 'center',
    marginBottom: scaleHeight(6),
  },
  avatarGradient: {
    width: scaleWidth(40),
    height: scaleHeight(40),
    borderRadius: moderateScale(20),
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#00AEEF',
    borderWidth: 2,
    borderColor: Colors.white,
  },
  avatarText: {
    color: Colors.white,
    fontSize: moderateScale(getTabletSafeDimension(14, 10, 15)),
    fontFamily: Fonts.bold,
  },
  guestEmail: {
    fontSize: moderateScale(getTabletSafeDimension(11, 9, 12)),
    fontFamily: Fonts.latoRegular,
    color: '#717680',
    textAlign: 'center',
    maxWidth: scaleWidth(80),
  },
  meetingLinkContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: scaleHeight(4),
  },
  meetingLinkText: {
    fontSize: moderateScale(getTabletSafeDimension(14, 9, 15)),
    fontFamily: Fonts.latoRegular,
    color: '#0B6DE0',
    flex: 1,
    marginRight: scaleWidth(8),
    lineHeight: moderateScale(getTabletSafeDimension(20, 15, 22)),
  },
  copyButton: {
    padding: scaleWidth(4),
  },
  // Guest List Modal Styles
  guestListOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: scaleWidth(20),
  },
  guestListContainer: {
    width: '100%',
    maxWidth: scaleWidth(300),
    backgroundColor: Colors.white,
    borderRadius: moderateScale(12),
    maxHeight: '70%',
  },
  guestListHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: scaleWidth(16),
    paddingVertical: scaleHeight(12),
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  guestListTitle: {
    fontSize: moderateScale(getTabletSafeDimension(16, 11, 18)),
    fontFamily: Fonts.latoBold,
    color: Colors.black,
  },
  guestListContent: {
    paddingVertical: scaleHeight(8),
  },
  guestListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: scaleWidth(16),
    paddingVertical: scaleHeight(12),
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  guestListAvatar: {
    width: scaleWidth(32),
    height: scaleHeight(32),
    borderRadius: moderateScale(16),
    backgroundColor: '#00AEEF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: scaleWidth(12),
  },
  guestListAvatarText: {
    color: Colors.white,
    fontSize: moderateScale(getTabletSafeDimension(12, 8, 13)),
    fontFamily: Fonts.latoBold,
  },
  guestListEmail: {
    fontSize: moderateScale(getTabletSafeDimension(14, 9, 15)),
    fontFamily: Fonts.latoRegular,
    color: '#252B37',
    flex: 1,
  },
});

export default EventDetailsModal;
