import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import HeaderWithMenu from '../components/HeaderWithMenu';
import CustomDrawer from '../components/CustomDrawer';
import { colors, fontSize, spacing, borderRadius, shadows } from '../utils/LightTheme';
import { scaleWidth, scaleHeight, moderateScale } from '../utils/dimensions';
import LinearGradient from 'react-native-linear-gradient';

const SendFeedbackScreen = () => {
  const navigation = useNavigation();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    contactNo: '',
    issueDescription: '',
  });

  const handleMenuPress = () => {
    setIsDrawerOpen(true);
  };

  const handleDrawerClose = () => {
    setIsDrawerOpen(false);
  };

  const handleCancel = () => {
    navigation.goBack();
  };

  const handleSend = () => {
    // TODO: Implement send feedback logic
    console.log('Sending feedback:', formData);
    // You can add API call here
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <HeaderWithMenu
          onMenuPress={handleMenuPress}
          title="Send Feedback"
        />

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Name Field */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter full name"
              placeholderTextColor="#999"
              value={formData.name}
              onChangeText={(text) => setFormData({ ...formData, name: text })}
            />
          </View>

          {/* Email Field */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your email"
              placeholderTextColor="#999"
              value={formData.email}
              onChangeText={(text) => setFormData({ ...formData, email: text })}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          {/* Contact No Field */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Contact no</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your contact number"
              placeholderTextColor="#999"
              value={formData.contactNo}
              onChangeText={(text) => setFormData({ ...formData, contactNo: text })}
              keyboardType="phone-pad"
            />
          </View>

          {/* Issue Description Field */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Could you describe your issue?</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Tell us how we can improve our product"
              placeholderTextColor="#999"
              value={formData.issueDescription}
              onChangeText={(text) => setFormData({ ...formData, issueDescription: text })}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
            />
          </View>
        </ScrollView>

        {/* Footer Buttons */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={handleCancel}
            activeOpacity={0.7}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.sendButton}
            onPress={handleSend}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#4CAF50', '#2196F3']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.gradientButton}
            >
              <Text style={styles.sendButtonText}>Send</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* Custom Drawer */}
      <CustomDrawer
        isOpen={isDrawerOpen}
        onClose={handleDrawerClose}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
  },
  fieldContainer: {
    marginBottom: spacing.lg,
  },
  label: {
    fontSize: fontSize.textSize16,
    fontWeight: '600',
    color: colors.blackText,
    marginBottom: spacing.sm,
  },
  input: {
    backgroundColor: '#F5F5F5',
    borderRadius: moderateScale(12),
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: fontSize.textSize16,
    color: colors.blackText,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    minHeight: moderateScale(48),
  },
  textArea: {
    minHeight: moderateScale(120),
    paddingTop: spacing.md,
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    backgroundColor: colors.white,
    gap: spacing.md,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    borderRadius: moderateScale(12),
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: fontSize.textSize16,
    fontWeight: '600',
    color: colors.blackText,
  },
  sendButton: {
    flex: 1,
    borderRadius: moderateScale(12),
    overflow: 'hidden',
  },
  gradientButton: {
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonText: {
    fontSize: fontSize.textSize16,
    fontWeight: '600',
    color: colors.white,
  },
});

export default SendFeedbackScreen;

