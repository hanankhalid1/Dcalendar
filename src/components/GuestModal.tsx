import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  FlatList,
  TextInput,
  Image,
  StyleSheet,
} from 'react-native';
import FeatherIcon from 'react-native-vector-icons/Feather';
import { colors, fontSize, spacing } from '../utils/LightTheme';
import { moderateScale, scaleHeight, scaleWidth } from '../utils/dimensions';
import { getAllContacts } from '../utils/gueastUtils';
import { useActiveAccount } from '../stores/useActiveAccount';

interface Guest {
  id: string;
  name: string;
  email: string;
  username: string;
  avatar?: string;
}

interface GuestModalProps {
  visible: boolean;
  onClose: () => void;
  selectedGuests: string[];
  onGuestSelect: (guestEmail: string) => void;
}

const GuestModal: React.FC<GuestModalProps> = ({
  visible,
  onClose,
  selectedGuests,
  onGuestSelect,
}) => {
  const [guests, setGuests] = useState<Guest[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
const {account}=useActiveAccount()
  // Load contacts when modal opens
  const loadContacts = useCallback(async () => {
    if (!visible) return;

    setIsLoading(true);
    setError(null);
    console.log("Loading contacts for user:", account?.userName);
    

    try {
      const response = await getAllContacts(account?.userName);
      if (response.success && response.data) {
        console.log("All Contacts:", response.data);
        
        setGuests(response.data);
      } else {
        setError('Failed to load contacts');
        setGuests([]);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load contacts');
      setGuests([]);
    } finally {
      setIsLoading(false);
    }
  }, [visible]);

  // Load contacts when modal becomes visible
  useEffect(() => {
    if (visible) {
      setSearchQuery('');
      loadContacts();
    } else {
      // Clear state when modal closes
      setGuests([]);
      setSearchQuery('');
      setError(null);
    }
  }, [visible, loadContacts]);

  // Filter guests based on search query
  const filteredGuests = guests.filter(
    guest =>
      guest.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      guest.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      guest.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderGuestItem = ({ item }: { item: Guest }) => (
    <TouchableOpacity
      style={styles.guestItem}
      onPress={() => onGuestSelect(item.email)}
    >
      <View style={styles.avatarContainer}>
        {item.avatar ? (
          <Image source={{ uri: item.avatar }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarText}>
              {item.name.charAt(0).toUpperCase()}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.guestInfo}>
        <Text style={styles.guestName}>{item.name}</Text>
        <Text style={styles.guestEmail}>{item.email}</Text>
      </View>

      <View
        style={[
          styles.checkbox,
          selectedGuests.includes(item.email) && styles.checkboxSelected,
        ]}
      >
        {selectedGuests.includes(item.email) && (
          <FeatherIcon name="check" size={14} color="white" />
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <FeatherIcon name="x" size={24} color={colors.blackText} />
          </TouchableOpacity>
          <Text style={styles.title}>Add guests</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <FeatherIcon name="search" size={20} color="#6C6C6C" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search contacts..."
            placeholderTextColor="#9E9E9E"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Content */}
        {isLoading ? (
          <View style={styles.centerContainer}>
            <Text style={styles.loadingText}>Loading contacts...</Text>
          </View>
        ) : error ? (
          <View style={styles.centerContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity onPress={loadContacts} style={styles.retryButton}>
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : filteredGuests.length === 0 ? (
          <View style={styles.centerContainer}>
            <Text style={styles.emptyText}>
              {searchQuery ? 'No contacts found' : 'No contacts available'}
            </Text>
          </View>
        ) : (
          <FlatList
            data={filteredGuests}
            renderItem={renderGuestItem}
            keyExtractor={(item) => item.id}
            style={styles.list}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.grey200,
  },
  closeButton: {
    padding: spacing.sm,
  },
  title: {
    fontSize: fontSize.textSize18,
    fontWeight: '600',
    color: colors.blackText,
  },
  placeholder: {
    width: scaleWidth(40),
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.grey100,
    margin: spacing.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: fontSize.textSize16,
    color: colors.blackText,
    marginLeft: spacing.sm,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  loadingText: {
    fontSize: fontSize.textSize16,
    color: colors.grey600,
  },
  errorText: {
    fontSize: fontSize.textSize16,
    color: '#EF4444',
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  retryButton: {
    backgroundColor: colors.primaryGreen,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: 8,
  },
  retryText: {
    color: colors.white,
    fontSize: fontSize.textSize14,
    fontWeight: '600',
  },
  emptyText: {
    fontSize: fontSize.textSize16,
    color: colors.grey600,
    textAlign: 'center',
  },
  list: {
    flex: 1,
  },
  guestItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.grey100,
  },
  avatarContainer: {
    marginRight: spacing.md,
  },
  avatar: {
    width: scaleWidth(40),
    height: scaleHeight(40),
    borderRadius: 20,
  },
  avatarPlaceholder: {
    width: scaleWidth(40),
    height: scaleHeight(40),
    borderRadius: 20,
    backgroundColor: colors.primaryGreen,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: colors.white,
    fontSize: fontSize.textSize16,
    fontWeight: '600',
  },
  guestInfo: {
    flex: 1,
  },
  guestName: {
    fontSize: fontSize.textSize16,
    fontWeight: '500',
    color: colors.blackText,
    marginBottom: 2,
  },
  guestEmail: {
    fontSize: fontSize.textSize14,
    color: colors.grey600,
  },
  checkbox: {
    width: scaleWidth(24),
    height: scaleHeight(24),
    borderRadius: 4,
    borderWidth: 2,
    borderColor: colors.grey400,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: {
    backgroundColor: colors.primaryGreen,
    borderColor: colors.primaryGreen,
  },
});

export default GuestModal;