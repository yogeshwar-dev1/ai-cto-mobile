import { GoogleSignin, statusCodes } from "@react-native-google-signin/google-signin";
import { useEffect, useState } from "react";

const SUPABASE_URL = "https://ictasxeevrlvjkawuuvm.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImljdGFzeGVldnJsdmprYXd1dXZtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY2ODY5MjIsImV4cCI6MjA5MjI2MjkyMn0.3E2wxnBMfu5fiK6KdxIl-sp6h5grNwdaQLd29HHgNfc";
const WEB_CLIENT_ID = "899155507655-if0b394va8n7rmvg121fgnbpc0ioiqg8.apps.googleusercontent.com";

export type GoogleAuthResult = {
  user: { name: string; email: string; id: string } | null;
  error: string | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
};

GoogleSignin.configure({
  webClientId: WEB_CLIENT_ID,
  offlineAccess: true,
});

export function useGoogleAuth(): GoogleAuthResult {
  const [user, setUser] = useState<{ name: string; email: string; id: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function signInWithGoogle() {
    setLoading(true);
    setError(null);
    try {
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();
      const idToken = userInfo.data?.idToken;
      if (!idToken) throw new Error("No ID token received");

      // Exchange token with Supabase
      const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=id_token`, {
        method: "POST",
        headers: {
          "apikey": SUPABASE_KEY,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          provider: "google",
          id_token: idToken
        })
      });

      const data = await res.json();
      if (data.access_token) {
        const userData = {
          name: data.user?.user_metadata?.full_name || data.user?.email?.split("@")[0],
          email: data.user?.email,
          id: data.user?.id
        };
        setUser(userData);
      } else {
        setError(data.error_description || "Sign-in failed");
      }
    } catch (e: any) {
      if (e.code === statusCodes.SIGN_IN_CANCELLED) {
        setError("Sign-in cancelled");
      } else if (e.code === statusCodes.IN_PROGRESS) {
        setError("Sign-in already in progress");
      } else if (e.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        setError("Google Play Services not available");
      } else {
        setError(e.message || "Google sign-in failed");
      }
    } finally {
      setLoading(false);
    }
  }

  return { user, error, loading, signInWithGoogle };
}