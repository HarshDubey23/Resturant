// For zero-cost self-hosted error monitoring, deploy GlitchTip (https://glitchtip.com)
// and set SENTRY_DSN to your GlitchTip project DSN. The Sentry SDK speaks the same protocol.
import * as Sentry from "@sentry/nextjs";

Sentry.init({
	dsn: process.env.SENTRY_DSN,
	tracesSampleRate: 0.1,
	replaysSessionSampleRate: 0.1,
	replaysOnErrorSampleRate: 1.0,
	enabled: process.env.NODE_ENV === "production",
});
