import { useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import styled, { keyframes } from 'styled-components';

const fade = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

const pop = keyframes`
  from { opacity: 0; transform: scale(0.96); }
  to { opacity: 1; transform: none; }
`;

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 200;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
  background-color: rgba(13, 13, 13, 0.42);
  backdrop-filter: blur(3px);
  animation: ${fade} 0.16s ease;
`;

const Content = styled.div`
  max-width: 100%;
  max-height: 90dvh;
  overflow-y: auto;
  animation: ${pop} 0.18s cubic-bezier(0.4, 0, 0.2, 1);
`;

type ModalProps = {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  label?: string;
};

function Modal({ open, onClose, children, label }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    // блокуємо скрол сторінки поки модалка відкрита
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <Overlay onClick={onClose}>
      <Content
        role="dialog"
        aria-modal="true"
        aria-label={label}
        onClick={(event) => event.stopPropagation()}
      >
        {children}
      </Content>
    </Overlay>,
    document.body,
  );
}

export default Modal;
