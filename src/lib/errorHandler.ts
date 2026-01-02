/**
 * Centralized error handling utility to prevent information leakage.
 * Maps internal error messages to safe, user-friendly messages.
 */

export function getClientSafeError(error: Error | unknown): string {
  if (!(error instanceof Error)) {
    return 'An unexpected error occurred';
  }
  
  const message = error.message.toLowerCase();
  
  // Authentication-related errors
  if (message.includes('invalid login') || message.includes('invalid credentials')) {
    return 'Invalid email or password';
  }
  if (message.includes('already registered') || message.includes('already exists') || message.includes('duplicate')) {
    return 'This email is already registered. Please sign in.';
  }
  if (message.includes('rate limit') || message.includes('too many requests')) {
    return 'Too many attempts. Please try again later.';
  }
  if (message.includes('password') && message.includes('weak')) {
    return 'Please choose a stronger password';
  }
  if (message.includes('email') && (message.includes('invalid') || message.includes('format'))) {
    return 'Please enter a valid email address';
  }
  if (message.includes('not confirmed') || message.includes('email not verified')) {
    return 'Please verify your email address';
  }
  if (message.includes('session') || message.includes('expired') || message.includes('refresh')) {
    return 'Your session has expired. Please sign in again.';
  }
  
  // Network-related errors
  if (message.includes('network') || message.includes('fetch') || message.includes('connection') || message.includes('offline')) {
    return 'Network error. Please check your connection.';
  }
  if (message.includes('timeout')) {
    return 'Request timed out. Please try again.';
  }
  
  // Permission-related errors
  if (message.includes('permission') || message.includes('unauthorized') || message.includes('forbidden') || message.includes('access denied')) {
    return 'Access denied. Please check your permissions.';
  }
  
  // Generic fallback - never expose internal error messages
  return 'An error occurred. Please try again.';
}

/**
 * Logs errors for debugging (only in development)
 * In production, consider sending to error monitoring service
 */
export function logError(context: string, error: Error | unknown): void {
  if (import.meta.env.DEV) {
    console.error(`[${context}]`, error);
  }
  // In production, you could send to Sentry, LogRocket, etc.
}
