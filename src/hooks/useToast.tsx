// ToastContext.tsx
import React, { createContext, useContext, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Fonts } from '../constants/Fonts';
import { Colors } from '../constants/Colors';
import { scale } from 'react-native-size-matters';

const { width } = Dimensions.get('window');

export type ToastType = 'success' | 'error' | 'warning';

interface ToastData {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

interface ToastContextType {
  showToast: (
    type: ToastType,
    title: string,
    message?: string,
    duration?: number,
  ) => void;
  hideToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

// Toast Item Component
const ToastItem: React.FC<{
  toast: ToastData;
  onHide: (id: string) => void;
}> = ({ toast, onHide }) => {
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(-100));

  const getToastConfig = (type: ToastType) => {
    switch (type) {
      case 'success':
        return {
          backgroundColor: '#FFFFFF',
          borderColor: '#00AEEF',
          iconColor: '#31AA7A',
          iconName: 'check',
          titleColor: '#606873',
        };
      case 'error':
        return {
          backgroundColor: '#FFEBEE',
          borderColor: '#F44336',
          iconColor: '#F44336',
          iconName: 'alert-circle',
          titleColor: '#C62828',
        };
      case 'warning':
        return {
          backgroundColor: '#FFF8E1',
          borderColor: '#FF9800',
          iconColor: '#FF9800',
          iconName: 'alert',
          titleColor: '#E65100',
        };
      default:
        return {
          backgroundColor: '#E3F2FD',
          borderColor: '#2196F3',
          iconColor: '#2196F3',
          iconName: 'information',
          titleColor: '#1565C0',
        };
    }
  };

  const config = getToastConfig(toast.type);

  React.useEffect(() => {
    // Animate in
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();

    // Auto hide after duration
    const timer = setTimeout(() => {
      hideToast();
    }, toast.duration || 4000);

    return () => clearTimeout(timer);
  }, []);

  const hideToast = useCallback(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: -100,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onHide(toast.id);
    });
  }, [toast.id, onHide]);

  return (
    <Animated.View
      style={[
        styles.toastContainer,
        {
          backgroundColor: config.backgroundColor,
          borderLeftColor: config.borderColor,
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <View style={styles.toastContent}>
        <View style={styles.iconContainer}>
          <Icon name={config.iconName} size={28} color={config.iconColor} />
        </View>

        <View style={styles.textContainer}>
          <Text
            style={[
              styles.toastTitle,
              { fontFamily: Fonts.semiBold, color: config.titleColor },
            ]}
            numberOfLines={1}
          >
            {toast.title}
          </Text>
          {toast.message && (
            <Text
              style={[
                styles.toastMessage,
                { fontFamily: Fonts.regular, color: '#606873' },
              ]}
              numberOfLines={2}
            >
              {toast.message}
            </Text>
          )}
        </View>

        <TouchableOpacity onPress={hideToast} style={styles.closeButton}>
          <Icon name="close" size={18} color="#666" />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

// Toast Container Component
const ToastContainer: React.FC<{
  toasts: ToastData[];
  onHide: (id: string) => void;
}> = ({ toasts, onHide }) => {
  const insets = useSafeAreaInsets();

  if (toasts.length === 0) return null;

  return (
    <View style={[styles.overlay, { top: StatusBar.currentHeight }]}>
      {toasts.map(toast => (
        <ToastItem key={toast.id} toast={toast} onHide={onHide} />
      ))}
    </View>
  );
};

// Toast Provider Component
export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [toasts, setToasts] = useState<ToastData[]>([]);

  const showToast = useCallback(
    (
      type: ToastType,
      title: string,
      message?: string,
      duration: number = 4000,
    ) => {
      const id =
        Date.now().toString() + Math.random().toString(36).substr(2, 9);
      const newToast: ToastData = {
        id,
        type,
        title,
        message,
        duration,
      };

      setToasts(prev => [...prev, newToast]);
    },
    [],
  );

  const hideToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast, hideToast }}>
      {children}
      <ToastContainer toasts={toasts} onHide={hideToast} />
    </ToastContext.Provider>
  );
};

// Custom Hook
export const useCustomToast = (): ToastContextType => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useCustomToast must be used within a ToastProvider');
  }
  return context;
};

// Convenience methods for the hook
export const useToast = () => {
  const { showToast, hideToast } = useCustomToast();

  return {
    success: (title: string, message?: string, duration?: number) => {
      showToast('success', title, message, duration);
    },
    error: (title: string, message?: string, duration?: number) => {
      showToast('error', title, message, duration);
    },
    warning: (title: string, message?: string, duration?: number) => {
      showToast('warning', title, message, duration);
    },
    show: showToast,
    hide: hideToast,
  };
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 9999,
    elevation: 9999,
    pointerEvents: 'box-none',
  },
  toastContainer: {
    marginHorizontal: 16,
    marginVertical: 4,
    borderRadius: 12,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  toastContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  iconContainer: {
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
    height: 30,
  },
  textContainer: {
    flex: 1,
    marginRight: 8,
    marginBottom: 14,
  },
  toastTitle: {
    fontSize: scale(16),
    lineHeight: scale(22),
  },
  toastMessage: {
    fontSize: scale(14),
    color: '#666',
    lineHeight: 18,
  },
  closeButton: {
    padding: 2,
    marginTop: 2,
  },
});

export default ToastProvider;
