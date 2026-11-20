/**
 * Modul demo: aplicatia merge fara backend, cu date tinute in browser.
 * Pornit la build cu VITE_DEMO=1 (github pages) sau local cu ?demo in url.
 */
export const DEMO =
  import.meta.env.VITE_DEMO === '1' ||
  (typeof location !== 'undefined' && new URLSearchParams(location.search).has('demo'));
