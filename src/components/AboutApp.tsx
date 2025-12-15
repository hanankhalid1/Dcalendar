import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Dimensions,
} from 'react-native';
import FeatherIcon from 'react-native-vector-icons/Feather';
import { useNavigation } from '@react-navigation/native';
import { Colors } from '../constants/Colors';
import { Fonts } from '../constants/Fonts';
import * as DimensionsUtils from '../utils/dimensions';

const { width: screenWidth } = Dimensions.get('window');
const { scaleWidth, scaleHeight, moderateScale } = DimensionsUtils;

const AboutApp: React.FC = () => {
  const navigation = useNavigation();
  return (
    <SafeAreaView style={styles.container}>
      {/* Header with Back Button */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <FeatherIcon name="arrow-left" size={24} color={Colors.black} />
          <Text style={styles.headerBack}>About app</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Title */}
        <View style={styles.titleSection}>
          <Text style={styles.title}>About DCalendar</Text>
        </View>

        {/* Description Section */}
        <View style={styles.descriptionSection}>
          <Text style={styles.descriptionText}>
            DCalendar App is a simple and smart way to manage all your schedules
            in one place. You can easily add events, tasks, and birthdays, and
            set reminders so you never miss an important moment. The app allows
            you to switch between daily, weekly, and monthly calendar views,
            giving you full control over how you plan your professional needs.
            If you ever face any issue, you can quickly reach out to our support
            team directly through the app.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5', // Match event screen background
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: scaleWidth(16),
    paddingVertical: scaleHeight(12),
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleWidth(8),
  },
  headerBack: {
    fontSize: 16,
    fontWeight: '500',
    fontFamily: Fonts.latoMedium,
    color: Colors.black,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: scaleWidth(20),
    paddingVertical: scaleHeight(24),
    paddingBottom: scaleHeight(40),
  },
  titleSection: {
    marginBottom: scaleHeight(24),
    marginTop: scaleHeight(12),
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    fontFamily: Fonts.latoBold,
    color: Colors.black,
    lineHeight: 34,
  },
  descriptionSection: {
    marginBottom: scaleHeight(24),
  },
  descriptionText: {
    fontSize: 14,
    fontWeight: '400',
    fontFamily: Fonts.latoRegular,
    color: Colors.gray600,
    lineHeight: 22,
    textAlign: 'left',
  },
});

export default AboutApp;
