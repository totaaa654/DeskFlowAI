import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from "react";
import type { Session } from "@supabase/supabase-js";
import { consumeAuthCallback, type CallbackKind } from "@/lib/auth-callback";
import { authRedirectUrl, isSupabaseConfigured, requireSupabase, supabase } from "@/lib/supabase";
import type { AuthActionResult, Profile } from "@/types/auth";

interface AuthContextValue {
  configured: boolean;
  loading: boolean;
  session: Session | null;
  profile: Profile | null;
  profileError: string | null;
  callbackKind: CallbackKind | null;
  callbackError: string | null;
  signIn: (email: string, password: string) => Promise<AuthActionResult>;
  signOut: () => Promise<AuthActionResult>;
  sendPasswordReset: (email: string) => Promise<AuthActionResult>;
  setNewPassword: (password: string, fullName?: string) => Promise<AuthActionResult>;
  refreshProfile: () => Promise<void>;
  clearCallbackState: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);
const AUTH_FLOW_STORAGE_KEY = "deskflow-ai-auth-flow";

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Something went wrong. Please try again.";
}

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(isSupabaseConfigured);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [callbackKind, setCallbackKind] = useState<CallbackKind | null>(null);
  const [callbackError, setCallbackError] = useState<string | null>(null);

  const loadProfile = useCallback(async (userId: string) => {
    const client = requireSupabase();
    setProfileError(null);
    const { data, error } = await client
      .from("profiles")
      .select("id,email,full_name,role,status,department,created_at,updated_at,last_sign_in_at")
      .eq("id", userId)
      .maybeSingle();

    if (error) {
      setProfile(null);
      setProfileError(error.message);
      return;
    }
    if (!data) {
      setProfile(null);
      setProfileError("Your account profile is not ready. Contact an administrator.");
      return;
    }
    setProfile(data as Profile);
  }, []);

  const refreshProfile = useCallback(async () => {
    if (session?.user.id) await loadProfile(session.user.id);
  }, [loadProfile, session?.user.id]);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    let active = true;
    void supabase.auth.getSession().then(({ data, error }) => {
      if (!active) return;
      if (error) setProfileError(error.message);
      setSession(data.session);
      if (data.session) {
        void loadProfile(data.session.user.id).finally(() => active && setLoading(false));
      } else {
        setLoading(false);
      }
    });

    const { data } = supabase.auth.onAuthStateChange((event, nextSession) => {
      if (!active) return;
      setSession(nextSession);
      if (event === "PASSWORD_RECOVERY") setCallbackKind("recovery");
      if (nextSession) {
        window.setTimeout(() => void loadProfile(nextSession.user.id), 0);
      } else {
        setProfile(null);
        setProfileError(null);
      }
    });

    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, [loadProfile]);

  useEffect(() => {
    if (!supabase || !("__TAURI_INTERNALS__" in window)) return;

    let disposed = false;
    let unlisten: (() => void) | undefined;

    const handleUrls = async (urls: string[]) => {
      const rawUrl = urls.find((url) => url.startsWith("deskflowai://auth/callback"));
      if (!rawUrl || disposed) return;
      try {
        setCallbackError(null);
        setLoading(true);
        const kind = await consumeAuthCallback(requireSupabase(), rawUrl);
        const { data: callbackSession, error: sessionError } = await requireSupabase().auth.getSession();
        if (sessionError) throw sessionError;
        if (!callbackSession.session) throw new Error("The invitation session could not be created. Request a new invitation.");
        setSession(callbackSession.session);
        await loadProfile(callbackSession.session.user.id);
        const storedFlow = localStorage.getItem(AUTH_FLOW_STORAGE_KEY);
        const resolvedKind = kind === "authentication" && storedFlow === "recovery" ? "recovery" : kind;
        localStorage.removeItem(AUTH_FLOW_STORAGE_KEY);
        if (!disposed) setCallbackKind(resolvedKind);
      } catch (error) {
        if (!disposed) setCallbackError(errorMessage(error));
      } finally {
        if (!disposed) setLoading(false);
      }
    };

    void import("@tauri-apps/plugin-deep-link").then(async ({ getCurrent, onOpenUrl }) => {
      const initialUrls = await getCurrent();
      if (initialUrls) await handleUrls(initialUrls);
      unlisten = await onOpenUrl((urls) => void handleUrls(urls));
    });

    return () => {
      disposed = true;
      unlisten?.();
    };
  }, [loadProfile]);

  const value = useMemo<AuthContextValue>(
    () => ({
      configured: isSupabaseConfigured,
      loading,
      session,
      profile,
      profileError,
      callbackKind,
      callbackError,
      signIn: async (email, password) => {
        try {
          const { error } = await requireSupabase().auth.signInWithPassword({
            email: email.trim().toLowerCase(),
            password,
          });
          return { error: error?.message ?? null };
        } catch (error) {
          return { error: errorMessage(error) };
        }
      },
      signOut: async () => {
        try {
          const { error } = await requireSupabase().auth.signOut({ scope: "global" });
          return { error: error?.message ?? null };
        } catch (error) {
          return { error: errorMessage(error) };
        }
      },
      sendPasswordReset: async (email) => {
        try {
          localStorage.setItem(AUTH_FLOW_STORAGE_KEY, "recovery");
          const { error } = await requireSupabase().auth.resetPasswordForEmail(
            email.trim().toLowerCase(),
            { redirectTo: authRedirectUrl },
          );
          if (error) localStorage.removeItem(AUTH_FLOW_STORAGE_KEY);
          return { error: error?.message ?? null };
        } catch (error) {
          localStorage.removeItem(AUTH_FLOW_STORAGE_KEY);
          return { error: errorMessage(error) };
        }
      },
      setNewPassword: async (password, fullName) => {
        try {
          const client = requireSupabase();
          const { error: passwordError } = await client.auth.updateUser({
            password,
            ...(fullName ? { data: { full_name: fullName.trim() } } : {}),
          });
          if (passwordError) return { error: passwordError.message };

          if (fullName && session?.user.id) {
            const { error: nameError } = await client
              .from("profiles")
              .update({ full_name: fullName.trim() })
              .eq("id", session.user.id);
            if (nameError) return { error: nameError.message };
          }

          if (profile?.status === "invited") {
            const { data: activated, error: activationError } = await client.rpc("activate_my_invitation");
            if (activationError) return { error: activationError.message };
            if (!activated) return { error: "This invitation could not be activated. Request a new invitation from an administrator." };
          }

          if (session?.user.id) await loadProfile(session.user.id);
          setCallbackKind(null);
          return { error: null };
        } catch (error) {
          return { error: errorMessage(error) };
        }
      },
      refreshProfile,
      clearCallbackState: () => {
        setCallbackKind(null);
        setCallbackError(null);
      },
    }),
    [
      callbackError,
      callbackKind,
      loadProfile,
      loading,
      profile,
      profileError,
      refreshProfile,
      session,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}
