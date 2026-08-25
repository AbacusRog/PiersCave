import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";

// Tracks the current session + whether the signed-in user is an admin
// (present in admin_users). Used by ProtectedRoute and any screen that
// needs to gate a field (e.g. authentication_code) or action.
export function useAuth() {
  const [session, setSession] = useState(undefined); // undefined = loading
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, sess) => {
      setSession(sess);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session) {
      setIsAdmin(false);
      return;
    }
    supabase
      .from("admin_users")
      .select("user_id")
      .eq("user_id", session.user.id)
      .maybeSingle()
      .then(({ data }) => setIsAdmin(!!data));
  }, [session]);

  return { session, loading: session === undefined, isAdmin };
}
