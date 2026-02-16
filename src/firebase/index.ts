
'use client';

// This file serves as a barrel file for easy imports.
// NO LOGIC should be here.

export * from './provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './firestore/use-doc-once';
export * from './errors';
export * from './error-emitter';

// This helper is used across many components. It must be stable.
import { useMemo, type DependencyList } from 'react';

export function useMemoFirebase<T>(factory: () => T, deps: DependencyList): T {
    // The __memo flag was part of a check that caused circular dependencies.
    // Removing the flag and the check, relying on standard useMemo.
    return useMemo(factory, deps);
}
