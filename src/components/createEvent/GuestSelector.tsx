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
  Dimensions,
} from 'react-native';
import { useActiveAccount } from '../../stores/useActiveAccount';
import { debugLogDcontacts } from '../../utils/debugDcontacts';
import {
  updateAndGetUnifiedContacts,
  Guest,
  extractNameFromEmail,
  extractUsernameFromEmail,
} from '../../utils/unifiedContacts';
import { addEmailsToLocalContacts } from '../../utils/dcontactsUtils';
import { Fonts } from '../../constants/Fonts';
import { scaleHeight, scaleWidth } from '../../utils/dimensions';
import {
  fontSize,
  colors,
  spacing,
  borderRadius,
} from '../../utils/LightTheme';
import FeatherIcon from 'react-native-vector-icons/Feather';

// Email validation regex (same as web)
const emailRegex =
  /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
const isValidEmail = (email: string): boolean => {
  return emailRegex.test(String(email).toLowerCase());
};

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const isTablet = SCREEN_WIDTH >= 600;
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

interface GuestSelectorProps {
  isVisible: boolean;
  selectedGuests: string[];
  onConfirmSelection: (guestEmails: string[]) => void;
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
  onConfirmSelection,
  onToggleDropdown,
  showGuestModal,
  onToggleGuestModal,
  searchQuery,
  onSearchQueryChange,
  disabled = false,
}) => {
  const [guests, setGuests] = useState<any[]>([]);
  const [pendingSelection, setPendingSelection] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState('');
  const [lastConfirmedGuests, setLastConfirmedGuests] = useState<string[]>([]);
  const { account } = useActiveAccount();

  // Load contacts when modal opens
  const loadContacts = useCallback(async () => {
    if (!showGuestModal) return;
    setIsLoading(true);
    setError(null);
    try {
      // Always use the persistent, merged, deduplicated, filtered contact store
      const unifiedGuests = await updateAndGetUnifiedContacts(
        account?.userName,
      );
      setGuests(unifiedGuests);
    } catch (err) {
      setError('Failed to load contacts');
      setGuests([]);
    } finally {
      setIsLoading(false);
    }
  }, [showGuestModal, account?.userName]);

  // Sync pendingSelection only when selectedGuests changes from parent (when Add is confirmed)
  useEffect(() => {
    // Check if selectedGuests actually changed (parent updated it)
    const guestsChanged =
      JSON.stringify(selectedGuests) !== JSON.stringify(lastConfirmedGuests);
    if (guestsChanged) {
      console.log(
        '[GuestSelector] selectedGuests changed from parent, syncing pendingSelection',
      );
      setPendingSelection(selectedGuests);
      setLastConfirmedGuests(selectedGuests);
    }
  }, [selectedGuests, lastConfirmedGuests]);

  // Load contacts when modal opens
  useEffect(() => {
    if (showGuestModal) {
      loadContacts();
      debugLogDcontacts(); // Log dcontacts for debugging
    } else {
      // Reset when modal closes (only clear guests and search)
      setGuests([]);
      onSearchQueryChange('');
    }
  }, [showGuestModal, loadContacts, onSearchQueryChange]);

  const togglePendingGuest = (guestEmail: string) => {
    setPendingSelection(prev => {
      const updated = prev.includes(guestEmail)
        ? prev.filter(email => email !== guestEmail)
        : [...prev, guestEmail];
      console.log(
        '[GuestSelector] togglePendingGuest:',
        guestEmail,
        '-> pendingSelection:',
        updated,
      );
      return updated;
    });
    setEmailError('');
  };

  // Add one or more emails to pending selection, validate, deduplicate, and store in AsyncStorage
  const addEmailToList = useCallback(
    async (input: string) => {
      // Split input by comma, semicolon, or whitespace
      const rawEmails = input
        .split(/[,;\s]+/)
        .map(e => e.trim().toLowerCase())
        .filter(e => e.length > 0);
      if (rawEmails.length === 0) {
        setEmailError('Enter a valid email');
        return;
      }
      // Remove duplicates in input
      const uniqueEmails = Array.from(new Set(rawEmails));
      // Validate and filter
      const validEmails = uniqueEmails.filter(e => isValidEmail(e));
      const invalidEmails = uniqueEmails.filter(e => !isValidEmail(e));
      // Remove already selected and self
      const filteredEmails = validEmails.filter(
        e =>
          !pendingSelection.some(sel => sel.toLowerCase() === e) &&
          (!account?.userName || e !== account.userName.toLowerCase()),
      );
      if (filteredEmails.length === 0) {
        if (invalidEmails.length > 0) {
          setEmailError('Some emails are invalid');
        } else {
          setEmailError('Already added or cannot invite yourself');
        }
        return;
      }
      setPendingSelection(prev => [...prev, ...filteredEmails]);
      setEmailError(
        invalidEmails.length > 0 ? `Invalid: ${invalidEmails.join(', ')}` : '',
      );
      onSearchQueryChange('');
      // Immediately add new emails to dcontactsDb (local contacts)
      try {
        await addEmailsToLocalContacts(filteredEmails);
      } catch (e) {
        // Ignore storage error
      }
    },
    [pendingSelection, account?.userName, onSearchQueryChange],
  );

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
  const isAddDisabled = pendingSelection.length === 0 || disabled;

  const handleCancel = () => {
    // Don't apply any changes - just close the modal
    // The useEffect will reset pendingSelection when modal closes
    setEmailError('');
    onToggleGuestModal();
  };

  const handleAdd = () => {
    onConfirmSelection(pendingSelection);
    setEmailError('');
    onToggleGuestModal();
  };

  // Always show pending selection count when modal is open to reflect live changes
  const displayCount = showGuestModal
    ? pendingSelection.length
    : selectedGuests.length;
  const displayText =
    displayCount > 0
      ? `${displayCount} guest${displayCount > 1 ? 's' : ''} selected`
      : 'Add people';

  return (
    <View style={styles.section}>
      <TouchableOpacity
        style={styles.guestInputContainer}
        onPress={onToggleGuestModal}
        disabled={disabled}
      >
        <Text style={styles.guestInput}>{displayText}</Text>
        <Text style={{ fontSize: 20, color: '#A4A7AE', marginLeft: 8 }}>
          ＋
        </Text>
      </TouchableOpacity>

      {/* Guest Modal */}
      <Modal
        visible={showGuestModal}
        animationType="slide"
        transparent={true}
        onRequestClose={handleCancel}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
          <TouchableOpacity
            style={styles.backdrop}
            activeOpacity={1}
            onPress={handleCancel}
            accessible={false}
          />
          <View style={styles.guestModalContainer}>
            {/* Modal Handle */}
            <View style={styles.modalHandle} />

            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add people</Text>
            </View>

            {/* Search Bar (with email add logic) */}
            <View
              style={[
                styles.searchContainer,
                // If valid, new email, highlight with #00AEEF
                isValidEmail(searchQuery.trim()) &&
                !pendingSelection.some(
                  e => e.toLowerCase() === searchQuery.trim().toLowerCase(),
                ) &&
                (!account?.userName ||
                  searchQuery.trim().toLowerCase() !==
                    account.userName.toLowerCase())
                  ? { borderColor: '#00AEEF', backgroundColor: '#E6F7FB' }
                  : hasNoResults
                  ? styles.searchContainerError
                  : null,
              ]}
            >
              <FeatherIcon
                name="search"
                size={20}
                color={
                  isValidEmail(searchQuery.trim()) &&
                  !pendingSelection.some(
                    e => e.toLowerCase() === searchQuery.trim().toLowerCase(),
                  ) &&
                  (!account?.userName ||
                    searchQuery.trim().toLowerCase() !==
                      account.userName.toLowerCase())
                    ? '#00AEEF'
                    : hasNoResults
                    ? '#EF4444'
                    : '#6C6C6C'
                }
              />
              <TextInput
                style={styles.searchInput}
                placeholder="Search contacts or add by email..."
                placeholderTextColor="#A4A7AE"
                value={searchQuery}
                onChangeText={text => {
                  onSearchQueryChange(text);
                  setEmailError('');
                }}
                editable={!disabled}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                returnKeyType="done"
                onSubmitEditing={() => {
                  if (searchQuery.trim().length > 0) {
                    addEmailToList(searchQuery);
                  }
                }}
              />
            </View>

            {/* If search is a valid, non-duplicate email, show cyan add option; suppress 'no such guest' in this case */}
            {isValidEmail(searchQuery.trim()) &&
              !pendingSelection.some(
                e => e.toLowerCase() === searchQuery.trim().toLowerCase(),
              ) &&
              (!account?.userName ||
                searchQuery.trim().toLowerCase() !==
                  account.userName.toLowerCase()) && (
                <TouchableOpacity
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    marginLeft: 28,
                    marginBottom: 8,
                  }}
                  onPress={() => addEmailToList(searchQuery)}
                >
                  <Text
                    style={{ fontSize: 18, color: '#00AEEF', marginRight: 6 }}
                  >
                    ＋
                  </Text>
                  <Text
                    style={{
                      color: '#00AEEF',
                      fontSize: 15,
                      fontWeight: '600',
                    }}
                  >
                    Add "{searchQuery.trim()}" as guest
                  </Text>
                </TouchableOpacity>
              )}
            {!!emailError && (
              <Text
                style={{
                  color: '#EF4444',
                  marginLeft: 28,
                  fontSize: 12,
                  marginBottom: 4,
                }}
              >
                {emailError}
              </Text>
            )}

            {/* Inline no-results helper: only show if not a valid email */}
            {hasNoResults && !isValidEmail(searchQuery.trim()) && (
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
                    onPress={() => togglePendingGuest(item.email)}
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
                                .map((n: string) => n[0])
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
                        pendingSelection.includes(item.email) && {
                          backgroundColor: '#00AEEF',
                          borderColor: '#00AEEF',
                        },
                      ]}
                    >
                      {pendingSelection.includes(item.email) && (
                        <FeatherIcon name="check" size={14} color="white" />
                      )}
                    </View>
                  </TouchableOpacity>
                )}
              />
            )}
            {/* Selected guest list (web-like style) */}
            {pendingSelection.length > 0 && (
              <View
                style={{
                  marginTop: 10,
                  marginHorizontal: 20,
                  maxHeight: 120,
                  overflow: 'hidden',
                }}
              >
                <View
                  style={{
                    maxHeight: 120,
                    overflow: 'scroll',
                    borderRadius: 8,
                    backgroundColor: '#F6F7F9',
                    paddingVertical: 6,
                    paddingHorizontal: 4,
                  }}
                >
                  {pendingSelection.map((email, idx) => (
                    <View
                      key={email + idx}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        marginBottom: 2,
                        paddingVertical: 4,
                        paddingHorizontal: 8,
                        borderRadius: 6,
                        backgroundColor: '#fff',
                        shadowColor: '#000',
                        shadowOpacity: 0.03,
                        shadowRadius: 1,
                        elevation: 1,
                        marginRight: 2,
                      }}
                    >
                      <Text
                        style={{
                          flex: 1,
                          color: '#252B37',
                          fontSize: 15,
                          overflow: 'hidden',
                        }}
                        numberOfLines={1}
                      >
                        {email}
                      </Text>
                      <TouchableOpacity
                        onPress={() => {
                          const updated = pendingSelection.filter(
                            e => e !== email,
                          );
                          setPendingSelection(updated);
                          // Immediately update parent to persist the removal
                          onConfirmSelection(updated);
                        }}
                        style={{ marginLeft: 8, padding: 2 }}
                        accessibilityLabel={`Remove ${email}`}
                      >
                        <FeatherIcon
                          name="x-circle"
                          size={18}
                          color="#EF4444"
                        />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Action Buttons */}
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={handleCancel}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.addButton,
                  isAddDisabled && styles.addButtonDisabled,
                ]}
                onPress={handleAdd}
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
    paddingVertical: getTabletSafeDimension(
      scaleHeight(12),
      scaleHeight(8),
      scaleHeight(10),
    ),
    paddingHorizontal: getTabletSafeDimension(
      spacing.sm,
      spacing.xs,
      spacing.sm,
    ),
    minHeight: getTabletSafeDimension(
      scaleHeight(44),
      scaleHeight(36),
      scaleHeight(40),
    ),
  },
  guestInput: {
    flex: 1,
    fontSize: getTabletSafeDimension(14, 9, 10),
    color: '#A4A7AE',
    fontWeight: '400',
    marginLeft: getTabletSafeDimension(spacing.sm, spacing.xs, spacing.sm),
    fontFamily: Fonts.latoRegular,
    lineHeight: getTabletSafeDimension(18, 12, 13),
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
    fontSize: getTabletSafeDimension(fontSize.textSize20, 16, 18),
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
    fontSize: getTabletSafeDimension(fontSize.textSize16, 14, 15),
    color: '#252B37',
    marginLeft: getTabletSafeDimension(spacing.sm, spacing.xs, spacing.sm),
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
    fontSize: getTabletSafeDimension(
      fontSize.textSize14,
      fontSize.textSize12,
      14,
    ),
    color: '#EF4444',
    fontFamily: Fonts.latoMedium,
  },
  inlineErrorSubtext: {
    fontSize: getTabletSafeDimension(
      fontSize.textSize12,
      fontSize.textSize11,
      12,
    ),
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
    borderRadius: getTabletSafeDimension(borderRadius.md, 4, 5),
    paddingVertical: getTabletSafeDimension(
      scaleHeight(12),
      scaleHeight(14),
      scaleHeight(14),
    ),
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: getTabletSafeDimension(fontSize.textSize14, 12, 13),
    fontWeight: '500',
    color: '#6B7280',
    fontFamily: Fonts.latoMedium,
  },
  addButton: {
    flex: 2,
    borderRadius: getTabletSafeDimension(borderRadius.md, 4, 5),
    backgroundColor: colors.primaryBlue,
    paddingVertical: getTabletSafeDimension(
      scaleHeight(12),
      scaleHeight(14),
      scaleHeight(14),
    ),
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonDisabled: {
    backgroundColor: '#D1D5DB',
    opacity: 0.6,
  },
  addButtonText: {
    fontSize: getTabletSafeDimension(fontSize.textSize14, 12, 13),
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
