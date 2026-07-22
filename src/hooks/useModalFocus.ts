import { useLayoutEffect, useRef } from 'react';

export type ModalFocusRef = { readonly current: HTMLElement | null };

interface UseModalFocusOptions {
  initialFocusRef?: ModalFocusRef;
  returnFocusRef?: ModalFocusRef;
}

const focusableSelector = [
  'a[href]',
  'area[href]',
  'button:not(:disabled)',
  'input:not(:disabled):not([type="hidden"])',
  'select:not(:disabled)',
  'textarea:not(:disabled)',
  '[contenteditable="true"]',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

function getFocusableElements(container: HTMLElement) {
  return Array.from(container.querySelectorAll<HTMLElement>(focusableSelector)).filter((element) => {
    if (element.hidden || element.closest('[hidden], [aria-hidden="true"]')) return false;

    const styles = window.getComputedStyle(element);
    return styles.display !== 'none' && styles.visibility !== 'hidden';
  });
}

function isAvailableFocusTarget(element: HTMLElement | null): element is HTMLElement {
  if (!element || !element.isConnected || element.hasAttribute('disabled')) return false;

  const styles = window.getComputedStyle(element);
  return styles.display !== 'none' && styles.visibility !== 'hidden';
}

export default function useModalFocus<T extends HTMLElement = HTMLElement>({
  initialFocusRef,
  returnFocusRef,
}: UseModalFocusOptions = {}) {
  const dialogRef = useRef<T>(null);

  useLayoutEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return undefined;

    const activeElement = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const opener = returnFocusRef?.current ?? (dialog.contains(activeElement) ? null : activeElement);

    const initialFocusTarget = initialFocusRef?.current ?? getFocusableElements(dialog)[0] ?? null;
    initialFocusTarget?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return;

      const focusableElements = getFocusableElements(dialog);
      if (focusableElements.length === 0) {
        event.preventDefault();
        dialog.focus();
        return;
      }

      const eventTarget = event.target instanceof HTMLElement ? event.target : null;
      const active = eventTarget && dialog.contains(eventTarget)
        ? eventTarget
        : document.activeElement instanceof HTMLElement ? document.activeElement : null;
      const activeIndex = active ? focusableElements.indexOf(active) : -1;
      const first = focusableElements[0];
      const last = focusableElements[focusableElements.length - 1];

      if (activeIndex === -1) {
        event.preventDefault();
        (event.shiftKey ? last : first).focus();
      } else if (event.shiftKey && activeIndex === 0) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && activeIndex === focusableElements.length - 1) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);

      if (isAvailableFocusTarget(opener)) opener.focus();
    };
  }, [initialFocusRef, returnFocusRef]);

  return dialogRef;
}
