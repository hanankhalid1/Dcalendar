import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import MaskedView from '@react-native-masked-view/masked-view';
import HeaderWithMenu from '../components/HeaderWithMenu';
import CustomDrawer from '../components/CustomDrawer';
import { colors, fontSize, spacing, borderRadius, shadows } from '../utils/LightTheme';
import { scaleWidth, scaleHeight, moderateScale } from '../utils/dimensions';

// Help Topic Item Component
const HelpTopicItem = ({ icon, title, onPress }: { icon: string; title: string; onPress: () => void }) => (
  <TouchableOpacity style={styles.helpTopicItem} onPress={onPress} activeOpacity={0.7}>
    <View style={styles.helpTopicIconContainer}>
      <MaskedView
        maskElement={
          <Icon name={icon} size={20} color="#000000" />
        }
        style={styles.maskedView}
      >
        <LinearGradient
          colors={['#18F06E', '#0B6DE0']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.gradient}
        >
          <Icon name={icon} size={20} color="#FFFFFF" style={{ opacity: 0 }} />
        </LinearGradient>
      </MaskedView>
    </View>
    <Text style={styles.helpTopicText}>{title}</Text>
  </TouchableOpacity>
);

// Dropdown Menu Component
const DropdownMenu = ({ visible, onClose, items }: { visible: boolean; onClose: () => void; items: Array<{ title: string; onPress: () => void }> }) => {
  if (!visible) return null;
  
  return (
    <>
      <TouchableOpacity 
        style={styles.dropdownBackdrop} 
        onPress={onClose}
        activeOpacity={1}
      />
      <View style={styles.dropdownMenu}>
        {items.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.dropdownItem,
              index === items.length - 1 && styles.dropdownItemLast
            ]}
            onPress={() => {
              item.onPress();
              onClose();
            }}
            activeOpacity={0.7}
          >
            <Text style={styles.dropdownItemText}>{item.title}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </>
  );
};

// Main Help Screen Component
const HelpScreen = () => {
  const navigation = useNavigation();
  const [searchText, setSearchText] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const handleMenuPress = () => {
    setIsDrawerOpen(true);
  };

  const handleDrawerClose = () => {
    setIsDrawerOpen(false);
  };

  const helpTopics = [
    {
      icon: 'calendar',
      title: 'Change your event visibility',
      onPress: () => console.log('Change event visibility pressed'),
    },
    {
      icon: 'calendar',
      title: 'Share your calendar with someone',
      onPress: () => console.log('Share calendar pressed'),
    },
    {
      icon: 'calendar',
      title: 'Respond to event invitations',
      onPress: () => console.log('Respond to invitations pressed'),
    },
  ];

  const dropdownItems = [
    {
      title: 'Help',
      onPress: () => console.log('Help pressed'),
    },
    {
      title: 'Clear Help history',
      onPress: () => {
        console.log('Clear help history pressed');
        // TODO: Implement clear help history
      },
    },
    {
      title: 'Version info',
      onPress: () => {
        console.log('Version info pressed');
        // TODO: Show version info
      },
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <HeaderWithMenu
        title="Help"
        onMenuPress={handleMenuPress}
        onRightMenuPress={() => setShowDropdown(true)}
      />
      
      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Icon name="magnify" size={20} color="#999" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search help"
            placeholderTextColor="#999"
            value={searchText}
            onChangeText={setSearchText}
          />
        </View>
        
        {/* Help Topics */}
        <View style={styles.helpTopicsContainer}>
          {helpTopics.map((topic, index) => (
            <HelpTopicItem
              key={index}
              icon={topic.icon}
              title={topic.title}
              onPress={topic.onPress}
            />
          ))}
        </View>
      </ScrollView>
      
      {/* Dropdown Menu */}
      <DropdownMenu
        visible={showDropdown}
        onClose={() => setShowDropdown(false)}
        items={dropdownItems}
      />

      {/* Custom Drawer */}
      <CustomDrawer
        isOpen={isDrawerOpen}
        onClose={handleDrawerClose}
      />
    </SafeAreaView>
  );
};

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  content: {
    flex: 1,
    backgroundColor: '#F8F8F8',
  },
  contentContainer: {
    paddingBottom: spacing.xl,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    marginBottom: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: moderateScale(12),
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  searchIcon: {
    marginRight: spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: fontSize.textSize16,
    color: colors.blackText,
    paddingVertical: 0,
  },
  helpTopicsContainer: {
    paddingHorizontal: spacing.lg,
  },
  helpTopicItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    marginBottom: spacing.md,
    borderRadius: moderateScale(12),
    borderWidth: 1,
    borderColor: '#E0E0E0',
    ...shadows.sm,
  },
  helpTopicIconContainer: {
    width: moderateScale(40),
    height: moderateScale(40),
    borderRadius: moderateScale(20),
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  maskedView: {
    width: moderateScale(20),
    height: moderateScale(20),
    justifyContent: 'center',
    alignItems: 'center',
  },
  gradient: {
    flex: 1,
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  helpTopicText: {
    fontSize: fontSize.textSize16,
    color: colors.blackText,
    fontWeight: '500',
    flex: 1,
  },
  dropdownBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
  },
  dropdownMenu: {
    position: 'absolute',
    top: scaleHeight(70),
    right: spacing.lg,
    backgroundColor: '#F5F5F5',
    borderRadius: moderateScale(12),
    ...shadows.lg,
    minWidth: scaleWidth(180),
    overflow: 'hidden',
    zIndex: 1000,
  },
  dropdownItem: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  dropdownItemLast: {
    borderBottomWidth: 0,
  },
  dropdownItemText: {
    fontSize: fontSize.textSize14,
    color: colors.blackText,
    fontWeight: '500',
  },
});

export default HelpScreen;
