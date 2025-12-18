import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Image,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import FeatherIcon from 'react-native-vector-icons/Feather';
import LinearGradient from 'react-native-linear-gradient';
import ArrowDownIcon from '../../assets/svgs/arrow-down.svg';
import { moderateScale, scaleHeight, scaleWidth } from '../../utils/dimensions';
import {
  colors,
  fontSize,
  spacing,
  borderRadius,
  shadows,
} from '../../utils/LightTheme';
import { getAllContacts, Guest as DynamicGuest } from '../../utils/gueastUtils';
import { useActiveAccount } from '../../stores/useActiveAccount';
import { Fonts } from '../../constants/Fonts';

interface GuestSelectorProps {
  isVisible: boolean;
  selectedGuests: string[];
  onGuestSelect: (guestEmail: string) => void;
  onToggleDropdown: () => void;
  showGuestModal: boolean;
  onToggleGuestModal: () => void;
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
  disabled?: boolean;
}

const GuestSelector: React.FC<GuestSelectorProps> = ({
  isVisible,
  selectedGuests,
  onGuestSelect,
  onToggleDropdown,
  showGuestModal,
  onToggleGuestModal,
  searchQuery,
  onSearchQueryChange,
  disabled = false,
}) => {
  const [guests, setGuests] = useState<DynamicGuest[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { account } = useActiveAccount();

  // Load contacts when modal opens
  const loadContacts = useCallback(async () => {
    if (!showGuestModal) return;

    setIsLoading(true);
    setError(null);
    console.log('Loading contacts for user:', account?.userName);

    try {
      const result = await getAllContacts(account?.userName);
      console.log('Contact result:', result);

      if (result.success && Array.isArray(result.data)) {
        setGuests(result.data);
        console.log('Loaded contacts:', result.data.length);
      } else {
        setError(result.error || 'Failed to load contacts');
        setGuests([]);
        console.error('Failed to load contacts:', result.error);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      setGuests([]);
      console.error('Error loading contacts:', err);
    } finally {
      setIsLoading(false);
    }
  }, [showGuestModal, account?.userName]);

  // Load contacts when modal opens
  useEffect(() => {
    if (showGuestModal) {
      loadContacts();
    } else {
      // Reset when modal closes
      setGuests([]);
      onSearchQueryChange('');
    }
  }, [showGuestModal, loadContacts, onSearchQueryChange]);

  // Filter guests based on search query
  const normalizedQuery = searchQuery.trim().toLowerCase();
  const filteredGuests = guests.filter(
    guest =>
      guest.name.toLowerCase().includes(normalizedQuery) ||
      guest.email.toLowerCase().includes(normalizedQuery) ||
      guest.username.toLowerCase().includes(normalizedQuery),
  );
  const hasSearchTerm = normalizedQuery.length > 0;
  // Show no-results state immediately while typing (not gated on contacts being loaded)
  const hasNoResults =
    hasSearchTerm && !isLoading && !error && filteredGuests.length === 0;
  // Allow adding if guests are selected, even if current search has no results
  const isAddDisabled = selectedGuests.length === 0 || disabled;
  return (
    <View style={styles.section}>
      <TouchableOpacity
        style={styles.guestInputContainer}
        onPress={onToggleGuestModal}
        disabled={disabled}
      >
        <MaterialIcons name="person-add" size={20} color="#A4A7AE" />
        <Text style={styles.guestInput}>
          {selectedGuests.length > 0
            ? `${selectedGuests.length} guest${
                selectedGuests.length > 1 ? 's' : ''
              } selected`
            : 'Add people'}
        </Text>
        <FeatherIcon name="plus" size={20} color="#A4A7AE" />
      </TouchableOpacity>

      {/* Guest Modal */}
      <Modal
        visible={showGuestModal}
        animationType="slide"
        transparent={true}
        onRequestClose={onToggleGuestModal}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
          <TouchableOpacity
            style={styles.backdrop}
            activeOpacity={1}
            onPress={onToggleGuestModal}
            accessible={false}
          />
          <View style={styles.guestModalContainer}>
            {/* Modal Handle */}
            <View style={styles.modalHandle} />

            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add people</Text>
            </View>

            {/* Search Bar */}
            <View
              style={[
                styles.searchContainer,
                hasNoResults && styles.searchContainerError,
              ]}
            >
              <FeatherIcon
                name="search"
                size={20}
                color={hasNoResults ? '#EF4444' : '#6C6C6C'}
              />
              <TextInput
                style={[
                  styles.searchInput,
                  hasNoResults && styles.searchInputError,
                ]}
                placeholder="Search contacts..."
                placeholderTextColor="#A4A7AE"
                value={searchQuery}
                onChangeText={onSearchQueryChange}
                editable={!disabled}
              />
            </View>

            {/* Inline no-results helper under search input to avoid keyboard overlap */}
            {hasNoResults && (
              <View style={styles.inlineNoResultsContainer}>
                <Text style={styles.inlineErrorTitle}>No such guest found</Text>
                <Text style={styles.inlineErrorSubtext}>
                  Please check the spelling or try searching by email or
                  username.
                </Text>
              </View>
            )}

            {/* Guest List */}
            {isLoading ? (
              <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>Loading contacts...</Text>
              </View>
            ) : error ? (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity
                  style={styles.retryButton}
                  onPress={loadContacts}
                >
                  <Text style={styles.retryButtonText}>Retry</Text>
                </TouchableOpacity>
              </View>
            ) : filteredGuests.length === 0 ? (
              <View style={styles.emptyContainer}>
                {!hasSearchTerm && (
                  <Text style={styles.emptyText}>No contacts available</Text>
                )}
              </View>
            ) : (
              <FlatList
                data={filteredGuests}
                keyExtractor={item => item.id}
                style={styles.guestList}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode="on-drag"
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.guestItem}
                    onPress={() => onGuestSelect(item.email)}
                  >
                    <View style={styles.guestInfo}>
                      {/* Avatar */}
                      <View style={styles.guestAvatar}>
                        {item.avatar ? (
                          <Image
                            source={{ uri: item.avatar }}
                            style={styles.avatarImage}
                          />
                        ) : (
                          <View style={styles.avatarInitials}>
                            <Text style={styles.avatarInitialsText}>
                              {item.name
                                .split(' ')
                                .map(n => n[0])
                                .join('')}
                            </Text>
                          </View>
                        )}
                      </View>

                      {/* Name and Username */}
                      <View style={styles.guestDetails}>
                        <Text style={styles.guestName}>{item.name}</Text>
                        <Text style={styles.guestUsername}>
                          @{item.username}
                        </Text>
                      </View>
                    </View>

                    {/* Checkbox */}
                    <View
                      style={[
                        styles.checkbox,
                        selectedGuests.includes(item.email) &&
                          styles.checkboxSelected,
                      ]}
                    >
                      {selectedGuests.includes(item.email) && (
                        <FeatherIcon name="check" size={14} color="white" />
                      )}
                    </View>
                  </TouchableOpacity>
                )}
              />
            )}

            {/* Action Buttons */}
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={onToggleGuestModal}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.addButton,
                  isAddDisabled && styles.addButtonDisabled,
                ]}
                onPress={onToggleGuestModal}
                disabled={isAddDisabled}
              >
                <Text
                  style={[
                    styles.addButtonText,
                    isAddDisabled && styles.addButtonTextDisabled,
                  ]}
                >
                  Add
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    position: 'relative',
  },
  sectionTitle: {
    fontSize: fontSize.textSize14,
    color: colors.blackText,
    fontWeight: '400',
    marginBottom: spacing.sm,
  },
  guestInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#DCE0E5',
    backgroundColor: colors.white,
    borderRadius: 8,
    paddingVertical: scaleHeight(12),
    paddingHorizontal: spacing.sm,
    minHeight: scaleHeight(44),
  },
  guestInput: {
    flex: 1,
    fontSize: 14,
    color: '#A4A7AE',
    fontWeight: '400',
    marginLeft: spacing.sm,
    fontFamily: Fonts.latoRegular,
    lineHeight: 18,
    letterSpacing: 0,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  guestModalContainer: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '85%',
    minHeight: '50%',
    paddingBottom: scaleHeight(40),
  },
  modalHandle: {
    width: scaleWidth(40),
    height: scaleHeight(4),
    backgroundColor: '#D1D5DB',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: scaleHeight(12),
    marginBottom: scaleHeight(20),
  },
  modalHeader: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  modalTitle: {
    fontSize: fontSize.textSize20,
    fontWeight: '600',
    color: colors.blackText,
    fontFamily: Fonts.latoBold,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F6F7F9',
    borderRadius: 10,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  searchContainerError: {
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2',
  },
  searchInput: {
    flex: 1,
    fontSize: fontSize.textSize16,
    color: '#252B37',
    marginLeft: spacing.sm,
    padding: 0,
    fontFamily: Fonts.latoRegular,
  },
  guestList: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    maxHeight: '100%',
  },
  inlineNoResultsContainer: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm,
  },
  inlineErrorTitle: {
    fontSize: fontSize.textSize14,
    color: '#EF4444',
    fontFamily: Fonts.latoMedium,
  },
  inlineErrorSubtext: {
    fontSize: fontSize.textSize12,
    color: '#9CA3AF',
    marginTop: 4,
  },
  guestItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  guestInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  guestAvatar: {
    width: scaleWidth(40),
    height: scaleHeight(40),
    borderRadius: 20,
    marginRight: spacing.md,
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarInitials: {
    width: '100%',
    height: '100%',
    backgroundColor: '#FF9500',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitialsText: {
    fontSize: fontSize.textSize14,
    fontWeight: '600',
    color: colors.white,
  },
  guestDetails: {
    flex: 1,
  },
  guestName: {
    fontSize: fontSize.textSize16,
    fontWeight: '500',
    color: colors.blackText,
    marginBottom: 2,
    fontFamily: Fonts.latoMedium,
  },
  guestUsername: {
    fontSize: fontSize.textSize14,
    color: '#6B7280',
    fontFamily: Fonts.latoRegular,
  },
  checkbox: {
    width: scaleWidth(20),
    height: scaleHeight(20),
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: {
    backgroundColor: '#18F06E',
    borderColor: '#18F06E',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  loadingText: {
    fontSize: fontSize.textSize16,
    color: colors.blackText,
    fontWeight: '500',
    fontFamily: Fonts.latoMedium,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  errorText: {
    fontSize: fontSize.textSize16,
    color: '#EF4444',
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: spacing.md,
    fontFamily: Fonts.latoMedium,
  },
  retryButton: {
    backgroundColor: '#18F06E',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
  },
  retryButtonText: {
    fontSize: fontSize.textSize14,
    color: colors.white,
    fontWeight: '600',
  },
  modalActions: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    gap: spacing.md,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: borderRadius.md,
    paddingVertical: scaleHeight(12),
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: fontSize.textSize14,
    fontWeight: '500',
    color: '#6B7280',
    fontFamily: Fonts.latoMedium,
  },
  addButton: {
    flex: 2,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primaryBlue,
    paddingVertical: scaleHeight(12),
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonDisabled: {
    backgroundColor: '#D1D5DB',
    opacity: 0.6,
  },
  addButtonText: {
    fontSize: fontSize.textSize14,
    fontWeight: '600',
    color: colors.white,
    fontFamily: Fonts.latoSemiBold,
  },
  addButtonTextDisabled: {
    color: '#9CA3AF',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  emptyText: {
    fontSize: fontSize.textSize16,
    color: colors.blackText,
    fontWeight: '500',
    marginBottom: spacing.sm,
    fontFamily: Fonts.latoMedium,
  },
  noResultsContainer: {
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  emptySubtext: {
    fontSize: fontSize.textSize14,
    color: '#6B7280',
    textAlign: 'center',
  },
  errorSubtext: {
    fontSize: fontSize.textSize14,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: spacing.sm,
    lineHeight: 20,
    paddingHorizontal: spacing.md,
  },
});

export default GuestSelector;
