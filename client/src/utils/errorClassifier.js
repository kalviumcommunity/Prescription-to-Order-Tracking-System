// Turns a thrown error (almost always an ApiError from api.js) into a
// presentation-agnostic description: what kind of failure this is, what to
// tell the user, and whether retrying makes sense. UI components decide how
// to render this; this module has no JSX and no knowledge of icons/copy tone
// beyond the message text itself.

export const ERROR_TYPES = {
  NETWORK: 'network',
  AUTH: 'auth',
  PERMISSION: 'permission',
  NOT_FOUND: 'notFound',
  SERVER: 'server',
  VALIDATION: 'validation',
  UNEXPECTED: 'unexpected',
};

export function classifyError(error) {
  const status = typeof error?.status === 'number' ? error.status : null;
  const code = error?.code;

  if (code === 'network_error' || status === 0) {
    return {
      type: ERROR_TYPES.NETWORK,
      title: "Can't reach the server",
      message: 'Check your internet connection and try again.',
      canRetry: true,
    };
  }

  if (status === 401) {
    return {
      type: ERROR_TYPES.AUTH,
      title: 'Your session has expired',
      message: 'Please log in again to continue.',
      canRetry: false,
    };
  }

  if (status === 403) {
    return {
      type: ERROR_TYPES.PERMISSION,
      title: "You don't have access to this",
      message: 'Your account does not have permission to view this page. Contact an administrator if you think this is a mistake.',
      canRetry: false,
    };
  }

  if (status === 404) {
    return {
      type: ERROR_TYPES.NOT_FOUND,
      title: 'Not found',
      message: "The thing you're looking for doesn't exist or was removed.",
      canRetry: false,
    };
  }

  if (status !== null && status >= 500) {
    return {
      type: ERROR_TYPES.SERVER,
      title: 'Service temporarily unavailable',
      message: 'Something went wrong on our end. This is usually temporary — try again in a moment.',
      canRetry: true,
    };
  }

  if (status === 400 || code === 'validation_error') {
    return {
      type: ERROR_TYPES.VALIDATION,
      title: 'That request was rejected',
      message: error?.message || 'Please check the information you provided and try again.',
      canRetry: false,
    };
  }

  if (code === 'unexpected_data') {
    return {
      type: ERROR_TYPES.UNEXPECTED,
      title: "Couldn't display this data",
      message: 'The server sent back something this page could not understand.',
      canRetry: true,
    };
  }

  return {
    type: ERROR_TYPES.UNEXPECTED,
    title: 'Something unexpected happened',
    message: error?.message || 'An unknown error occurred while loading this page.',
    canRetry: true,
  };
}
