import { describe, it, expect, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { AuthProvider, useAuth } from "./useAuth";

const { authCallbackRef } = vi.hoisted(() => {
  const authCallbackRef: { current: ((event: string, session: unknown) => void) | null } = { current: null };
  return { authCallbackRef };
});

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      onAuthStateChange: (cb: (event: string, session: unknown) => void) => {
        authCallbackRef.current = cb;
        return { data: { subscription: { unsubscribe: () => {} } } };
      },
      getSession: () => Promise.resolve({ data: { session: null } }),
    },
  },
}));

function makeUser(id: string, email: string) {
  return { id, email, aud: "authenticated", app_metadata: {}, user_metadata: {}, created_at: "" };
}

describe("useAuth - user reference stability", () => {
  // Supabase hands back a fresh `user` object on every auth event, including
  // a silent TOKEN_REFRESHED when a tab regains focus. Screens that key a
  // data-reload effect on the whole `user` object (e.g. useEditorState) must
  // not see a new reference for a refresh of the same logged-in user, or
  // they re-fetch and overwrite whatever the user was mid-editing.
  it("keeps the same user reference across an auth event for the same id/email", async () => {
    const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider });

    // Flush the mount effect's getSession().then(...) (resolves to a null
    // session in this mock) before firing auth events, so it doesn't land
    // afterwards and stomp the SIGNED_IN user back to null.
    await act(async () => {
      await Promise.resolve();
    });

    await act(async () => {
      authCallbackRef.current?.("SIGNED_IN", { user: makeUser("user-1", "a@b.com") });
    });
    const firstUser = result.current.user;
    expect(firstUser).toEqual(makeUser("user-1", "a@b.com"));

    await act(async () => {
      authCallbackRef.current?.("TOKEN_REFRESHED", { user: makeUser("user-1", "a@b.com") });
    });

    expect(result.current.user).toBe(firstUser);
  });

  it("still updates the user reference when the identity actually changes", async () => {
    const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider });

    await act(async () => {
      await Promise.resolve();
    });

    await act(async () => {
      authCallbackRef.current?.("SIGNED_IN", { user: makeUser("user-1", "a@b.com") });
    });
    const firstUser = result.current.user;

    await act(async () => {
      authCallbackRef.current?.("SIGNED_IN", { user: makeUser("user-2", "c@d.com") });
    });

    expect(result.current.user).not.toBe(firstUser);
    expect(result.current.user?.id).toBe("user-2");

    await act(async () => {
      authCallbackRef.current?.("SIGNED_OUT", null);
    });
    expect(result.current.user).toBeNull();
  });
});
