import { StatusBar, TouchableOpacity, View, Image, StyleSheet, Text } from "react-native";
import {
    colors,
    fontSize,
    spacing,
    borderRadius,
    shadows,
} from '../utils/LightTheme';
import { moderateScale, scaleHeight } from "../utils/dimensions";
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

interface HeaderWithMenuProps {
    onMenuPress: () => void;
    title: string;
    onRightMenuPress?: () => void;
}

const HeaderWithMenu: React.FC<HeaderWithMenuProps> = ({ 
    onMenuPress, 
    title,
    onRightMenuPress 
}) => {
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

                {/* 3. Right Menu Button (optional) */}
                {onRightMenuPress && (
                    <TouchableOpacity
                        style={headerStyles.rightMenuButton}
                        onPress={onRightMenuPress}
                        activeOpacity={0.7}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                        <Icon name="dots-vertical" size={20} color={colors.blackText} />
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );
};

export default HeaderWithMenu;

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
    menuButton: {
        width: moderateScale(40),
        height: moderateScale(40),
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: spacing.md,
        padding: spacing.xs,
    },
    titleText: {
        fontSize: fontSize.textSize20,
        fontWeight: '700',
        color: colors.blackText,
        flex: 1,
    },
    rightMenuButton: {
        width: moderateScale(40),
        height: moderateScale(40),
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing.xs,
    },
});

