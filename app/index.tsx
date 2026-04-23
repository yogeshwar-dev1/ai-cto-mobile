import * as FileSystem from "expo-file-system";
import { StatusBar } from "expo-status-bar";
import { useEffect, useRef, useState } from "react";
import {
  Alert,
  BackHandler,
  Platform,
  StyleSheet,
  View,
} from "react-native";
import { WebView } from "react-native-webview";
import type { WebViewNavigation } from "react-native-webview";
import type { ShouldStartLoadRequest } from "react-native-webview/lib/WebViewTypes";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ProgressBar } from "@/components/ProgressBar";
import { useDeepLink } from "@/hooks/useDeepLink";
import { usePushNotifications } from "@/hooks/usePushNotifications";

const PWA_URL = "https://ai-cto.onrender.com/pwa.html";

const DOWNLOAD_EXTENSIONS = [
  ".pdf",
  ".doc",
  ".docx",
  ".xls",
  ".xlsx",
  ".zip",
  ".csv",
  ".ppt",
  ".pptx",
  ".apk",
  ".mp4",
  ".mp3",
];

export default function WebViewScreen() {
  const webViewRef = useRef<WebView>(null);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [canGoBack, setCanGoBack] = useState(false);
  const [currentUrl, setCurrentUrl] = useState(PWA_URL);

  const insets = useSafeAreaInsets();
  const { lastNotificationUrl } = usePushNotifications();
  const deepLinkUrl = useDeepLink();

  useEffect(() => {
    if (deepLinkUrl) {
      setCurrentUrl(deepLinkUrl);
    }
  }, [deepLinkUrl]);

  useEffect(() => {
    if (lastNotificationUrl) {
      setCurrentUrl(lastNotificationUrl);
    }
  }, [lastNotificationUrl]);

  useEffect(() => {
    if (Platform.OS === "android") {
      const backHandler = BackHandler.addEventListener(
        "hardwareBackPress",
        () => {
          if (canGoBack && webViewRef.current) {
            webViewRef.current.goBack();
            return true;
          }
          return false;
        }
      );
      return () => backHandler.remove();
    }
  }, [canGoBack]);

  const handleLoadStart = () => {
    setLoading(true);
    setProgress(0);
  };

  const handleLoadEnd = () => {
    setLoading(false);
  };

  const handleLoadProgress = ({
    nativeEvent,
  }: {
    nativeEvent: { progress: number };
  }) => {
    setProgress(nativeEvent.progress);
  };

  const handleNavigationStateChange = (state: WebViewNavigation) => {
    setCanGoBack(state.canGoBack);
  };

  const downloadFile = async (url: string) => {
    if (Platform.OS === "web") return false;

    try {
      const filename = url.split("/").pop()?.split("?")[0] || "download";
      const fileUri = `${FileSystem.documentDirectory}${filename}`;

      const downloadResumable = FileSystem.createDownloadResumable(
        url,
        fileUri,
        {},
        () => {}
      );

      const result = await downloadResumable.downloadAsync();
      if (result) {
        Alert.alert(
          "Download complete",
          `${filename} has been saved to your device.`
        );
      }
    } catch {
      Alert.alert("Download failed", "Could not download the file.");
    }
    return false;
  };

  const handleShouldStartLoadWithRequest = (
    request: ShouldStartLoadRequest
  ): boolean => {
    const url = request.url.toLowerCase();
    const isDownload = DOWNLOAD_EXTENSIONS.some((ext) => {
      const cleanUrl = url.split("?")[0];
      return cleanUrl.endsWith(ext);
    });

    if (isDownload && Platform.OS !== "web") {
      void downloadFile(request.url);
      return false;
    }

    return true;
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar style="light" backgroundColor="#0A0F1E" />
      <ProgressBar progress={progress} visible={loading} color="#3B82F6" />
      {Platform.OS !== "web" ? (
        <WebView
          ref={webViewRef}
          source={{ uri: currentUrl }}
          style={styles.webview}
          onLoadStart={handleLoadStart}
          onLoadEnd={handleLoadEnd}
          onLoadProgress={handleLoadProgress}
          onNavigationStateChange={handleNavigationStateChange}
          onShouldStartLoadWithRequest={handleShouldStartLoadWithRequest}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          allowFileAccess={true}
          allowFileAccessFromFileURLs={false}
          allowUniversalAccessFromFileURLs={false}
          geolocationEnabled={true}
          allowsInlineMediaPlayback={true}
          mediaPlaybackRequiresUserAction={false}
          mixedContentMode="compatibility"
          startInLoadingState={false}
          cacheEnabled={true}
          thirdPartyCookiesEnabled={true}
          sharedCookiesEnabled={true}
          userAgent="Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36 AiCtoApp/1.0"
        />
      ) : (
        <View style={styles.webFallback}>
          <View style={styles.webFallbackInner} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0A0F1E",
  },
  webview: {
    flex: 1,
    backgroundColor: "#0A0F1E",
  },
  webFallback: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  webFallbackInner: {
    width: "100%",
    flex: 1,
    backgroundColor: "#0A0F1E",
  },
});
