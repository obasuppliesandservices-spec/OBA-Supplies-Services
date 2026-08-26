import React, { useState, useEffect } from 'react';
import { database } from './firebase';
import { ref, onValue, set } from 'firebase/database';

export const useFirebaseSync = (path, initialState) => {
  const [state, setState] = useState(() => {
    // For jobOrders, try to load from cache first
    if (path === 'global/jobOrders') {
      try {
        const cached = localStorage.getItem('app_jobOrders_cache');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed;
          }
        }
      } catch (e) {
        console.error('Failed to load jobOrders cache:', e);
      }
    }
    return initialState;
  });
  const stateRef = React.useRef(state);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    const sessionRef = ref(database, path);
    const unsubscribe = onValue(sessionRef, snapshot => {
      const val = snapshot.val();
      if (val !== null) {
        let finalVal = val;
        if (typeof initialState === 'object' && initialState !== null && !Array.isArray(initialState)) {
          finalVal = { ...initialState, ...val };
          for (let key in initialState) {
            if (Array.isArray(initialState[key]) && !finalVal[key]) {
              finalVal[key] = [];
            } else if (typeof initialState[key] === 'object' && initialState[key] !== null && !finalVal[key]) {
              finalVal[key] = initialState[key];
            }
          }
        }
        // Handle array initial state fallback (Firebase deletes empty arrays)
        if (Array.isArray(initialState) && !Array.isArray(finalVal)) {
          // If firebase returned an object instead of array (e.g., indices as keys) or something else
          if (typeof finalVal === 'object') {
             finalVal = Object.values(finalVal);
          } else {
             finalVal = initialState;
          }
        }
        setState(finalVal);
        stateRef.current = finalVal;
      } else {
        setState(initialState);
        stateRef.current = initialState;
      }
    });
    return () => unsubscribe();
  }, [path]); // initialState should be stable

  const updateState = (updater) => {
    const nextState = typeof updater === 'function' ? updater(stateRef.current) : updater;
    setState(nextState);
    stateRef.current = nextState;
    set(ref(database, path), nextState === undefined ? null : nextState);
  };

  return [state, updateState];
};
