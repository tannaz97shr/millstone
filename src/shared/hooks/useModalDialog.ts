"use client";

import { useEffect, useRef } from "react";
import { focusableWithin } from "@/shared/utils/focusable";

export interface ModalDialogOptions {
  open: boolean;
  /** Called for Escape and a tap outside: the same as the cancel / keep button. */
  onClose: () => void;
}

/**
 * Shared behaviour of Sheet and Dialog, on a native <dialog> opened with
 * showModal(): the rest of the page is inert (not just aria-modal) and sits
 * under the top layer. On top of that this hook:
 * - moves focus to the title on open (or the first control if there's no title),
 * - wraps Tab and Shift+Tab inside the dialog,
 * - routes Escape and a tap on the backdrop to onClose,
 * - returns focus to whatever opened it on close.
 * Page scroll is locked in globals.css while a dialog[data-modal] is open.
 */
export function useModalDialog({ open, onClose }: ModalDialogOptions) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const openerRef = useRef<HTMLElement | null>(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog || !open) return;

    openerRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    if (!dialog.open) dialog.showModal();
    (titleRef.current ?? focusableWithin(dialog)[0] ?? dialog).focus();

    return () => {
      if (dialog.open) dialog.close();
      const opener = openerRef.current;
      if (opener?.isConnected) opener.focus();
      openerRef.current = null;
    };
  }, [open]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    // Escape: keep React in charge of the open state.
    const onCancel = (event: Event) => {
      event.preventDefault();
      onCloseRef.current();
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Tab") return;
      const stops = focusableWithin(dialog);
      if (stops.length === 0) {
        event.preventDefault();
        return;
      }
      const first = stops[0];
      const last = stops[stops.length - 1];
      const active = document.activeElement;
      const outside = !stops.includes(active as HTMLElement);
      if (event.shiftKey && (active === first || outside)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    };

    // The <dialog> fills the screen as the backdrop; its panel is a child.
    const onClick = (event: MouseEvent) => {
      if (event.target === dialog) onCloseRef.current();
    };

    dialog.addEventListener("cancel", onCancel);
    dialog.addEventListener("keydown", onKeyDown);
    dialog.addEventListener("click", onClick);
    return () => {
      dialog.removeEventListener("cancel", onCancel);
      dialog.removeEventListener("keydown", onKeyDown);
      dialog.removeEventListener("click", onClick);
    };
  }, []);

  return { dialogRef, titleRef };
}
