import { StatusBar, TouchableOpacity, View, StyleSheet, Text } from "react-native";
import SearchIcon from '../assets/svgs/search.svg';
import MenuIcon from '../assets/svgs/menu.svg';

import {
    colors,
    fontSize,
    spacing,
    borderRadius,
    shadows,
} from '../utils/LightTheme';
import { moderateScale, scaleHeight, scaleWidth } from "../utils/dimensions";

const PlainHeader: React.FC<{ onMenuPress: () => void; title: string; onSearchPress?: () => void }> = ({ onMenuPress, title, onSearchPress }) => {
    return (
        <View style={headerStyles.container}>
            <StatusBar barStyle="dark-content" backgroundColor={colors.white} />
            <View style={headerStyles.header}>
                {/* 1. Menu Icon Button */}
                <TouchableOpacity
                    style={headerStyles.menuButton}
                    onPress={onMenuPress}
                    activeOpacity={0.7}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                    <MenuIcon width={24} height={24} />
                </TouchableOpacity>

                {/* 2. Title of the Screen (centered) */}
                <Text style={headerStyles.titleText}>{title}</Text>

                {/* 3. Search Icon Button */}
                <TouchableOpacity
                    style={headerStyles.searchButton}
                    onPress={onSearchPress}
                    activeOpacity={0.7}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                    <SearchIcon width={24} height={24} />
                </TouchableOpacity>
            </View>
        </View>
    );
};

export default PlainHeader;

const headerStyles = StyleSheet.create({
    container: {
        backgroundColor: colors.white,
        paddingBottom: spacing.sm,
        ...shadows.sm,
        position: 'relative',
        zIndex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing.md,
        paddingTop: spacing.sm,
        height: scaleHeight(60),
    },
    spacer: {
        flex: 1,
    },
    menuButton: {
        width: moderateScale(40),
        height: moderateScale(40),
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing.xs,
    },
    // --- NEW STYLE FOR THE TITLE ---
    titleText: {
        fontSize: fontSize.textSize20,
        fontWeight: '700',
        color: colors.blackText,
        marginLeft: scaleWidth(12),
        flex: 1,
    },
    searchButton: {
        width: moderateScale(40),
        height: moderateScale(40),
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing.xs,
    },
    // The original `title` style from your snippet, renamed to `titleText` for usage
    title: { 
        fontSize: fontSize.textSize20,
        fontWeight: '700',
        color: colors.blackText,
        textAlign: 'center',
    },
});