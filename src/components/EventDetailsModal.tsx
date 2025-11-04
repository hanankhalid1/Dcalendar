import React from 'react';
import {
    Modal,
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    Dimensions,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Feather from 'react-native-vector-icons/Feather';
import { Colors } from '../constants/Colors';
import { Fonts } from '../constants/Fonts';
import { parseTimeToPST } from '../utils';

const { width: screenWidth } = Dimensions.get('window');

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
            return `${formatEventDate(event.fromTime)}, ${startTime} to ${formatEventDate(event.toTime)}, ${endTime}`;
        }
    };

    const getGuestCount = () => {
        if (!event.list) return 0;
        return event.list.filter((item: any) => item.key === 'guest').length;
    };

    const getLocation = () => {
        if (!event.list) return null;
        const locationItem = event.list.find((item: any) => item.key === 'location');
        return locationItem ? locationItem.value : null;
    };

    const getOrganizer = () => {
        if (!event.list) return null;
        const organizerItem = event.list.find((item: any) => item.key === 'organizer');
        return organizerItem ? organizerItem.value : null;
    };

    const getGuestEmails = () => {
        if (!event.list) return [];
        return event.list
            .filter((item: any) => item.key === 'guest')
            .map((item: any) => item.value);
    };

    const renderIconWithGradient = (iconName: string, size: number = 20) => (
        <LinearGradient
            colors={[Colors.primaryGreen, Colors.primaryblue]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.iconGradient}
        >
            <MaterialIcons name={iconName} size={size} color={Colors.white} />
        </LinearGradient>
    );

    const renderIcon = (iconName: string, size: number = 20) => (
        <View style={styles.iconContainer}>
            <Feather name={iconName} size={size} color={Colors.gray500} />
        </View>
    );

    const renderDetailRow = (icon: React.ReactNode, label: string, value: string) => (
        <View style={styles.detailRow}>
            <View style={styles.iconWrapper}>
                {icon}
            </View>
            <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>{label}</Text>
                <Text style={styles.detailValue}>{value}</Text>
            </View>
        </View>
    );

    const renderGuestAvatar = (email: string, index: number) => {
        const initial = email.charAt(0).toUpperCase();
        return (
            <View key={index} style={styles.guestAvatar}>
                <LinearGradient
                    colors={[Colors.primaryGreen, Colors.primaryblue]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.avatarGradient}
                >
                    <Text style={styles.avatarText}>{initial}</Text>
                </LinearGradient>
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

                            <TouchableOpacity
                                style={styles.actionButton}
                                onPress={onClose}
                            >
                                <Feather name="x" size={24} color={Colors.gray500} />
                            </TouchableOpacity>
                        </View>
                    </View>

                    <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                        {/* Date and Time */}
                        {renderDetailRow(
                            renderIconWithGradient('schedule', 18),
                            'Date & Time',
                            formatEventDuration()
                        )}

                        {/* Description */}
                        {event.description && (
                            renderDetailRow(
                                renderIcon('file-text', 18),
                                'Description',
                                event.description
                            )
                        )}

                        {/* Location */}
                        {getLocation() && (
                            renderDetailRow(
                                renderIcon('map-pin', 18),
                                'Location',
                                getLocation()
                            )
                        )}

                        {/* Guests */}
                        {getGuestCount() > 0 && (
                            <View style={styles.detailRow}>
                                <View style={styles.iconWrapper}>
                                    {renderIconWithGradient('people', 18)}
                                </View>
                                <View style={styles.detailContent}>
                                    <Text style={styles.detailLabel}>
                                        {getGuestCount()} {getGuestCount() === 1 ? 'guest' : 'guests'}
                                    </Text>
                                    <View style={styles.guestsContainer}>
                                        {getGuestEmails().map((email: string, index: number) =>
                                            renderGuestAvatar(email, index)
                                        )}
                                    </View>
                                </View>
                            </View>
                        )}

                        {/* Organizer */}
                        {getOrganizer() && (
                            renderDetailRow(
                                renderIcon('user', 18),
                                'Organizer',
                                getOrganizer()
                            )
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
        paddingHorizontal: 20,
    },
    modalContainer: {
        backgroundColor: Colors.white,
        borderRadius: 16,
        width: '100%',
        maxWidth: screenWidth - 40,
        maxHeight: '80%',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.25,
        shadowRadius: 8,
        elevation: 8,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        paddingHorizontal: 24,
        paddingTop: 24,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: Colors.gray200,
    },
    titleContainer: {
        flex: 1,
        marginRight: 16,
    },
    eventTitle: {
        fontSize: 24,
        fontFamily: Fonts.bold,
        color: Colors.black,
        lineHeight: 32,
    },
    headerActions: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    actionButton: {
        padding: 8,
        marginLeft: 8,
    },
    content: {
        paddingHorizontal: 24,
        paddingVertical: 16,
    },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 24,
    },
    iconWrapper: {
        marginRight: 16,
        marginTop: 2,
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: Colors.gray100,
        justifyContent: 'center',
        alignItems: 'center',
    },
    iconGradient: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    detailContent: {
        flex: 1,
    },
    detailLabel: {
        fontSize: 14,
        fontFamily: Fonts.medium,
        color: Colors.gray500,
        marginBottom: 4,
    },
    detailValue: {
        fontSize: 16,
        fontFamily: Fonts.regular,
        color: Colors.black,
        lineHeight: 24,
    },
    guestsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginTop: 8,
    },
    guestAvatar: {
        alignItems: 'center',
        marginRight: 16,
        marginBottom: 8,
    },
    avatarGradient: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    avatarText: {
        color: Colors.white,
        fontSize: 16,
        fontFamily: Fonts.bold,
    },
    guestEmail: {
        fontSize: 12,
        fontFamily: Fonts.regular,
        color: Colors.gray500,
        textAlign: 'center',
        maxWidth: 80,
    },
});

export default EventDetailsModal;
