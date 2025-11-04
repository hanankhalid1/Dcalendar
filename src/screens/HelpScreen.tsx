import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ScrollView,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

// Header Component
const Header = ({ title, onMenuPress }) => (
  <View style={styles.header}>
    <View style={styles.headerLeft}>
      <Ionicons name="menu" size={24} color="#333" />
      <Text style={styles.headerTitle}>{title}</Text>
    </View>
    <TouchableOpacity onPress={onMenuPress} style={styles.menuButton}>
      <Ionicons name="ellipsis-vertical" size={20} color="#333" />
    </TouchableOpacity>
  </View>
);

// Search Bar Component
const SearchBar = ({ placeholder, value, onChangeText }) => (
  <View style={styles.searchContainer}>
    <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
    <TextInput
      style={styles.searchInput}
      placeholder={placeholder}
      value={value}
      onChangeText={onChangeText}
      placeholderTextColor="#999"
    />
  </View>
);

// Menu Item Component
const MenuItem = ({ icon, title, onPress }) => (
  <TouchableOpacity style={styles.menuItem} onPress={onPress}>
    <View style={styles.menuItemIcon}>
      <Ionicons name={icon} size={20} color="#4A90E2" />
    </View>
    <Text style={styles.menuItemText}>{title}</Text>
  </TouchableOpacity>
);

// Dropdown Menu Component
const DropdownMenu = ({ visible, onClose, items }) => {
  if (!visible) return null;
  
  return (
    <View style={styles.dropdownOverlay}>
      <TouchableOpacity style={styles.dropdownBackdrop} onPress={onClose} />
      <View style={styles.dropdownMenu}>
        {items.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={styles.dropdownItem}
            onPress={() => {
              item.onPress();
              onClose();
            }}
          >
            <Text style={styles.dropdownItemText}>{item.title}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

// Main Help Screen Component
export default function  HelpScreen () {
  const [searchText, setSearchText] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);

  const menuItems = [
    {
      icon: 'eye-outline',
      title: 'Change your event visibility',
      onPress: () => console.log('Change event visibility pressed'),
    },
    {
      icon: 'share-outline',
      title: 'Share your calendar with someone',
      onPress: () => console.log('Share calendar pressed'),
    },
    {
      icon: 'mail-outline',
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
      title: 'Clear help history',
      onPress: () => console.log('Clear help history pressed'),
    },
    {
      title: 'Version info',
      onPress: () => console.log('Version info pressed'),
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      <Header
        title="Help"
        onMenuPress={() => setShowDropdown(true)}
      />
      
      <ScrollView style={styles.content}>
        <SearchBar
          placeholder="Search help"
          value={searchText}
          onChangeText={setSearchText}
        />
        
        <View style={styles.menuItemsContainer}>
          {menuItems.map((item, index) => (
            <MenuItem
              key={index}
              icon={item.icon}
              title={item.title}
              onPress={item.onPress}
            />
          ))}
        </View>
      </ScrollView>
      
      <DropdownMenu
        visible={showDropdown}
        onClose={() => setShowDropdown(false)}
        items={dropdownItems}
      />
    </SafeAreaView>
  );
};

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 12,
    color: '#333',
  },
  menuButton: {
    padding: 4,
  },
  content: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    paddingVertical: 4,
  },
  menuItemsContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginBottom: 1,
    borderRadius: 8,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  menuItemIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuItemText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  dropdownOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  dropdownBackdrop: {
    flex: 1,
  },
  dropdownMenu: {
    position: 'absolute',
    top: 60,
    right: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    minWidth: 150,
  },
  dropdownItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  dropdownItemText: {
    fontSize: 14,
    color: '#333',
  },
});

