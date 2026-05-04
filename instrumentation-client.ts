import * as Sentry from '@sentry/nextjs'

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart

const sentryDsn = process.env.NEXT_PUBLIC_SENTRY_DSN

if (sentryDsn) {
  Sentry.init({
    dsn: sentryDsn,
    tracesSampleRate: 0.1,

    // Session replay remains disabled because VCX handles sensitive profile data.
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 0,

    enabled: process.env.NODE_ENV === 'production',
    environment: process.env.NODE_ENV,
    sendDefaultPii: false,
  })
}
