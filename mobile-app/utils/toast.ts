import Toast from "react-native-toast-message";

/**
 * Show a success toast notification
 * @param message - Primary message to display
 * @param description - Optional secondary message
 */
export const showSuccessToast = (message: string, description?: string) => {
  Toast.show({
    type: "success",
    text1: message,
    text2: description,
    position: "bottom",
    visibilityTime: 3000,
    bottomOffset: 100,
  });
};

/**
 * Show an error toast notification
 * @param message - Primary error message to display
 * @param description - Optional error details
 */
export const showErrorToast = (message: string, description?: string) => {
  Toast.show({
    type: "error",
    text1: message,
    text2: description,
    position: "bottom",
    visibilityTime: 4000,
    bottomOffset: 100,
  });
};

/**
 * Show an info toast notification
 * @param message - Primary info message to display
 * @param description - Optional additional information
 */
export const showInfoToast = (message: string, description?: string) => {
  Toast.show({
    type: "info",
    text1: message,
    text2: description,
    position: "bottom",
    visibilityTime: 3000,
    bottomOffset: 100,
  });
};
