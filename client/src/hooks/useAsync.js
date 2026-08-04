import { useCallback, useEffect, useRef, useState } from 'react';

// Drives the four-state async lifecycle (loading / success / empty / error) for a
// single data source. Pages consume `status` and branch with early returns —
// they never re-derive loading/error/empty from raw booleans themselves.
//
//   const { status, data, error, retry } = useAsync(
//     () => api.get('/doctor/prescriptions'),
//     { deps: [], isEmpty: (rows) => rows.length === 0 },
//   );
//
// `deps` re-runs the fetch when it changes (same semantics as useEffect deps).
// `isEmpty(data)` decides success vs. empty; omit it if the page has no concept
// of an empty result. Race conditions from overlapping retries are guarded via
// an attempt counter, and updates after unmount are suppressed.
export function useAsync(fetcher, { deps = [], isEmpty } = {}) {
  const [state, setState] = useState({ status: 'loading', data: null, error: null });
  const aliveRef = useRef(true);
  const attemptRef = useRef(0);
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;
  const isEmptyRef = useRef(isEmpty);
  isEmptyRef.current = isEmpty;

  const run = useCallback(() => {
    const attempt = ++attemptRef.current;
    setState({ status: 'loading', data: null, error: null });
    Promise.resolve()
      .then(() => fetcherRef.current())
      .then((data) => {
        if (!aliveRef.current || attempt !== attemptRef.current) return;
        const empty = isEmptyRef.current ? isEmptyRef.current(data) : false;
        setState({ status: empty ? 'empty' : 'success', data, error: null });
      })
      .catch((error) => {
        if (!aliveRef.current || attempt !== attemptRef.current) return;
        setState({ status: 'error', data: null, error });
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    aliveRef.current = true;
    run();
    return () => {
      aliveRef.current = false;
    };
  }, [run]);

  return { ...state, retry: run };
}
