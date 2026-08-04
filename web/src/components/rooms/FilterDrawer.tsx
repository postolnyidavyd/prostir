import { useEffect, useState } from 'react';
import styled, { keyframes } from 'styled-components';

import CloseIcon from '../../assets/icons/Close_SM.svg?react';
import { peopleWord } from '../../lib/plural';
import { text } from '../../styles/typography';
import Button from '../ui/Button';
import Stepper from '../ui/Stepper';

const fade = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

const slide = keyframes`
  from { transform: translateX(100%); }
  to { transform: none; }
`;

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 200;
  display: flex;
  justify-content: flex-end;
  background-color: rgba(13, 13, 13, 0.42);
  backdrop-filter: blur(3px);
  animation: ${fade} 0.16s ease;
`;

const Drawer = styled.div`
  width: min(24rem, 100%);
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 2rem;
  padding: 1.5rem;
  background-color: var(--base-white);
  box-shadow: var(--shadow);
  animation: ${slide} 0.24s cubic-bezier(0.4, 0, 0.2, 1);
`;

const Top = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2rem;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const HeaderTitle = styled.h2`
  ${text.h6};
  color: var(--primary-black);
`;

const CloseButton = styled.button`
  display: inline-flex;
  padding: 0;
  border: none;
  background: none;
  color: var(--secondary-text);
  cursor: pointer;

  svg {
    width: 1.5rem;
    height: 1.5rem;
  }

  &:hover {
    color: var(--primary-black);
  }
`;

const Section = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const SectionHead = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.625rem;
`;

const SectionTitle = styled.span`
  ${text.body};
  color: var(--primary-black);
`;

const Hint = styled.span`
  ${text.tiny};
  color: var(--secondary-text);
`;

const Chips = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
`;

const FloorChip = styled.button<{ $selected: boolean }>`
  padding: 0.375rem;
  border-radius: 0.625rem;
  ${text.small};
  color: var(--primary-black);
  cursor: pointer;
  background-color: ${({ $selected }) => ($selected ? 'var(--accent-color)' : 'var(--base-white)')};
  border: 1px solid
    ${({ $selected }) => ($selected ? 'var(--accent-color-border-hover)' : 'var(--grey-80)')};
  transition:
    background-color 0.15s ease,
    border-color 0.15s ease;

  &:hover {
    border-color: var(--accent-color-border-hover);
  }
`;

const Footer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.625rem;
`;

type FilterDrawerProps = {
  open: boolean;
  onClose: () => void;
  floors: number[];
  selectedFloors: number[];
  minCapacity: number;
  maxCapacity: number;
  onApply: (floors: number[], minCapacity: number) => void;
  onReset: () => void;
};

function FilterDrawer({
  open,
  onClose,
  floors,
  selectedFloors,
  minCapacity,
  maxCapacity,
  onApply,
  onReset,
}: FilterDrawerProps) {
  const [draftFloors, setDraftFloors] = useState<number[]>(selectedFloors);
  const [draftCapacity, setDraftCapacity] = useState(minCapacity);

  // синхронізуємо чернетку з застосованими фільтрами при відкритті
  useEffect(() => {
    if (open) {
      setDraftFloors(selectedFloors);
      setDraftCapacity(minCapacity);
    }
  }, [open, selectedFloors, minCapacity]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const toggleFloor = (floor: number) =>
    setDraftFloors((prev) =>
      prev.includes(floor) ? prev.filter((f) => f !== floor) : [...prev, floor],
    );

  return (
    <Overlay onClick={onClose}>
      <Drawer role="dialog" aria-modal="true" aria-label="Фільтри" onClick={(e) => e.stopPropagation()}>
        <Top>
          <Header>
            <HeaderTitle>Фільтри</HeaderTitle>
            <CloseButton type="button" onClick={onClose} aria-label="Закрити">
              <CloseIcon />
            </CloseButton>
          </Header>

          <Section>
            <SectionHead>
              <SectionTitle>Поверх</SectionTitle>
              <Hint>На якому поверсі потрібна кімната</Hint>
            </SectionHead>
            <Chips>
              {floors.map((floor) => (
                <FloorChip
                  key={floor}
                  type="button"
                  $selected={draftFloors.includes(floor)}
                  onClick={() => toggleFloor(floor)}
                >
                  {floor} поверх
                </FloorChip>
              ))}
            </Chips>
          </Section>

          <Section>
            <SectionHead>
              <SectionTitle>Місткість</SectionTitle>
              <Hint>На скільки людей потрібна кімната</Hint>
            </SectionHead>
            <Stepper
              value={draftCapacity}
              onChange={setDraftCapacity}
              min={0}
              max={maxCapacity}
              format={(value) => (value === 0 ? 'Будь-яка' : `${value} ${peopleWord(value)}`)}
            />
          </Section>
        </Top>

        <Footer>
          <Button
            size="sm"
            fullWidth
            onClick={() => {
              onApply(draftFloors, draftCapacity);
              onClose();
            }}
          >
            Показати кімнати
          </Button>
          <Button
            size="sm"
            variant="secondary"
            fullWidth
            onClick={() => {
              onReset();
              onClose();
            }}
          >
            Скинути
          </Button>
        </Footer>
      </Drawer>
    </Overlay>
  );
}

export default FilterDrawer;
