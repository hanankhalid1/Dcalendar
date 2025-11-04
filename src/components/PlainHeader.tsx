import { StatusBar, TouchableOpacity, View, Image,StyleSheet,Text } from "react-native";

import {
    colors,
    fontSize,
    spacing,
    borderRadius,
    shadows,
} from '../utils/LightTheme';
import { moderateScale, scaleHeight } from "../utils/dimensions";

const PlainHeader: React.FC<{ onMenuPress: () => void; title: string }> = ({ onMenuPress, title }) => {
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
                    <Image
                        source={require('../assets/images/HeaderImages/HeaderDrawer.png')}
                    />
                </TouchableOpacity>

                {/* 2. Title of the Screen (to the right of the menu icon) */}
                <Text style={headerStyles.titleText}>{title}</Text>

                {/* Optional: If you need space between title and right-side content, add <View style={headerStyles.spacer} /> here */}
                
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
        marginRight: spacing.md, // Spacing between the icon and the title
        padding: spacing.xs,
    },
    // --- NEW STYLE FOR THE TITLE ---
    titleText: {
        fontSize: fontSize.textSize20,
        fontWeight: '700',
        color: colors.blackText, // Using the color you defined in the original `title` style
        // flex: 1, // Optional: useful if the title should take up all remaining space
    },
    // The original `title` style from your snippet, renamed to `titleText` for usage
    title: { 
        fontSize: fontSize.textSize20,
        fontWeight: '700',
        color: colors.blackText,
        textAlign: 'center',
    },
});