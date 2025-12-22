
'use client';

import { useState, useEffect } from 'react';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

export function FirebaseErrorListener() {
  const [error, setError] = useState<FirestorePermissionError | null>(null);

  useEffect(() => {
    const handleError = (error: FirestorePermissionError) => {
      // Set the error in state. This will trigger a re-render.
      setError(error);
    };

    errorEmitter.on('permission-error', handleError);

    return () => {
      errorEmitter.off('permission-error', handleError);
    };
  }, []);

  // This effect will run *after* the render phase, once `error` state has been updated.
  // This is the correct place to throw an error to be caught by an error boundary.
  useEffect(() => {
    if (error) {
      throw error;
    }
  }, [error]);

  // The component itself renders nothing.
  return null;
}
