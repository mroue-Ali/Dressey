import { useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router';

/**
 * Goes back one page, or to `fallback` when the page was opened directly
 * (new tab, bookmark) and there is no earlier page in the app to return to.
 */
export function useGoBack(fallback = '/') {
  const navigate = useNavigate();
  return useCallback(() => {
    // React Router keeps the position in its own history stack in history.state.idx.
    const idx = (window.history.state as { idx?: number } | null)?.idx ?? 0;
    if (idx > 0) navigate(-1);
    else navigate(fallback, { replace: true });
  }, [navigate, fallback]);
}

export function usePageTitle(title: string | undefined) {
  useEffect(() => {
    document.title = title ? `${title} · Dresséy` : 'Dresséy';
  }, [title]);
}
