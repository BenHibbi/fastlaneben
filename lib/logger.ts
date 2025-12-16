// ============================================================================
// STRUCTURED LOGGING UTILITY
// ============================================================================

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LogContext {
  [key: string]: unknown
}

interface LogEntry {
  level: LogLevel
  message: string
  context?: LogContext
  timestamp: string
  service: string
}

function formatLog(entry: LogEntry): string {
  const { level, message, context, timestamp, service } = entry
  const contextStr = context ? ` ${JSON.stringify(context)}` : ''
  return `[${timestamp}] [${level.toUpperCase()}] [${service}] ${message}${contextStr}`
}

function log(service: string, level: LogLevel, message: string, context?: LogContext) {
  const entry: LogEntry = {
    level,
    message,
    context,
    timestamp: new Date().toISOString(),
    service
  }

  const formatted = formatLog(entry)

  switch (level) {
    case 'debug':
      if (process.env.NODE_ENV === 'development') {
        console.debug(formatted)
      }
      break
    case 'info':
      console.info(formatted)
      break
    case 'warn':
      console.warn(formatted)
      break
    case 'error':
      console.error(formatted)
      break
  }

  // In production, you could send to external logging service here
  // e.g., Datadog, LogRocket, Sentry
}

export function createLogger(service: string) {
  return {
    debug: (message: string, context?: LogContext) => log(service, 'debug', message, context),
    info: (message: string, context?: LogContext) => log(service, 'info', message, context),
    warn: (message: string, context?: LogContext) => log(service, 'warn', message, context),
    error: (message: string, context?: LogContext) => log(service, 'error', message, context)
  }
}

// Pre-configured loggers for common services
export const webhookLogger = createLogger('stripe-webhook')
export const emailLogger = createLogger('email')
export const voiceBriefLogger = createLogger('voice-brief')
export const previewLogger = createLogger('react-preview')
export const revisionLogger = createLogger('revisions')
