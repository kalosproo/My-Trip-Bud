// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { AuthProvider, useAuth } from "../src/components/AuthProvider";

const api = vi.hoisted(() => ({ watchAuth: vi.fn(), completeRedirectSignIn: vi.fn(), signInWithGoogle: vi.fn(), signOutUser: vi.fn() }));
vi.mock("@/lib/firebase", () => api);
afterEach(() => { cleanup(); vi.clearAllMocks(); });
function Controls() {
  const { loading, error, busy, signIn } = useAuth();
  return <><p>{loading ? "Loading" : "Ready"}</p><button disabled={busy} onClick={signIn}>Sign in</button>{error && <p role="alert">{error}</p>}</>;
}
describe("authentication feedback", () => {
  it("waits for auth, reports redirect errors and unsubscribes", async () => {
    const stop = vi.fn();
    api.watchAuth.mockReturnValue(stop);
    api.completeRedirectSignIn.mockRejectedValue({ code: "auth/operation-not-supported-in-this-environment" });
    const view = render(<AuthProvider><Controls /></AuthProvider>);
    expect(screen.getByText("Loading")).toBeInTheDocument();
    expect(await screen.findByRole("alert")).toHaveTextContent("Open in browser");
    view.unmount();
    expect(stop).toHaveBeenCalledOnce();
  });
  it("recovers the sign-in button after a popup failure", async () => {
    api.watchAuth.mockImplementation((callback) => { callback(null); return vi.fn(); });
    api.completeRedirectSignIn.mockResolvedValue(null);
    api.signInWithGoogle.mockRejectedValueOnce({ code: "auth/popup-closed-by-user" }).mockResolvedValueOnce(undefined);
    render(<AuthProvider><Controls /></AuthProvider>);
    fireEvent.click(screen.getByText("Sign in"));
    expect(await screen.findByRole("alert")).toHaveTextContent("Google sign-in couldn't finish");
    expect(screen.getByText("Sign in")).toBeEnabled();
    fireEvent.click(screen.getByText("Sign in"));
    await waitFor(() => expect(screen.queryByRole("alert")).not.toBeInTheDocument());
    expect(api.signInWithGoogle).toHaveBeenCalledTimes(2);
  });
});
