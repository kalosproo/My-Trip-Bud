import { afterEach, expect, it, vi } from "vitest";
const methods = vi.hoisted(() => ({ popup: vi.fn(), redirect: vi.fn() }));
vi.mock("firebase/auth", () => ({
  getAuth: () => ({}), GoogleAuthProvider: class {},
  signInWithPopup: methods.popup, signInWithRedirect: methods.redirect,
  getRedirectResult: vi.fn(), signOut: vi.fn(), onAuthStateChanged: vi.fn(),
}));
import { signInWithGoogle } from "../src/lib/firebase";
afterEach(() => vi.clearAllMocks());
it("falls back to redirect when the browser blocks the popup", async () => {
  methods.popup.mockRejectedValueOnce({ code: "auth/popup-blocked" });
  methods.redirect.mockResolvedValueOnce(undefined);
  await signInWithGoogle();
  expect(methods.redirect).toHaveBeenCalledOnce();
});
it("does not redirect a user who deliberately closes the popup", async () => {
  methods.popup.mockRejectedValueOnce({ code: "auth/popup-closed-by-user" });
  await expect(signInWithGoogle()).rejects.toEqual({ code: "auth/popup-closed-by-user" });
  expect(methods.redirect).not.toHaveBeenCalled();
});
