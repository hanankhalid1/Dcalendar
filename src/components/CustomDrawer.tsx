import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  Image,
  ActivityIndicator,
  Easing,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import CalenderIcon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';
import {
  moderateScale,
  scaleHeight,
  scaleWidth,
  screenHeight,
} from '../utils/dimensions';

import { colors, fontSize, spacing, shadows, borderRadius } from '../utils/LightTheme';
import { useActiveAccount } from '../stores/useActiveAccount';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BlockchainService } from '../services/BlockChainService';
import Config from '../config';
import { useApiClient } from '../hooks/useApi';
import { useToken } from '../stores/useTokenStore';
import { useEventsStore } from '../stores/useEventsStore';
import { Colors } from '../constants/Colors';
import { Fonts } from '../constants/Fonts';

interface CustomDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Account {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  backgroundColor?: string;
  isSelected?: boolean;
  username?: string;
  userName?: string;
  ncogWalletAddress?: string;
}

const CustomDrawer: React.FC<CustomDrawerProps> = ({
  isOpen,
  onClose,
}) => {
  const slideAnim = useRef(new Animated.Value(-scaleWidth(280))).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const navigation = useNavigation<any>();

  // State for calendar items check/uncheck
  const [myCalendars, setMyCalendars] = useState({
    routine: true,
    events: true,
  });

  const [otherCalendars, setOtherCalendars] = useState({
    holidays: true,
    school: false,
  });

  // State for expandable sections
  const [isMyCalendarsExpanded, setIsMyCalendarsExpanded] = useState(true);
  const [isOtherCalendarsExpanded, setIsOtherCalendarsExpanded] = useState(true);
  const { setAccount, account } = useActiveAccount();
  const [showCreateMenu, setShowCreateMenu] = useState(false);
  const [createBtnWindowLayout, setCreateBtnWindowLayout] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const createBtnRef = useRef<View | null>(null);
  const menuComputedWidth = scaleWidth(190);
  const { api } = useApiClient();
  // NEW: State for account dropdown
  const [isAccountDropdownOpen, setIsAccountDropdownOpen] = useState(false);
  const [isLoadingAccount, setIsLoadingAccount] = useState(false);
  const [loadingAccountId, setLoadingAccountId] = useState<string | null>(null);
  const [accountBtnLayout, setAccountBtnLayout] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const { token, setToken } = useToken();
  const doNavigate = (route: string) => {
    navigation.navigate(route);
  };
  const [accounts, setaccounts] = useState<Account[]>([]);
  const { getUserEvents, clearAllEventsData } = useEventsStore();
  // NEW: Toggle function for account dropdown
  const toggleAccountDropdown = () => {
    setIsAccountDropdownOpen(prev => !prev);
  };

  // Handler functions
  const toggleMyCalendar = (calendarType: 'routine' | 'events') => {
    setMyCalendars(prev => ({
      ...prev,
      [calendarType]: !prev[calendarType],
    }));
  };

  const toggleOtherCalendar = (calendarType: 'holidays' | 'school') => {
    setOtherCalendars(prev => ({
      ...prev,
      [calendarType]: !prev[calendarType],
    }));
  };

  const toggleMyCalendarsSection = () => {
    setIsMyCalendarsExpanded(!isMyCalendarsExpanded);
  };

  const toggleOtherCalendarsSection = () => {
    setIsOtherCalendarsExpanded(!isOtherCalendarsExpanded);
  };

  const fetchAccountDetails = async () => {
    try {
      const hostContract = new BlockchainService(Config.NECJSPK);
      const stpra = await AsyncStorage.getItem('token');
      console.log('stpra', stpra);

      if (!stpra) return;
      const parseData = JSON.parse(stpra);
      console.log('parseData', parseData);

      const details = await hostContract.getUserDetailsForWallet(
        parseData?.ncogWalletAddress,
      );
      console.log('details in Custom Drawer', details);
      if (details) {
        setaccounts(details);
        console.log('details====================================');
        console.log(details);
        console.log('====================================');
      }
    } catch (error) {
      console.log('error====================================');
      console.log(JSON.stringify(error));
      console.log('====================================');
    }
  };

  // Add your fetchAccountTokenAndSave function
  const fetchAccountTokenAndSave = async (selectedAccount: Account, userName: string) => {
    console.log('userName1234', userName);

    const stpra = await AsyncStorage.getItem('token');
    const parseData = JSON.parse(stpra || '');
    const payload = {
      user_name: userName,
      publicKey: parseData?.ncogPublicKey,
      appName: 'dCalendar',
    };

    console.log('Payload for login API:', payload);

    try {
      const res = await api('POST', 'login', payload);
      console.log('Login API response:', res.data);

      if (res && res.data) {
        const { token, isAuth, isAccess } = res.data;

        if (isAuth === true) {
          console.log('✅ Authentication successful');
          console.log('Setting active account to:', account);

          setAccount(selectedAccount);
          await AsyncStorage.setItem(
            'currentAccount',
            JSON.stringify(res.data),
          );

          if (token && token !== null && token !== undefined) {
            await AsyncStorage.setItem('ac', JSON.stringify(token));
            setToken(token);
          } else {
            console.warn('⚠️ No token received from login API response');
            await AsyncStorage.removeItem('ac');
          }
          await getUserEvents(selectedAccount.userName || account.userName, api);

          onClose();
        } else {
          console.warn('❌ Authentication failed:', {
            isAuth,
            isAccess,
            message: 'User authentication or access denied',
          });
          await AsyncStorage.removeItem('ac');
        }
      } else {
        console.warn('⚠️ No response received from login API');
        await AsyncStorage.removeItem('ac');
      }
    } catch (error) {
      console.log('❌ Login API error:', error);
      await AsyncStorage.removeItem('ac');
    }

  };

  const handleAccountSelection = async (selectedAccount: Account) => {

    console.log('handleAccountSelection called with:', selectedAccount.userName);
    console.log('Current active account:', account.userName);
    // Check if the selected account is already active
    if (
      selectedAccount.ncogWalletAddress === account?.ncogWalletAddress &&
      (selectedAccount.userName === account?.userName)
    ) {
      console.log('Account is already active');
      setIsAccountDropdownOpen(false);
      return;
    }
    setIsLoadingAccount(true);
    setLoadingAccountId(selectedAccount.userName);
    // Call the function to fetch and save token for the selected account
    try {
      // Call the function to fetch and save token for the selected account
      await fetchAccountTokenAndSave(selectedAccount, selectedAccount.userName || '');
    } catch (error) {
      console.error('Error switching account:', error);
    } finally {
      // Reset loading state
      setIsLoadingAccount(false);
      setLoadingAccountId(null);
    }

    // Close the dropdown after selection
    setIsAccountDropdownOpen(false);
  };



  useEffect(() => {
    fetchAccountDetails();
  }, []);

  useEffect(() => {
    if (isOpen) {
      // Animate drawer slide in and backdrop fade in
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: 300,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Animate drawer slide out and backdrop fade out
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: -scaleWidth(280),
          duration: 300,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 0,
          duration: 300,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();
    }
    setShowCreateMenu(false);
    setIsAccountDropdownOpen(false); // Close dropdown when drawer closes
  }, [isOpen, slideAnim, backdropOpacity]);

  const renderAccountDropdown = () => {
    if (!isAccountDropdownOpen || accounts.length === 0) return null;

    return (
      <ScrollView nestedScrollEnabled={true} style={styles.accountDropdownContainer}>
        {accounts.map((acc, index) => {
          const isCurrentAccount =
            acc.ncogWalletAddress === account?.ncogWalletAddress &&
            acc.userName === account?.userName;
          const isLoading = isLoadingAccount && loadingAccountId === acc.userName;

          return (
            <TouchableOpacity
              key={index}
              style={[
                styles.accountDropdownItem,
                isLoading && styles.accountDropdownItemLoading
              ]}
              onPress={() => {
                if (!isLoadingAccount) {
                  handleAccountSelection(acc);
                  console.log('Selected account:', acc);
                }
              }}
              disabled={isLoadingAccount}
            >
              {/* Avatar */}
              <View style={styles.avatarContainer}>
                <Text style={styles.avatarText}>
                  {acc.name?.trim()?.charAt(0)?.toUpperCase() || 'N'}
                </Text>
              </View>

              <View style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexDirection: 'row',
                flex: 1
              }}>
                {/* Account Details in Dropdown Item */}
                <View style={styles.profileTextContainer}>
                  <Text style={styles.profileName} numberOfLines={1}>
                    {acc.name}
                  </Text>
                  <Text style={styles.profileUsername} numberOfLines={1}>
                    {acc.username || acc.userName}
                  </Text>
                </View>

                {/* Show loader or active indicator */}
                {isLoading ? (
                  <ActivityIndicator
                    size="small"
                    color={Colors.primaryblue}
                    style={{ marginLeft: 8 }}
                  />
                ) : isCurrentAccount ? (
                  <Text style={styles.activeAccountIndicator}> (Active)</Text>
                ) : null}
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    );
  };

  async function handleLogout() {
    try {
      console.log("Logging out...");

      // Clear all state
      setAccount(null);
      setToken(null); // FIX: Use setToken instead of token.clearToken()

      // Clear events data (await if it's async)
      await clearAllEventsData();

      // Clear AsyncStorage
      await AsyncStorage.clear();

      console.log("Logout complete, navigating to WalletScreen");

      // Reset navigation stack to WalletScreen
      navigation.navigate('Wallet');

    } catch (error) {
      console.error("Logout error:", error);
      // Even if there's an error, try to navigate

    }
  }

  // Keep component mounted during animation for smooth transitions
  // Only hide when fully closed (handled by pointerEvents)

  return (
    <View style={styles.overlay} pointerEvents={isOpen ? 'auto' : 'none'}>
      <Animated.View
        style={[
          styles.backdrop,
          {
            opacity: backdropOpacity,
          },
        ]}
        pointerEvents={isOpen ? 'auto' : 'none'}
      >
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          onPress={() => {
            setShowCreateMenu(false);
            setIsAccountDropdownOpen(false);
            onClose();
          }}
          activeOpacity={1}
        />
      </Animated.View>

      <Animated.View
        style={[styles.drawer, { transform: [{ translateX: slideAnim }] }]}
      >
        {showCreateMenu && (
          <TouchableOpacity
            style={styles.menuBackdrop}
            onPress={() => setShowCreateMenu(false)}
            activeOpacity={1}
          />
        )}
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
        >
          {/* Top Section */}
          <View style={styles.topSection}>

            {/* NEW: Container for Menu Button + Logo/Home Link */}
            <View style={styles.logoRow}>

              {/* 1. MENU BUTTON: Only closes the drawer */}
              <TouchableOpacity
                style={styles.menuCloseButton} // Add a new style for spacing
                onPress={onClose} // Just close the drawer
              >
                <Icon name="menu" size={24} color={colors.white} />
              </TouchableOpacity>

              {/* 2. LOGO/TITLE BUTTON: Navigates to HomeScreen AND closes the drawer */}
              <TouchableOpacity
                style={styles.logoSection} // Use a style that handles alignment, no margin needed here
                onPress={() => {
                  // This is the desired behavior for the Home link
                  doNavigate('HomeScreen');
                  onClose();
                }}
              >
                <View style={styles.logoContainer}>
                  {/* Removed the original Icon name="menu" here */}
                  <View style={{ paddingHorizontal: spacing.sm }}>
                    <Image
                      source={require('../assets/images/DrawerMainIcon.png')}
                    />
                  </View>
                  <Text style={styles.logoText}>Calendar</Text>
                </View>
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={styles.createButtonText}
              onPress={() => {
                setShowCreateMenu(prev => !prev);
              }}
              onLayout={e => setCreateBtnWindowLayout(e.nativeEvent.layout)}
            >
              <Image source={require('../assets/images/createButton.png')} />
            </TouchableOpacity>
          </View>

          {/* Views Section */}
          <View style={styles.section}>
            <TouchableOpacity
              style={styles.navItem}
              onPress={() => {
                doNavigate('DailyCalendarScreen');
                onClose();
              }}
            >
              <Image source={require('../assets/images/Orangefolder.png')} />
              <Text style={styles.navText}>Day</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.navItem}
              onPress={() => {
                doNavigate('WeekScreen');
                onClose();
              }}
            >
              <Image source={require('../assets/images/Blackfolder.png')} />
              <Text style={styles.navText}>Week</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.navItem}
              onPress={() => {
                doNavigate('MonthlyCalenderScreen');
                onClose();
              }}
            >
              <Image source={require('../assets/images/Grayfolder.png')} />
              <Text style={styles.navText}>Month</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.separator} />

          {/* User Profile with Dropdown Toggle */}
          <TouchableOpacity
            style={styles.profileSection}
            onPress={toggleAccountDropdown}
            onLayout={e => setAccountBtnLayout(e.nativeEvent.layout)}
          >
            {/* Avatar Section */}
            {
              (() => {
                const initial = (account?.name?.trim()?.charAt(0) || 'N').toUpperCase();
                return (
                  <View style={styles.avatarContainer}>
                    <Text style={styles.avatarText}>{initial}</Text>
                  </View>
                );
              })()
            }
            {/* Profile Text */}
            <View style={styles.profileTextContainer}>
              <Text style={styles.profileName}>{account?.name || "Name"}</Text>
              <Text style={styles.profileUsername}>
                {account?.username || account?.userName || 'Select Account'}
              </Text>
            </View>
            {/* Dropdown Indicator Icon */}
            <Icon
              name={isAccountDropdownOpen ? "menu-up" : "menu-down"}
              size={24}
              color={colors.white}
              style={{ marginLeft: 'auto' }}
            />
          </TouchableOpacity>

          {/* RENDER THE ACCOUNT DROPDOWN HERE */}
          {renderAccountDropdown()}


          {/* <View style={styles.section}>
            <TouchableOpacity
              style={styles.expandableHeader}
              onPress={toggleMyCalendarsSection}
            >
              <Image
                style={[
                  styles.expandArrow,
                  {
                    transform: [
                      { rotate: isMyCalendarsExpanded ? '0deg' : '-90deg' },
                    ],
                  },
                ]}
                source={require('../assets/images/arrowDropdown.png')}
              />
              <CalenderIcon
                name="perm-contact-calendar"
                size={24}
                color="#fff"
              />
              <Text style={styles.sectionHeaderText}>My calendars</Text>
            </TouchableOpacity>

            {isMyCalendarsExpanded && (
              <>
                <TouchableOpacity
                  style={styles.calendarItem}
                  onPress={() => toggleMyCalendar('routine')}
                >
                  <Image
                    style={styles.checkcircle}
                    source={
                      myCalendars.routine
                        ? require('../assets/images/checkcircle.png')
                        : require('../assets/images/unCheckcircle.png')
                    }
                  />
                  <Text style={styles.calendarText}>Routine</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.calendarItem}
                  onPress={() => toggleMyCalendar('events')}
                >
                  <Image
                    style={styles.checkcircle}
                    source={
                      myCalendars.events
                        ? require('../assets/images/checkcircle.png')
                        : require('../assets/images/unCheckcircle.png')
                    }
                  />
                  <Text style={styles.calendarText}>Events</Text>
                </TouchableOpacity>
              </>
            )}
          </View>

        
          <View style={styles.section}>
            <View style={styles.expandableHeader}>
              <TouchableOpacity
                style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}
                onPress={toggleOtherCalendarsSection}
              >
                <Image
                  style={[
                    styles.expandArrow,
                    {
                      transform: [
                        {
                          rotate: isOtherCalendarsExpanded ? '0deg' : '-90deg',
                        },
                      ],
                    },
                  ]}
                  source={require('../assets/images/arrowDropdown.png')}
                />
                <CalenderIcon name="date-range" size={24} color="#fff" />
                <Text style={styles.sectionHeaderText}>Other calendars</Text>
                <Image
                  style={styles.addIcon}
                  source={require('../assets/images/addIcon.png')}
                />
              </TouchableOpacity>
            </View>

            {isOtherCalendarsExpanded && (
              <>
                <TouchableOpacity
                  style={styles.calendarItem}
                  onPress={() => toggleOtherCalendar('holidays')}
                >
                  <Image
                    style={styles.checkcircle}
                    source={
                      otherCalendars.holidays
                        ? require('../assets/images/checkcircle.png')
                        : require('../assets/images/unCheckcircle.png')
                    }
                  />
                  <Text style={styles.calendarText}>Holidays</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.calendarItem}
                  onPress={() => toggleOtherCalendar('school')}
                >
                  <Image
                    style={styles.checkcircle}
                    source={
                      otherCalendars.school
                        ? require('../assets/images/checkcircle.png')
                        : require('../assets/images/unCheckcircle.png')
                    }
                  />
                  <Text style={styles.calendarText}>School</Text>
                </TouchableOpacity>
              </>
            )}
          </View> */}

          <View style={styles.separator} />

          {/* Bottom Nav */}
          <View style={styles.section}>
            <TouchableOpacity
              style={styles.navItem}
              onPress={() => {
                doNavigate('DeletedEventsScreen');
                onClose();
              }}
            >
              <Icon name="delete-outline" size={24} color="#FFFFFF" />
              <Text style={styles.navText}>Trash</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.navItem}
              onPress={() => {
                doNavigate('SettingsScreen');
                onClose();
              }}
            >
              <Image
                source={require('../assets/images/Primaryfolder-open.png')}
              />
              <Text style={styles.navText}>Settings</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.navItem}
              onPress={() => {
                doNavigate('SendFeedbackScreen');
                onClose();
              }}
            >
              <Image source={require('../assets/images/Orangefolder.png')} />
              <Text style={styles.navText}>Send Feedback</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.navItem}
              onPress={() => {
                doNavigate('HelpScreen');
                onClose();
              }}
            >
              <Image source={require('../assets/images/Blackfolder.png')} />
              <Text style={styles.navText}>Help</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.navItem}
              onPress={() => {
                handleLogout();
                onClose();
              }}
            >
              <Icon name="logout" size={24} color="#F44336" /> // Material red

              <Text style={styles.navText}>Log Out</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
        {showCreateMenu && (
          <View
            style={[
              styles.createMenuContainer,
              {
                top: (createBtnWindowLayout?.y || 0) + (createBtnWindowLayout?.height || 0) + scaleHeight(24),
                left:
                  ((createBtnWindowLayout?.x || 0) + ((createBtnWindowLayout?.width || 0) / 2)) -
                  (menuComputedWidth / 2),
                right: undefined,
              },
            ]}
            pointerEvents="auto"
          >
            <TouchableOpacity
              style={styles.createMenuItem}
              onPress={() => {
                console.log('>>>>>>>>> Event');
                setShowCreateMenu(false);
                doNavigate('CreateEventScreen');
                onClose();
              }}
            >
              <Text style={styles.createMenuTextOnly}>Event</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.createMenuItem}
              onPress={() => {
                console.log('>>>>>>>>> Task');
                setShowCreateMenu(false);
                doNavigate('CreateTaskScreen');
                onClose();
              }}
            >
              <Text style={styles.createMenuTextOnly}>Task</Text>
            </TouchableOpacity>
            {/* <TouchableOpacity
              style={[styles.createMenuItem, { borderBottomWidth: 0 }]}
              onPress={() => {
                console.log('>>>>>>>>> Appointment');
                setShowCreateMenu(false);
                doNavigate('AppointmentScheduleScreen');
                onClose();
              }}
            >
            </TouchableOpacity> */}
          </View>
        )}
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
    flexDirection: 'row',
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  drawer: {
    width: scaleWidth(280),
    height: screenHeight,
    backgroundColor: colors.drawerBackground,
    ...shadows.lg,
    position: 'absolute',
    left: 0,
    top: 0,
    paddingBottom: scaleHeight(80),
  },
  menuBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 50,
  },
  scrollView: {
    flex: 1,
    paddingTop: scaleHeight(20),
  },
  topSection: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.lg,
    position: 'relative',
  },
  logoSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,

  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoText: {
    fontSize: fontSize.textSize20,
    color: colors.white,
    fontWeight: '700',
  },
  createButtonText: {
    alignSelf: 'center',
  },
  createMenuContainer: {
    position: 'absolute',
    right: spacing.md,
    top: scaleHeight(56),
    backgroundColor: colors.white,
    borderRadius: moderateScale(12),
    ...shadows.lg,
    width: scaleWidth(190),
    overflow: 'hidden',
    zIndex: 100,
    elevation: 12,
  },
  createMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.drawerBorder,
  },
  createMenuCheck: {
    color: '#111827',
    marginRight: spacing.sm,
  },
  createMenuText: {
    color: '#111827',
    fontSize: fontSize.textSize15,
    fontWeight: '600',
  },
  createMenuTextOnly: {
    color: '#111827',
    fontSize: fontSize.textSize15,
    fontWeight: '600',
    marginLeft: spacing.lg,
  },
  section: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  sectionTitle: {
    fontSize: fontSize.textSize16,
    color: colors.white,
    fontWeight: '600',
    marginBottom: spacing.md,
  },
  sectionHeaderText: {
    fontSize: fontSize.textSize16,
    color: colors.white,
    fontWeight: '600',
    marginLeft: spacing.sm,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  navText: {
    fontSize: fontSize.textSize16,
    color: colors.white,
    fontWeight: '600',
    paddingHorizontal: spacing.sm,
  },
  separator: {
    height: 1,
    backgroundColor: colors.drawerBorder,
    marginVertical: spacing.lg,
    marginHorizontal: spacing.md,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.md,
    marginVertical: spacing.sm,
  },
  profileTextContainer: {
    paddingHorizontal: spacing.sm,
    flex: 1,
  },
  avatarContainer: {
    width: scaleWidth(32),
    height: scaleWidth(32),
    borderRadius: scaleWidth(16),
    backgroundColor: '#2D3748',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: fontSize.textSize14,
  },
  profileName: {
    fontSize: fontSize.textSize18,
    color: colors.white,
    fontWeight: '600',
  },
  profileUsername: {
    fontSize: fontSize.textSize12,
    color: colors.drawerTextLight,
    fontWeight: '500',
  },
  // NEW: Styles for account dropdown
  accountDropdownContainer: {
    backgroundColor: colors.drawerBackground,
    marginHorizontal: spacing.md,
    marginVertical: spacing.xs,
    borderRadius: moderateScale(8),
    borderWidth: 1,
    borderColor: colors.drawerBorder,
    maxHeight: scaleHeight(200),

  },
  accountDropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.drawerBorder,
  },
  activeAccountIndicator: {
    fontSize: fontSize.textSize10,
    color: colors.primary || '#4CAF50',
    fontWeight: '600',
  },
  expandableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  expandArrow: {
    width: moderateScale(8.6),
    height: moderateScale(4.7),
    marginRight: spacing.sm,
    resizeMode: 'contain',
  },
  addIcon: {
    marginLeft: scaleWidth(12),
    justifyContent: 'center',
    alignSelf: 'center',
    height: scaleHeight(12.94),
    width: scaleWidth(12.94),
  },
  calendarItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingLeft: scaleWidth(30),
  },
  checkcircle: {
    height: scaleHeight(20),
    width: scaleWidth(20),
  },
  calendarText: {
    fontSize: fontSize.textSize14,
    color: colors.white,
    fontWeight: '500',
    marginLeft: spacing.sm,
  },
  logoRow: {
    // This makes the menu button and logo/title align horizontally
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'flex-start', // Align items to the top
    marginBottom: spacing.lg,
  },
  menuCloseButton: {
    // Style to give the menu button some padding/margin
    paddingRight: spacing.sm,
    paddingVertical: spacing.xs,
  },
  accountDropdownItemLoading: {
    opacity: 0.6,
  },
});

export default CustomDrawer;