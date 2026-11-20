import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../auth';

/** Incarca date de la api; reload() le reia (dupa o rezervare, anulare etc). */
export function useLoad<T>(fn: () => Promise<T>, deps: unknown[]) {
  const { guard } = useAuth();
  const [state, setState] = useState<{ data?: T; error?: string; loading: boolean }>({
    loading: true,
  });
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let alive = true;
    setState((s) => ({ data: s.data, loading: true }));
    guard(fn()).then(
      (data) => alive && setState({ data, loading: false }),
      (e: Error) => alive && setState({ error: e.message, loading: false }),
    );
    return () => {
      alive = false;
    };
  }, [...deps, tick]);

  const reload = useCallback(() => setTick((t) => t + 1), []);
  return { ...state, reload };
}
