import React, { PropsWithChildren, useCallback, useEffect, useRef, useState } from 'react';
import tw from 'twin.macro';

const ModalDialog: React.FC<{ open: boolean; onClose: () => void } & PropsWithChildren> = ({
  open,
  onClose: onCloseFunc,
  children,
}) => {
  const ref = useRef<HTMLDialogElement>(null);

  const [isLocalOpen, setIsLocalOpen] = useState(false);
  useEffect(() => {
    if (!isLocalOpen) setIsLocalOpen(open);

    if (isLocalOpen) {
      setTimeout(() => {
        setIsLocalOpen(open);
      }, 150);
    }
  }, [open]);

  const onClose = useCallback(() => {
    ref.current?.close();
    onCloseFunc();
  }, [onCloseFunc, ref]);

  useEffect(() => {
    if (ref.current) {
      if (isLocalOpen) {
        if (!ref.current.open) {
          ref.current.showModal();
        }
      } else {
        ref.current.close();
      }
    }

    // Make sure when `ESC` (browser default) is clicked, we close the dialog
    if (isLocalOpen) {
      const refNode = ref.current;
      refNode?.addEventListener('close', onClose);
      return () => {
        refNode?.removeEventListener('close', onClose);
      };
    }
  }, [onClose, isLocalOpen]);

  if (!isLocalOpen) return null;
  return (
    <dialog
      role="dialog"
      aria-modal="true"
      css={[
        tw`inset-0 h-screen w-screen flex items-end sm:items-center justify-center bg-black/25 backdrop-blur-sm cursor-auto z-50 p-0 m-0 overflow-hidden`,
        `max-width: 100vw; max-height: 100vh;`,
      ]}
      ref={ref}
    >
      {children}
    </dialog>
  );
};

export default ModalDialog;
