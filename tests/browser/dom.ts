export function requireTestElement<T extends Element>(selector: string): T {
  const element = document.querySelector<T>(selector);
  if (!element) throw new Error(`Test element is missing: ${selector}`);
  return element;
}

// lib.dom types contentWindow as Window, omitting the realm's global constructors.
// These fixtures only load the same-origin /dist/ document.
export function getTestFrameWindow(frame: HTMLIFrameElement): (Window & typeof globalThis) | null {
  return frame.contentWindow as (Window & typeof globalThis) | null;
}
