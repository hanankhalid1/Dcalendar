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

    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const formatEventDuration = () => {
    const startDate = parseTimeToPST(event.fromTime);
    const endDate = parseTimeToPST(event.toTime);

    if (!startDate || !endDate) return '';

    const startTime = formatEventTime(event.fromTime);
    const endTime = formatEventTime(event.toTime);

    // Check if it's a multi-day event
    const startDay = startDate.toDateString();
    const endDay = endDate.toDateString();

    if (startDay === endDay) {
      return `${startTime} to ${endTime}`;
    } else {
      return `${formatEventDate(
        event.fromTime,
      )}, ${startTime} to ${formatEventDate(event.toTime)}, ${endTime}`;
    }
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
        <View style={styles.iconWrapper}>{getIconComponent()}</View>
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
    return (
      <View key={index} style={styles.guestAvatar}>
        <View style={styles.avatarGradient}>
          <Text style={styles.avatarText}>{initial}</Text>
        </View>
        <Text style={styles.guestEmail}>{email}</Text>
      </View>
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
                  <View style={styles.guestsContainer}>
                    {getGuestEmails().map((email: string, index: number) =>
                      renderGuestAvatar(email, index),
                    )}
                  </View>
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
    maxWidth: scaleWidth(340),
    maxHeight: '80%',
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
    paddingHorizontal: scaleWidth(20),
    paddingTop: scaleHeight(18),
    paddingBottom: scaleHeight(12),
    borderBottomWidth: 1,
    borderBottomColor: '#E8EAED',
  },
  titleContainer: {
    flex: 1,
    marginRight: scaleWidth(12),
  },
  eventTitle: {
    fontSize: moderateScale(18),
    fontFamily: Fonts.bold,
    color: Colors.black,
    lineHeight: moderateScale(26),
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleWidth(8),
  },
  actionButton: {
    padding: scaleWidth(6),
  },
  content: {
    paddingHorizontal: scaleWidth(20),
    paddingVertical: scaleHeight(14),
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: scaleHeight(20),
  },
  iconWrapper: {
    marginRight: scaleWidth(12),
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
    fontSize: moderateScale(12),
    fontFamily: Fonts.latoMedium,
    color: '#717680',
    marginBottom: scaleHeight(4),
  },
  detailValue: {
    fontSize: moderateScale(14),
    fontFamily: Fonts.latoRegular,
    color: '#252B37',
    lineHeight: moderateScale(20),
  },
  guestsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: scaleHeight(8),
    gap: scaleWidth(12),
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
    marginBottom: scaleHeight(6),
    backgroundColor: '#00AEEF',
  },
  avatarText: {
    color: Colors.white,
    fontSize: moderateScale(14),
    fontFamily: Fonts.bold,
  },
  guestEmail: {
    fontSize: moderateScale(11),
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
    fontSize: moderateScale(14),
    fontFamily: Fonts.latoRegular,
    color: Colors.primaryblue,
    flex: 1,
    marginRight: scaleWidth(8),
  },
  copyButton: {
    padding: scaleWidth(4),
  },
});

export default EventDetailsModal;
