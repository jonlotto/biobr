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
  const stableToastApi = { toast: () => {} };
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
        thumbnailUrl: null,
        linkType: "button",
        style: "filled",
        isActive: true,
        buttonBgColor: null,
        buttonTextColor: null,
        buttonBorderRadius: "rounded-xl",
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
});
