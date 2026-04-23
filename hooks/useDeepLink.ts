import * as Linking from "expo-linking";
import { useEffect, useState } from "react";

const BASE_DOMAIN = "ai-cto.onrender.com";
const CUSTOM_SCHEME = "aicto";

function extractWebUrl(url: string): string | null {
  try {
    const parsed = new URL(url);

    if (parsed.hostname === BASE_DOMAIN) {
      return url;
    }

    if (parsed.protocol === `${CUSTOM_SCHEME}:`) {
      const path = parsed.pathname || "/";
      const search = parsed.search || "";
      return `https://${BASE_DOMAIN}${path}${search}`;
    }
  } catch {
    // not a valid URL
  }
  return null;
}

export function useDeepLink(): string | null {
  const [deepLinkUrl, setDeepLinkUrl] = useState<string | null>(null);

  const initialUrl = Linking.useURL();

  useEffect(() => {
    if (!initialUrl) return;
    const webUrl = extractWebUrl(initialUrl);
    if (webUrl) {
      setDeepLinkUrl(webUrl);
    }
  }, [initialUrl]);

  useEffect(() => {
    const subscription = Linking.addEventListener("url", ({ url }) => {
      const webUrl = extractWebUrl(url);
      if (webUrl) {
        setDeepLinkUrl(webUrl);
      }
    });
    return () => subscription.remove();
  }, []);

  return deepLinkUrl;
}
