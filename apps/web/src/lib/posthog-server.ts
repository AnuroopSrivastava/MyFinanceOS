import { PostHog } from "posthog-node";

let posthogClient: PostHog | null = null;

export function getPostHogClient(): PostHog | null {
  const token = process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN;
  const host = process.env.NEXT_PUBLIC_POSTHOG_HOST;

  if (!token) {
    if (process.env.NODE_ENV !== "production") {
      console.error(
        "NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN variable required by PostHog is missing or un-configured, " +
          "this causes events to be silently missed. " +
          "This error stops appearing once NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN is configured"
      );
    }
    return null;
  }

  if (!posthogClient) {
    posthogClient = new PostHog(token, {
      host: host ?? "https://us.i.posthog.com",
      flushAt: 1,
      flushInterval: 0,
    });
  }
  return posthogClient;
}

// Security telemetry for the unauthenticated auth API. Uses a fixed anonymous
// distinctId — never raw emails or IPs (pass pre-hashed identifiers instead).
export function captureSecurityEvent(
  event: string,
  properties: Record<string, unknown> = {},
): Promise<void> {
  const ph = getPostHogClient();
  if (!ph) return Promise.resolve();
  ph.capture({ distinctId: "anonymous_auth_api", event, properties });
  return ph.flush();
}
