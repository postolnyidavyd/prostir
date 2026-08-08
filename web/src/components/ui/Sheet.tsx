import { useEffect, type ReactNode } from 'react';
import styled, { keyframes } from 'styled-components';

type Side = 'left' | 'right';

const fade = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

const slideRight = keyframes`
  from { transform: translateX(100%); }
  to { transform: none; }
`;

const slideLeft = keyframes`
  from { transform: translateX(-100%); }
  to { transform: none; }
`;

const Overlay = styled.div<{ $side: Side }>`
  position: fixed;
  inset: 0;
  z-index: 300;
  display: flex;
  justify-content: ${({ $side }) => ($side === 'right' ? 'flex-end' : 'flex-start')};
  background-color: rgba(13, 13, 13, 0.42);
  backdrop-filter: blur(3px);
  animation: ${fade} 0.16s ease;
`;

const Panel = styled.div<{
  $side: Side;
  $width: string;
  $background: string;
  $padding: string;
  $gap: string;
}>`
  width: ${({ $width }) => $width};
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: ${({ $gap }) => $gap};
  padding: ${({ $padding }) => $padding};
  background-color: ${({ $background }) => $background};
  box-shadow: var(--shadow);
  animation: ${({ $side }) => ($side === 'right' ? slideRight : slideLeft)} 0.24s
    cubic-bezier(0.4, 0, 0.2, 1);
`;

type SheetProps = {
  open: boolean;
  onClose: () => void;
  label: string;
  side?: Side;
  width?: string;
  background?: string;
  padding?: string;
  gap?: string;
  children: ReactNode;
};


function Sheet({
  open,
  onClose,
  label,
  side = 'right',
  width = 'min(24rem, 100%)',
  background = 'var(--base-white)',
  padding = '1.5rem',
  gap = '0',
  children,
}: SheetProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <Overlay $side={side} onClick={onClose}>
      <Panel
        $side={side}
        $width={width}
        $background={background}
        $padding={padding}
        $gap={gap}
        role="dialog"
        aria-modal="true"
        aria-label={label}
        onClick={(event) => event.stopPropagation()}
      >
        {children}
      </Panel>
    </Overlay>
  );
}

export default Sheet;
