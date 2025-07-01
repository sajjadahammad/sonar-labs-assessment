export const isIOS = (): boolean => {
    if (typeof window === 'undefined') return false;
    const userAgent = navigator.userAgent || navigator.platform || '';
    const platform = navigator.platform || '';
    return (
      /iPhone|iPad|iPod/i.test(userAgent) ||
      /iPhone|iPad|iPod/i.test(platform) ||
      // Detect iOS in WebView or PWA
      (/Macintosh/i.test(userAgent) && !!navigator.maxTouchPoints && navigator.maxTouchPoints > 2)
    );
  };