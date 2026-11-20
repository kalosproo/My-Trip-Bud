export function errorMessage(error: unknown): string {
  const code = (error as { code?: string })?.code;
  if (code === "permission-denied") return "You don't have access to this trip, or its permissions need updating.";
  if (code === "unavailable") return "Couldn't connect. Check your internet connection and try again.";
  if (code?.startsWith("auth/")) return "Google sign-in couldn't finish. Try again in your browser. If you're using WhatsApp or Instagram, choose Open in browser from its menu.";
  return error instanceof Error ? error.message : "Something went wrong. Please try again.";
}
