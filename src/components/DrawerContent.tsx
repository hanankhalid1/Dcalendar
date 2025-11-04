import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import {
  moderateScale,
  scaleHeight,
  scaleWidth,
  screenHeight,
} from '../utils/dimensions';
import { colors, fontSize, spacing, borderRadius, shadows } from '../utils/LightTheme';

interface Contact {
  id: string;
  name: string;
  email: string;
  avatar: string;
}

interface Folder {
  id: string;
  name: string;
  color: string;
  icon: string;
}

interface DrawerContentProps {
  selectedAccount?: string;
  onAccountChange?: (account: string) => void;
  onContactPress?: (contact: Contact) => void;
  onFolderPress?: (folder: Folder) => void;
  onAddContact?: () => void;
  onAddFolder?: () => void;
}

const DrawerContent: React.FC<DrawerContentProps> = ({
  selectedAccount = 'user@dmail.nec',
  onAccountChange,
  onContactPress,
  onFolderPress,
  onAddContact,
  onAddFolder,
}) => {
  // Mock data for contacts
  const contacts = [
    {
      id: '1',
      name: 'Username',
      email: 'user@address.nec',
      avatar: 'U',
    },
    {
      id: '2',
      name: 'Username',
      email: 'user@address.nec',
      avatar: 'U',
    },
    {
      id: '3',
      name: 'Username',
      email: 'user@address.nec',
      avatar: 'U',
    },
  ];

  // Mock data for folders
  const folders = [
    {
      id: '1',
      name: 'Folder_1',
      color: colors.primary,
      icon: '📁',
    },
    {
      id: '2',
      name: 'Folder_2',
      color: colors.error,
      icon: '📁',
    },
    {
      id: '3',
      name: 'Folder_2',
      color: colors.grey600,
      icon: '📁',
    },
    {
      id: '4',
      name: 'Folder_3',
      color: colors.info,
      icon: '📁',
    },
  ];

  const handleAccountChange = () => {
    onAccountChange?.('user@dmail.nec');
  };

  const handleContactPress = (contact: Contact) => {
    onContactPress?.(contact);
  };

  const handleFolderPress = (folder: Folder) => {
    onFolderPress?.(folder);
  };

  const handleAddContact = () => {
    onAddContact?.();
  };

  const handleAddFolder = () => {
    onAddFolder?.();
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Logo Section */}
      <View style={styles.logoSection}>
        <View style={styles.logoContainer}>
          <View style={styles.logoIcon}>
            <Text style={styles.logoText}>D</Text>
          </View>
          <Text style={styles.logoTitle}>DMail</Text>
        </View>
      </View>

      {/* Account Section */}
      <View style={styles.accountSection}>
        <Text style={styles.sectionTitle}>Account</Text>
        <TouchableOpacity style={styles.accountSelector} onPress={handleAccountChange}>
          <Text style={styles.accountText}>{selectedAccount}</Text>
          <Text style={styles.chevronDown}>▼</Text>
        </TouchableOpacity>
      </View>

      {/* Quick Send Section */}
      <View style={styles.quickSendSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Quick Send to:</Text>
          <Text style={styles.countBadge}>{contacts.length}</Text>
        </View>
        
        {contacts.map((contact) => (
          <TouchableOpacity
            key={contact.id}
            style={styles.contactItem}
            onPress={() => handleContactPress(contact)}
          >
            <View style={styles.avatarContainer}>
              <Text style={styles.avatarText}>
                {contact.name.charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={styles.contactInfo}>
              <Text style={styles.contactName}>{contact.name}</Text>
              <Text style={styles.contactEmail}>{contact.email}</Text>
            </View>
          </TouchableOpacity>
        ))}
        
        <TouchableOpacity style={styles.addButton} onPress={handleAddContact}>
          <Text style={styles.addButtonIcon}>+</Text>
          <Text style={styles.addButtonText}>Add New Contact</Text>
        </TouchableOpacity>
      </View>

      {/* Folders Section */}
      <View style={styles.foldersSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Folders:</Text>
          <Text style={styles.countBadge}>{folders.length}</Text>
        </View>
        
        {folders.map((folder) => (
          <TouchableOpacity
            key={folder.id}
            style={styles.folderItem}
            onPress={() => handleFolderPress(folder)}
          >
            <View style={[styles.folderIcon, { backgroundColor: folder.color }]}>
              <Text style={styles.folderIconText}>📁</Text>
            </View>
            <Text style={styles.folderName}>{folder.name}</Text>
          </TouchableOpacity>
        ))}
        
        <TouchableOpacity style={styles.addButton} onPress={handleAddFolder}>
          <Text style={styles.addButtonIcon}>+</Text>
          <Text style={styles.addButtonText}>Add New Folder</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.drawerBackground,
  },
  logoSection: {
    paddingTop: scaleHeight(60),
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.drawerBorder,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoIcon: {
    width: moderateScale(40),
    height: moderateScale(40),
    borderRadius: borderRadius.md,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  logoText: {
    color: colors.white,
    fontSize: fontSize.textSize20,
    fontWeight: 'bold',
  },
  logoTitle: {
    color: colors.white,
    fontSize: fontSize.textSize24,
    fontWeight: 'bold',
  },
  accountSection: {
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.drawerBorder,
  },
  sectionTitle: {
    color: colors.white,
    fontSize: fontSize.textSize16,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  accountSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.drawerBorder,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
  },
  accountText: {
    color: colors.white,
    fontSize: fontSize.textSize14,
  },
  chevronDown: {
    color: colors.white,
    fontSize: fontSize.textSize12,
  },
  quickSendSection: {
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.drawerBorder,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  countBadge: {
    color: colors.primary,
    fontSize: fontSize.textSize14,
    fontWeight: 'bold',
    marginLeft: spacing.xs,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  avatarContainer: {
    width: moderateScale(36),
    height: moderateScale(36),
    borderRadius: moderateScale(18),
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  avatarText: {
    color: colors.white,
    fontSize: fontSize.textSize14,
    fontWeight: 'bold',
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    color: colors.white,
    fontSize: fontSize.textSize14,
    fontWeight: '500',
  },
  contactEmail: {
    color: colors.drawerTextLight,
    fontSize: fontSize.textSize12,
    marginTop: spacing.xs,
  },
  foldersSection: {
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
  },
  folderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  folderIcon: {
    width: moderateScale(32),
    height: moderateScale(32),
    borderRadius: borderRadius.sm,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  folderIconText: {
    fontSize: fontSize.textSize16,
  },
  folderName: {
    color: colors.white,
    fontSize: fontSize.textSize14,
    fontWeight: '500',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    marginTop: spacing.sm,
  },
  addButtonIcon: {
    color: colors.primary,
    fontSize: fontSize.textSize18,
    fontWeight: 'bold',
    marginRight: spacing.sm,
  },
  addButtonText: {
    color: colors.primary,
    fontSize: fontSize.textSize14,
    fontWeight: '500',
  },
});

export default DrawerContent;
