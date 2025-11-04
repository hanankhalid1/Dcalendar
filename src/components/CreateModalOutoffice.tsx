import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  StatusBar,
  Image,
} from 'react-native';
import FeatherIcon from 'react-native-vector-icons/Feather';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import AntDesign from 'react-native-vector-icons/AntDesign';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import { moderateScale, scaleHeight, scaleWidth } from '../utils/dimensions';
import {
  colors,
  fontSize,
  spacing,
  borderRadius,
  shadows,
} from '../utils/LightTheme';

interface CreateModalOutofficeProps {
  isVisible: boolean;
  onClose: () => void;
  onSave: () => void;
}

const CreateModalOutoffice: React.FC<CreateModalOutofficeProps> = ({
  isVisible,
  onClose,
  onSave,
}) => {
  const [declineMeetings, setDeclineMeetings] = React.useState(true);
  const [declineOption, setDeclineOption] = React.useState('new'); // 'new' or 'all'
  const [visibility, setVisibility] = React.useState('public');

  if (!isVisible) return null;

  return (
    <View style={styles.overlay}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.white} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Text style={styles.closeButtonText}>✕</Text>
        </TouchableOpacity>

        <View style={styles.titleContainer}>
          <Image
            source={require('../assets/images/CreateEventImages/CreateOutofficeText.png')}
          />
        </View>

        <View style={{ paddingLeft: scaleWidth(10) }}>
          <Image
            style={styles.arrowDropdown}
            source={require('../assets/images/CreateEventImages/arrowDropdown.png')}
          />
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Title Input */}
        <View style={styles.inputSection}>
          <TextInput
            style={styles.titleInput}
            placeholder="Out of office"
            placeholderTextColor={colors.grey400}
          />
          <View style={styles.inputUnderline} />
        </View>

        {/* Pick date and time */}
        <TouchableOpacity>
          <View style={styles.selectorItem}>
            <FeatherIcon name="calendar" size={20} color="#6C6C6C" />
            <Text style={styles.selectorText}>Pick date and time</Text>
            <Image
              style={styles.smallArrowDropdown}
              source={require('../assets/images/CreateEventImages/smallArrowDropdown.png')}
            />
          </View>
        </TouchableOpacity>

        {/* Automatically decline meetings checkbox */}
        <View style={styles.checkboxSection}>
          <TouchableOpacity
            style={styles.checkboxRow}
            onPress={() => setDeclineMeetings(!declineMeetings)}
          >
            <View style={styles.checkboxContainer}>
              {declineMeetings ? (
                <LinearGradient
                  colors={['#18F06E', '#0B6DE0']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.checkboxGradient}
                >
                  <FeatherIcon name="check" size={12} color="white" />
                </LinearGradient>
              ) : (
                <View style={styles.checkboxEmpty} />
              )}
            </View>
            <Text style={styles.checkboxText}>
              Automatically decline meetings
            </Text>
          </TouchableOpacity>

          {/* Radio button options - only show when checkbox is checked */}
          {declineMeetings && (
            <View style={styles.radioOptions}>
              <TouchableOpacity
                style={styles.radioOption}
                onPress={() => setDeclineOption('new')}
              >
                <View style={styles.radioContainer}>
                  {declineOption === 'new' ? (
                    <LinearGradient
                      colors={['#18F06E', '#0B6DE0']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.checkboxGradient}
                    >
                      <View style={styles.radioSelected} />
                    </LinearGradient>
                  ) : (
                    <View style={styles.radioEmpty} />
                  )}
                </View>
                <Text style={styles.radioText}>
                  Only new meeting invitations
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.radioOption}
                onPress={() => setDeclineOption('all')}
              >
                <View style={styles.radioContainer}>
                  {declineOption === 'all' ? (
                    <LinearGradient
                      colors={['#18F06E', '#0B6DE0']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.checkboxGradient}
                    >
                      <View style={styles.radioSelected} />
                    </LinearGradient>
                  ) : (
                    <View style={styles.radioEmpty} />
                  )}
                </View>
                <Text style={styles.radioText}>New and existing meetings</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Message Section */}
        <View style={styles.messageSection}>
          <Text style={styles.messageLabel}>Message</Text>
          <View style={styles.messageInputContainer}>
            <TextInput
              style={styles.messageInput}
              placeholder="Declined because I am out of office"
              placeholderTextColor={colors.grey400}
              multiline
              numberOfLines={3}
            />
          </View>
        </View>

        {/* Visibility Dropdown */}
        <View style={styles.visibilitySection}>
          <FeatherIcon name="eye" size={20} color="#6C6C6C" />
          <TouchableOpacity style={styles.visibilityDropdown}>
            <Text style={styles.visibilityText}>Public</Text>
            <FeatherIcon name="chevron-down" size={16} color="#6C6C6C" />
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Save Button */}
      <View style={styles.saveButtonContainer}>
        <TouchableOpacity style={styles.saveButton} onPress={onSave}>
          <LinearGradient
            colors={['#18F06E', '#0B6DE0']}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={styles.gradient}
          >
            <Text style={styles.saveButtonText}>Save</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
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
    backgroundColor: colors.white,
    zIndex: 1000,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: scaleHeight(50),
    paddingBottom: spacing.lg,
  },
  closeButton: {
    width: moderateScale(40),
    height: moderateScale(40),
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: fontSize.textSize17,
    color: colors.blackText,
    fontWeight: 'bold',
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },

  arrowDropdown: {
    height: scaleHeight(10.96),
    width: scaleWidth(16.16),
  },

  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  inputSection: {
    marginBottom: spacing.lg,
  },
  titleInput: {
    fontSize: fontSize.textSize25,
    color: colors.textPrimary2,
    paddingVertical: spacing.sm,
    minHeight: scaleHeight(50),
  },
  inputUnderline: {
    height: 1,
    backgroundColor: colors.grey20,
  },
  // *** START OF CHANGES ***
  selectorItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start', // Changed to left-align the content
    paddingVertical: spacing.md,
    marginBottom: spacing.lg,
    marginHorizontal: 0, // Removed to align with other content
  },
  selectorText: {
    fontSize: fontSize.textSize16,
    color: colors.blackText,
    fontWeight: '400',
    marginHorizontal: spacing.sm,
  },
  smallArrowDropdown: {
    height: scaleHeight(5.96),
    width: scaleWidth(10.9),
  },
  checkboxSection: {
    marginBottom: spacing.lg,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  checkboxContainer: {
    width: moderateScale(20),
    height: moderateScale(20),
    borderRadius: moderateScale(10),
    borderWidth: 1,
    borderColor: colors.figmaAccent,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
    overflow: 'hidden',
  },
  checkboxGradient: {
    width: '100%',
    height: '100%',
    borderRadius: moderateScale(10),
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxEmpty: {
    width: moderateScale(20),
    height: moderateScale(20),
    borderRadius: moderateScale(10),
    borderWidth: 1,
    borderColor: colors.figmaAccent,
  },
  checkboxText: {
    fontSize: fontSize.textSize16,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  radioOptions: {
    marginLeft: scaleWidth(32),
    marginTop: spacing.sm,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  radioContainer: {
    width: moderateScale(20),
    height: moderateScale(20),
    borderRadius: moderateScale(10),
    borderWidth: 1,
    borderColor: colors.figmaAccent,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  radioSelected: {
    width: moderateScale(12),
    height: moderateScale(12),
    borderRadius: moderateScale(6),
  },
  radioEmpty: {
    width: moderateScale(12),
    height: moderateScale(12),
    borderRadius: moderateScale(6),
    backgroundColor: 'transparent',
  },
  radioText: {
    fontSize: fontSize.textSize16,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  messageSection: {
    marginBottom: spacing.lg,
  },
  messageLabel: {
    fontSize: fontSize.textSize16,
    color: colors.blackText,
    fontWeight: '500',
    marginBottom: spacing.sm,
  },
  messageInputContainer: {
    position: 'relative',
  },
  messageInput: {
    fontSize: fontSize.textSize16,
    color: colors.textPrimary,
    paddingVertical: spacing.sm,
    minHeight: scaleHeight(80),
    textAlignVertical: 'top',
    fontWeight: '400',
  },

  visibilitySection: {
    marginBottom: spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
  },
  visibilityDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#DCE0E5',
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    backgroundColor: '#F6F7F9',
    width: scaleWidth(120), // Adjusted width to fit the text and icon
    height: scaleHeight(40),
    justifyContent: 'center', // Aligned content within the box to the center
    marginLeft: 10,
  },
  visibilityText: {
    fontSize: fontSize.textSize15,
    color: colors.blackText,
    fontWeight: '400',
    marginRight: spacing.sm, // Added spacing between text and dropdown arrow
  },
  saveButtonContainer: {
    position: 'absolute',
    bottom: scaleHeight(30),
    right: spacing.lg,
  },
  saveButton: {
    borderRadius: borderRadius.lg,
    minWidth: scaleWidth(100),
    alignItems: 'center',
    ...shadows.sm,
    overflow: 'hidden',
  },
  gradient: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
    width: '100%',
  },
  saveButtonText: {
    fontSize: fontSize.textSize16,
    color: colors.white,
    fontWeight: '600',
  },
});

export default CreateModalOutoffice;
