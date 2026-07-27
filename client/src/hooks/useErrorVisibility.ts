import type { RefObject } from "react";

type FocusableField = HTMLElement & { disabled?: boolean };

export function focusFirstField(
  refs: Array<RefObject<FocusableField | null>>
) {
  window.requestAnimationFrame(() => {
    const field = refs.find((ref) => {
      const element = ref.current;
      return element && !element.disabled;
    })?.current;

    field?.scrollIntoView({
      behavior: "smooth",
      block: "center",
      inline: "nearest",
    });
    field?.focus({ preventScroll: true });
  });
}
