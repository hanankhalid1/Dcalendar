import React from "react";
import { Modal, View, Text, TouchableOpacity, StyleSheet, BackHandler } from "react-native";
import { Colors } from "../constants/Colors";
import { Fonts } from "../constants/Fonts";
import LinearGradient from "react-native-linear-gradient";
import ExitApp from "react-native-exit-app";

interface ExitConfirmModalProps {
  visible: boolean;
  onCancel: () => void;
}

const ExitConfirmModal: React.FC<ExitConfirmModalProps> = ({
  visible,
  onCancel,
}) => {
  // 2. Use the new ExitApp.exitApp() function
  const exitApp = () => {
    ExitApp.exitApp();
  };
  return (
    <Modal transparent visible={visible} animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.container}>
          <Text style={styles.title}>Exit App?</Text>
          <Text style={styles.subtitle}>
            Are you sure you want to close DCalendar?
          </Text>

          <View style={styles.buttonRow}>
            {/* Cancel */}
            <TouchableOpacity onPress={onCancel} style={styles.cancelBtn}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>

            {/* Exit */}
            <TouchableOpacity onPress={exitApp} style={styles.gradientWrapper}>
              <LinearGradient
                colors={[Colors.primaryGreen, Colors.primaryblue]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.exitBtn}
              >
                <Text style={styles.exitText}>Exit</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default ExitConfirmModal;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  container: {
    width: "85%",
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 24,
  },
  title: {
    fontFamily: Fonts.bold,
    fontSize: 22,
    color: Colors.black,
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: Fonts.regular,
    fontSize: 15,
    color: "#666",
    textAlign: "center",
    marginBottom: 20,
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  cancelBtn: {
    paddingVertical: 10,
    paddingHorizontal: 25,
    backgroundColor: "#eee",
    borderRadius: 14,
  },
  cancelText: {
    fontFamily: Fonts.semiBold,
    fontSize: 14,
    color: Colors.black,
  },
  gradientWrapper: {
    borderRadius: 14,
    overflow: "hidden",
  },
  exitBtn: {
    paddingVertical: 10,
    paddingHorizontal: 25,
    justifyContent: "center",
    alignItems: "center",
  },
  exitText: {
    fontFamily: Fonts.semiBold,
    fontSize: 14,
    color: Colors.white,
  },
});
