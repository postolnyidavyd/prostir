import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import styled from 'styled-components';

const Wrap = styled.div`
  position: relative;
  display: inline-flex;
`;

const Panel = styled.div`
  position: fixed;
  z-index: 300;
  background-color: var(--base-white);
  border: 1px solid var(--base-bright-grey);
  border-radius: 1rem;
  box-shadow: 0 0.5rem 1.5rem rgba(0, 0, 0, 0.12);
`;

type PopoverProps = {
  renderTrigger: (toggle: () => void, open: boolean) => ReactNode;
  children: (close: () => void) => ReactNode;
};
//Спільний поповер у порталі
function Popover({ renderTrigger, children }: PopoverProps) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const wrapRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!open) return;

    const updatePosition = () => {
      if (!wrapRef.current) return;
      const rect = wrapRef.current.getBoundingClientRect();
      setPos({ top: rect.bottom + 6, left: rect.left });
    };

    updatePosition();

    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);
    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (wrapRef.current?.contains(target) || panelRef.current?.contains(target)) return;
      setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };

    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  const close = () => setOpen(false);

  return (
    <Wrap ref={wrapRef}>
      {renderTrigger(() => setOpen((prev) => !prev), open)}
      {open &&
        createPortal(
          <Panel ref={panelRef} style={{ top: pos.top, left: pos.left }}>
            {children(close)}
          </Panel>,
          document.body,
        )}
    </Wrap>
  );
}

export default Popover;
