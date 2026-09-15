import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useEditorState } from "./useEditorState";

const { responseQueue, mockSupabase, stableAuth, stableToastApi } = vi.hoisted(() => {
  const responseQueue: Array<{ data?: unknown; error?: unknown }> = [];

  const makeBuilder = (): any => {
    const builder: any = {
      select: () => builder,
      eq: () => builder,
      order: () => builder,
      update: () => builder,
      delete: () => builder,
      insert: () => builder,
      not: () => builder,
      single: () => builder,
      maybeSingle: () => builder,
      then: (resolve: (v: unknown) => unknown, reject: (e: unknown) => unknown) => {
        const response = responseQueue.shift() ?? { data: null, error: null };
        return Promise.resolve(response).then(resolve, reject);
      },
    };
    return builder;
  };

  const mockSupabase = { from: () => makeBuilder() };
  // Stable references: useEditorState's load effect depends on `user` and
  // `toast`, so a mock that returns a fresh object/function on every call
  // would retrigger that effect every render and loop forever.
  const stableAuth = { user: { id: "user-1" } };
  const stableToastApi = { toast: vi.fn() };
  return { responseQueue, mockSupabase, stableAuth, stableToastApi };
});

vi.mock("@/integrations/supabase/client", () => ({
  supabase: mockSupabase,
}));

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => stableAuth,
}));

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => stableToastApi,
}));

describe("useEditorState - add link race with autosave", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    responseQueue.length = 0;
    stableToastApi.toast.mockClear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("keeps selectedLinkId pointed at the right link after autosave swaps its temp id for the real one, so a subsequent edit is not silently dropped", async () => {
    // Initial load: empty profile + no links.
    responseQueue.push({ data: { username: "test", handle: "test" }, error: null });
    responseQueue.push({ data: [], error: null });

    const { result } = renderHook(() => useEditorState());

    // Flush the initial load effect.
    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });
    expect(result.current.isLoading).toBe(false);

    // User clicks "Adicionar Link" — mirrors AdminLayout's handleAddLink.
    let newId = "";
    act(() => {
      newId = result.current.addLink({
        title: "Novo Link",
        url: "https://",
        icon: null,
        iconVariant: null,
        thumbnailUrl: null,
        linkType: "button",
        style: "filled",
        isActive: true,
        buttonBgColor: null,
        buttonTextColor: null,
        buttonBorderRadius: "rounded-xl",
        buttonKind: "link",
        whatsappCountryCode: null,
        whatsappPhone: null,
        whatsappMessage: null,
        cardsData: null,
      });
      result.current.setSelectedLinkId(newId);
    });

    expect(newId.startsWith("temp-")).toBe(true);
    expect(result.current.selectedLinkId).toBe(newId);

    // Queue the responses saveData will consume, in call order:
    // 1) profile update, 2) links delete (no existing real ids yet), 3) link insert.
    responseQueue.push({ error: null }); // profile update
    responseQueue.push({ error: null }); // links delete
    responseQueue.push({ data: { id: "real-link-id-1" }, error: null }); // link insert

    // Simulate the user taking longer than the debounce to fill the drawer
    // (this is exactly what happens in real usage — typing a title/URL takes
    // longer than 800ms), so autosave fires while the drawer is still open.
    await act(async () => {
      await vi.advanceTimersByTimeAsync(800);
    });

    // The temp id must have been swapped for the real one, AND selectedLinkId
    // must follow it — otherwise the drawer keeps "editing" an id that no
    // longer exists in `links`.
    expect(result.current.links[0].id).toBe("real-link-id-1");
    expect(result.current.selectedLinkId).toBe("real-link-id-1");

    // User now clicks "Salvar" in the drawer — mirrors handleSaveLink, which
    // always targets the *current* selectedLinkId.
    act(() => {
      result.current.updateLink(result.current.selectedLinkId as string, {
        title: "Meu Site Real",
        url: "https://meusite.com",
        icon: null,
        isActive: true,
        thumbnailUrl: null,
      });
    });

    const savedLink = result.current.links.find((l) => l.id === "real-link-id-1");
    expect(savedLink?.title).toBe("Meu Site Real");
    expect(savedLink?.url).toBe("https://meusite.com");
  });

  // Regression test for the "Site Oficial" bug: a link toggled active in the
  // admin preview never showed up on the public page. Root cause was that
  // persistToSupabase never checked the `error` half of supabase-js's
  // `{ data, error }` response - a failed insert/update was indistinguishable
  // from success, so isDirty got cleared and no error toast fired, even
  // though the database never actually received the write.
  it("keeps isDirty true and surfaces a toast when a link insert fails, instead of silently pretending it saved", async () => {
    responseQueue.push({ data: { username: "test", handle: "test" }, error: null });
    responseQueue.push({ data: [], error: null });

    const { result } = renderHook(() => useEditorState());

    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });
    expect(result.current.isLoading).toBe(false);

    act(() => {
      result.current.addLink({
        title: "Site Oficial",
        url: "https://example.com",
        icon: null,
        iconVariant: null,
        thumbnailUrl: "https://example.com/banner.jpg",
        linkType: "button",
        style: "filled",
        isActive: true,
        buttonBgColor: null,
        buttonTextColor: null,
        buttonBorderRadius: "rounded-xl",
        buttonKind: "link",
        whatsappCountryCode: null,
        whatsappPhone: null,
        whatsappMessage: null,
        cardsData: null,
      });
    });
    expect(result.current.isDirty).toBe(true);

    // Profile update and links-delete both succeed; the link insert itself
    // fails (e.g. an RLS/constraint rejection) - this is the case that used
    // to be swallowed silently.
    responseQueue.push({ error: null }); // profile update
    responseQueue.push({ error: null }); // links delete
    responseQueue.push({ data: null, error: { message: "insert rejected" } }); // link insert fails

    await act(async () => {
      await vi.advanceTimersByTimeAsync(800);
    });

    // Must NOT look saved: isDirty stays true (so a retry/save is still
    // pending) and the link never got a real id swapped in.
    expect(result.current.isDirty).toBe(true);
    expect(result.current.isSaving).toBe(false);
    expect(result.current.links[0].id.startsWith("temp-")).toBe(true);
    expect(stableToastApi.toast).toHaveBeenCalledWith(
      expect.objectContaining({ variant: "destructive" }),
    );
  });
});
