import * as Sentry from '@sentry/nextjs'

const sentryDsn = process.env.NEXT_PUBLIC_SENTRY_DSN

if (sentryDsn) {
  Sentry.init({
    dsn: sentryDsn,
    tracesSampleRate: 0.1,
    enabled: process.env.NODE_ENV === 'production',
    environment: process.env.NODE_ENV,
    sendDefaultPii: false,
  })
}
