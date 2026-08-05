import { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';

import { hoverMesh } from '../../styles/mesh';
import { text } from '../../styles/typography';

const Wrap = styled.div`
  position: fixed;
  right: 1.5rem;
  bottom: 1.5rem;
  z-index: 55;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.5rem;
`;

const Trigger = styled.button`
  align-self: flex-end;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.75rem 1rem;
  border: none;
  border-radius: 1.25rem;
  background-color: var(--base-black);
  color: var(--base-white);
  ${text.h8};
  cursor: pointer;
  box-shadow: var(--shadow);

  &:hover {
    ${hoverMesh};
  }
`;

const Panel = styled.div`
  width: 15rem;
  display: flex;
  flex-direction: column;
  gap: 0.6875rem;
  padding: 1.0625rem 1.1875rem;
  background-color: var(--base-white);
  border: 1px solid var(--base-bright-grey);
  border-radius: 1rem;
  box-shadow: 0 1.875rem 3.75rem -1.875rem rgba(13, 13, 13, 0.35);
`;

const Heading = styled.h3`
  font-family: 'e-Ukraine', sans-serif;
  font-weight: 400;
  font-size: 0.9rem;
  line-height: 1.35rem;
  letter-spacing: -0.288px;
  color: var(--primary-black);
`;

const Row = styled.div`
  display: flex;
  align-items: center;
  gap: 0.6875rem;
`;

const Label = styled.span`
  font-family: 'e-Ukraine', sans-serif;
  font-weight: 300;
  font-size: 0.8125rem;
  line-height: 1.2rem;
  color: var(--secondary-text);
`;

const Swatch = styled.span`
  flex-shrink: 0;
  width: 0.875rem;
  height: 0.875rem;
  border-radius: 0.25rem;
`;

const FreeSwatch = styled(Swatch)`
  background-color: var(--base-white);
  border: 1px solid var(--base-bright-grey);
`;

const BusySwatch = styled(Swatch)`
  background-color: var(--grey-20);
  border: 1px solid var(--base-bright-grey);
`;

const MineSwatch = styled(Swatch)`
  background-color: var(--grey-20);
  border-left: 2px solid var(--base-black);
`;

const PastSwatch = styled(Swatch)`
  background-color: var(--secondary-grey);
  background-image: repeating-linear-gradient(
    135deg,
    transparent 0,
    transparent 3px,
    rgba(13, 13, 13, 0.06) 3px,
    rgba(13, 13, 13, 0.06) 4px
  );
`;

const NowSwatch = styled.span`
  flex-shrink: 0;
  width: 0.875rem;
  height: 0.1875rem;
  border-radius: 0.125rem;
  background-color: var(--brick-red-100);
`;

const Divider = styled.hr`
  border: none;
  border-top: 1px solid var(--base-bright-grey);
  margin: 0.1875rem 0;
`;

const HowTitle = styled.p`
  ${text.h8};
  color: var(--primary-black);
`;

const HowText = styled.p`
  font-family: 'e-Ukraine', sans-serif;
  font-weight: 300;
  font-size: 0.8125rem;
  line-height: 1.2rem;
  color: var(--secondary-text);
`;

function GridLegend() {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      if (!wrapRef.current?.contains(event.target as Node)) setOpen(false);
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

  return (
    <Wrap ref={wrapRef}>
      {open && (
        <Panel role="dialog" aria-label="Позначення">
          <Heading>Позначення</Heading>
          <Row>
            <FreeSwatch />
            <Label>вільно — можна зайняти</Label>
          </Row>
          <Row>
            <BusySwatch />
            <Label>зайнято іншими</Label>
          </Row>
          <Row>
            <MineSwatch />
            <Label>ваше бронювання</Label>
          </Row>
          <Row>
            <PastSwatch />
            <Label>поза годинами / минуле</Label>
          </Row>
          <Row>
            <NowSwatch />
            <Label>зараз</Label>
          </Row>

          <Divider />

          <HowTitle>Як обрати час</HowTitle>
          <HowText>
            Натисни й потягни по вільних слотах у сітці, потім «Продовжити бронювання». Кінцевий час
            можна уточнити в модалці.
          </HowText>
        </Panel>
      )}
      <Trigger
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-label="Що означають позначення"
        aria-expanded={open}
      >
        ?
      </Trigger>
    </Wrap>
  );
}

export default GridLegend;
