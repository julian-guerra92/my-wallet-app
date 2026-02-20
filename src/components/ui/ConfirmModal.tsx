"use client";

import { useEffect } from "react";

interface ConfirmModalProps {
  id: string;
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmVariant?: "btn-error" | "btn-primary" | "btn-warning";
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmModal({
  id,
  isOpen,
  title,
  message,
  confirmLabel = "Aceptar",
  cancelLabel = "Cancelar",
  confirmVariant = "btn-error",
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  useEffect(() => {
    const modal = document.getElementById(id) as HTMLDialogElement | null;
    if (!modal) return;
    if (isOpen) {
      modal.showModal();
    } else {
      modal.close();
    }
  }, [isOpen, id]);

  return (
    <dialog id={id} className="modal modal-center sm:modal-middle">
      <div className="modal-box bg-base-200 border border-white/10">
        <h3 className="font-bold text-lg">{title}</h3>
        <p className="py-4 text-sm text-base-content/70">{message}</p>
        <div className="modal-action gap-2">
          <button className="btn btn-ghost" onClick={onCancel}>
            {cancelLabel}
          </button>
          <button className={`btn ${confirmVariant}`} onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </div>
      <form method="dialog" className="modal-backdrop">
        <button onClick={onCancel}>close</button>
      </form>
    </dialog>
  );
}
