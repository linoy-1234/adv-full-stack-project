import { useEffect, useRef, type RefObject } from "react";

type ErrorElement = HTMLElement;
type FocusableField = HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;

export function useErrorVisibility(error: string) {
  const errorRef = useRef<ErrorElement | null>(null);

  useEffect(() => {
    if (!error) return;

    const frame = window.requestAnimationFrame(() => {
      errorRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
        inline: "nearest",
      });
    });

    return () => window.cancelAnimationFrame(frame);
  }, [error]);

  return errorRef;
}

export function focusFirstField(
  refs: Array<RefObject<FocusableField | null>>
) {
  window.requestAnimationFrame(() => {
    const field = refs.find((ref) => {
      const element = ref.current;
      return element && !element.disabled;
    })?.current;

    field?.focus();
  });
}
