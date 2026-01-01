import { moderateScale } from './dimensions';

export const colors = {
  // Primary Colors - More vibrant
  primary: '#667EEA', // Beautiful purple-blue
  primary2: '#4CAF50',
  primaryLight: '#A78BFA',
  primaryDark: '#5B21B6',

  // Secondary Colors - More attractive
  secondary: '#F093FB', // Pink gradient
  accent: '#FFD93D', // Bright yellow

  // Background Colors - More modern
  background: '#F8FAFF',
  backgroundSecondary: '#F0F4FF',
  white: '#FFFFFF',
  lightGrayishBlue: '#DCE0E5',
  mediumgray: '#6C6C6C',
  veryLightGrayishBlue: '#E2E8EB45',
  lightgray: '#DDDDDD30',
  mediumlightgray: '#A3ABAD',
  neutralmediumgray: '#828282',
  taskbg:'#479ce75c',
  // Text Colors - Better contrast
  textPrimary: '#3B3B3B99',
  textPrimary2: '#3B3B3BCC',
  textSecondary: '#16213E',
  // Beautiful Gradients
  gradientBackground: ['#F8FAFF', '#E8EAFF'],
  gradientSuccess: ['#00D4AA', '#00B894'],

  // Figma Colors from Properties Panel
  figmaAccent: '#18F06E', // Green from gradient
  figmaPurple: '#9976FF', // Purple with 20% opacity
  figmaOrange: '#F7C06D', // Light orange/tan
  figmaPink: '#FF88FA', // Pink
  figmaLightBlue: '#ACCFFF', // Light blue with 10% opacity
  navired: '#eb4232',
  // Primary Blue Color
  primaryBlue: '#00AEEF', // Primary blue color for buttons and UI elements
  
  // FloatingActionButton Gradient
  fabGradient: ['#18F06E', '#00AEEF'], // Teal to blue gradient
  figmaPurpleOpacity20: '#9976FF1A',
  // Legacy Colors (keeping for compatibility)
  black: '#000000',
  raisinBlack: '#222222',
  splashbackgound: '#60b263',
  grey600: '#8B96A5',
  grey400: '#ACB6BF',
  grey20: '#D9D9D9', // add this on create event components
  grey200: '#A299AF',
  grey100: '#F6F7F9', // adds in create event screen add discriprion
  grey50: '#ACB6BF',
  inputText: '#5D4D74',
  blackText: '#4A4A4A',
  dimGray: '#6B6B6B',
  highlight: '#E5F1FF',
  bluegray: '#14181F',
  grey700: '#414651',
  grey300: '#8E8E8E',
  grey500: '#B8B8B8',

  // Drawer Navigation Colors
  drawerBackground: '#2C2C2C',
  drawerBorder: '#404040',
  drawerTextLight: '#B0B0B0',

  // Additional Colors
  error: '#FF4444',
  info: '#2196F3',
  primaryBlue: '#00AEEF', // Primary blue color - use this for all blue UI elements
  lightGrayBg: '#f5f5f5', // Light gray background color
};

export const fontSize = {
  textSize9: moderateScale(9),
  textSize10: moderateScale(10),
  textSize11: moderateScale(11),
  textSize12: moderateScale(12),
  textSize13: moderateScale(13),
  textSize14: moderateScale(14),
  textSize15: moderateScale(15),
  textSize16: moderateScale(16),
  textSize17: moderateScale(17),
  textSize18: moderateScale(18),
  textSize19: moderateScale(19),
  textSize20: moderateScale(20),
  textSize21: moderateScale(21),
  textSize22: moderateScale(22),
  textSize23: moderateScale(23),
  textSize24: moderateScale(24),
  textSize25: moderateScale(25),
  textSize26: moderateScale(26),
  textSize27: moderateScale(27),
  textSize28: moderateScale(28),
  textSize29: moderateScale(29),
  textSize30: moderateScale(30),
  textSize31: moderateScale(31),
  textSize32: moderateScale(32),
  textSize33: moderateScale(33),
  textSize34: moderateScale(34),
  textSize35: moderateScale(35),
  textSize36: moderateScale(36),
};

// Modern spacing system
export const spacing = {
  xs: moderateScale(4),
  sm: moderateScale(8),
  md: moderateScale(16),
  lg: moderateScale(24),
  xl: moderateScale(32),
  xxl: moderateScale(48),
};

// Border radius system
export const borderRadius = {
  sm: moderateScale(4),
  md: moderateScale(8),
  lg: moderateScale(12),
  xl: moderateScale(16),
  xxl: moderateScale(24),
  full: moderateScale(9999),
};

// Enhanced Shadow system
export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 12,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.25,
    shadowRadius: 28,
    elevation: 16,
  },
  glow: {
    shadowColor: '#667EEA',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 8,
  },
};
