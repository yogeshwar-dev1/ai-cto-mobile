import * as FileSystem from "expo-file-system";
import { StatusBar } from "expo-status-bar";
import { useEffect, useRef, useState } from "react";
import {
  Alert,
  BackHandler,
  Platform,
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { WebView } from "react-native-webview";
import type { WebViewNavigation } from "react-native-webview";
import type { ShouldStartLoadRequest } from "react-native-webview/lib/WebViewTypes";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ProgressBar } from "@/components/ProgressBar";
import { useDeepLink } from "@/hooks/useDeepLink";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { useGoogleAuth } from "@/hooks/useGoogleAuth";

const PWA_URL = "https://ai-cto.onrender.com/pwa.html";

const DOWNLOAD_EXTENSIONS = [
  ".pdf", ".doc", ".docx", ".xls", ".xlsx",
  ".zip", ".csv", ".ppt", ".pptx", ".apk", ".mp4", ".mp3",
];

export default function WebViewScreen() {
  const webViewRef = useRef<WebView>(null);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [canGoBack, setCanGoBack] = useState(false);
  const [currentUrl, setCurrentUrl] = useState(PWA_URL);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  const insets = useSafeAreaInsets();
  const { lastNotificationUrl } = usePushNotifications();
  const deepLinkUrl = useDeepLink();
  const { user, error, loading: googleLoading, signInWithGoogle } = useGoogleAuth();

  // Check if already logged in
  useEffect(() => {
    // Give WebView time to check localStorage
    setTimeout(() => setCheckingAuth(false), 1000);
  }, []);

  // When Google auth succeeds, inject user into WebView
  useEffect(() => {
    if (user) {
      setIsLoggedIn(true);
      const userJson = JSON.stringify(user);
      const script = `
        localStorage.setItem('aicto_user', '${userJson}');
        window.location.href = '${PWA_URL}';
        true;
      `;
      webViewRef.current?.injectJavaScript(script);
    }
  }, [user]);

  useEffect(() => {
    if (deepLinkUrl) setCurrentUrl(deepLinkUrl);
  }, [deepLinkUrl]);

  useEffect(() => {
    if (lastNotificationUrl) setCurrentUrl(lastNotificationUrl);
  }, [lastNotificationUrl]);

  useEffect(() => {
    if (Platform.OS === "android") {
      const backHandler = BackHandler.addEventListener("hardwareBackPress", () => {
        if (canGoBack && webViewRef.current) {
          webViewRef.current.goBack();
          return true;
        }
        return false;
      });
      return () => backHandler.remove();
    }
  }, [canGoBack]);

  const handleLoadStart = () => { setLoading(true); setProgress(0); };
  const handleLoadEnd = () => setLoading(false);
  const handleLoadProgress = ({ nativeEvent }: { nativeEvent: { progress: number } }) => {
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
      const downloadResumable = FileSystem.createDownloadResumable(url, fileUri, {}, () => {});
      const result = await downloadResumable.downloadAsync();
      if (result) Alert.alert("Download complete", `${filename} has been saved.`);
    } catch {
      Alert.alert("Download failed", "Could not download the file.");
    }
    return false;
  };

  const handleShouldStartLoadWithRequest = (request: ShouldStartLoadRequest): boolean => {
    const url = request.url.toLowerCase();
    const isDownload = DOWNLOAD_EXTENSIONS.some(ext => url.split("?")[0].endsWith(ext));
    if (isDownload && Platform.OS !== "web") {
      void downloadFile(request.url);
      return false;
    }
    return true;
  };

  // Handle messages from WebView (logout etc)
  const handleMessage = (event: any) => {
    try {
      const msg = JSON.parse(event.nativeEvent.data);
      if (msg.type === "logout") setIsLoggedIn(false);
    } catch {}
  };

  if (checkingAuth || googleLoading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#4ade80" />
        <Text style={styles.loadingText}>Loading AI CTO...</Text>
      </View>
    );
  }

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
          onMessage={handleMessage}
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
  container: { flex: 1, backgroundColor: "#0A0F1E" },
  center: { alignItems: "center", justifyContent: "center" },
  webview: { flex: 1, backgroundColor: "#0A0F1E" },
  webFallback: { flex: 1, alignItems: "center", justifyContent: "center" },
  webFallbackInner: { width: "100%", flex: 1, backgroundColor: "#0A0F1E" },
  loadingText: { color: "#888", marginTop: 12, fontSize: 14 },
});