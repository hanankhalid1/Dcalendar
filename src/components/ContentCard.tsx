import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import {
  moderateScale,
  scaledSize,
  scaleHeight,
  scaleWidth,
  screenHeight,
  screenWidth,
} from '../utils/dimensions';
import { colors, fontSize, spacing, borderRadius, shadows } from '../utils/LightTheme';

interface ContentCardProps {
  title: string;
  subtitle?: string;
  isSelected?: boolean;
  onPress?: () => void;
  showChevron?: boolean;
  variant?: 'default' | 'highlighted' | 'large';
}

const ContentCard: React.FC<ContentCardProps> = ({
  title,
  subtitle,
  isSelected = false,
  onPress,
  showChevron = true,
  variant = 'default',
}) => {
  const getCardStyle = () => {
    switch (variant) {
      case 'highlighted':
        return [styles.card, styles.highlightedCard];
      case 'large':
        return [styles.card, styles.largeCard];
      default:
        return [styles.card, isSelected && styles.selectedCard];
    }
  };

  return (
    <TouchableOpacity
      style={getCardStyle()}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.content}>
        <View style={styles.textContainer}>
          <Text style={styles.title}>{title}</Text>
          {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        </View>
        {showChevron && (
          <TouchableOpacity style={styles.chevronContainer}>
            <Text style={styles.chevron}>▼</Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginVertical: spacing.xs,
    marginHorizontal: spacing.md,
    ...shadows.sm,
    borderWidth: 1,
    borderColor: colors.grey20,
  },
  selectedCard: {
    borderColor: colors.primary,
    backgroundColor: colors.backgroundSecondary,
  },
  highlightedCard: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  largeCard: {
    padding: spacing.lg,
    marginVertical: spacing.sm,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: fontSize.textSize16,
    fontWeight: '500',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: fontSize.textSize14,
    color: colors.textSecondary,
  },
  chevronContainer: {
    width: moderateScale(24),
    height: moderateScale(24),
    justifyContent: 'center',
    alignItems: 'center',
  },
  chevron: {
    fontSize: fontSize.textSize12,
    color: colors.textSecondary,
  },
});

export default ContentCard;
