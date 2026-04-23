import * as AuthSession from "expo-auth-session";
import * as Crypto from "expo-crypto";
import { useEffect, useState } from "react";
import { Platform } from "react-native";

const SUPABASE_URL = "https://ictasxeevrlvjkawuuvm.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImljdGFzeGVldnJsdmprYXd1dXZtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY2ODY5MjIsImV4cCI6MjA5MjI2MjkyMn0.3E2wxnBMfu5fiK6KdxIl-sp6h5grNwdaQLd29HHgNfc";

export type GoogleAuthResult = {
  user: { name: string; email: string; id: string } | null;
  error: string | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
};

export function useGoogleAuth(): GoogleAuthResult {
  const [user, setUser] = useState<{ name: string; email: string; id: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const redirectUri = AuthSession.makeRedirectUri({ scheme: "aicto" });

  const discovery = {
    authorizationEndpoint: `${SUPABASE_URL}/auth/v1/authorize`,
  };

  const [request, response, promptAsync] = AuthSession.useAuthRequest(
    {
      clientId: SUPABASE_KEY,
      redirectUri,
      responseType: "token",
      scopes: ["openid", "email", "profile"],
      extraParams: {
        provider: "google",
      },
    },
    discovery
  );

  useEffect(() => {
    if (response?.type === "success") {
      const { access_token } = response.params;
      if (access_token) {
        fetchUser(access_token);
      }
    } else if (response?.type === "error") {
      setError("Google sign-in failed. Please try again.");
      setLoading(false);
    }
  }, [response]);

  async function fetchUser(accessToken: string) {
    try {
      setLoading(true);
      const res = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
        headers: {
          "apikey": SUPABASE_KEY,
          "Authorization": `Bearer ${accessToken}`
        }
      });
      const data = await res.json();
      if (data?.email) {
        const userData = {
          name: data.user_metadata?.full_name || data.user_metadata?.name || data.email.split("@")[0],
          email: data.email,
          id: data.id
        };
        setUser(userData);
        // Save to localStorage equivalent for WebView
        setError(null);
      } else {
        setError("Could not fetch user info.");
      }
    } catch (e) {
      setError("Network error during sign-in.");
    } finally {
      setLoading(false);
    }
  }

  async function signInWithGoogle() {
    setLoading(true);
    setError(null);
    await promptAsync();
  }

  return { user, error, loading, signInWithGoogle };
}