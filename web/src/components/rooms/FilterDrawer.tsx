import { useEffect, useState } from 'react';
import styled from 'styled-components';

import CloseIcon from '../../assets/icons/Close_SM.svg?react';
import { peopleWord } from '../../lib/plural';
import { SLOT_MIN, WORK_START_MIN } from '../../lib/time';
import { text } from '../../styles/typography';
import Button from '../ui/Button';
import Sheet from '../ui/Sheet';
import Stepper from '../ui/Stepper';
import WhenFields from './WhenFields';
import { Hint, Section, SectionHead, SectionTitle } from './filterPrimitives';
import { clampToMin } from './timeOptions';
import type { RoomFilters } from './useRoomFilters';

const Top = styled.div`
  flex: 1;
  min-height: 0;
  overflow-y: auto;
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

type PrimaryFilters = {
  date: Date;
  fromMin: number;
  toMin: number;
  onlyFree: boolean;
};

type FilterDrawerProps = {
  open: boolean;
  onClose: () => void;
  floors: number[];
  selectedFloors: number[];
  minCapacity: number;
  maxCapacity: number;
  onApply: (patch: Partial<RoomFilters>) => void;
  onReset: () => void;
  // якщо задано — то мобілка показуємо ще дату, час і тогл тільки вільні
  primary?: PrimaryFilters;
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
  primary,
}: FilterDrawerProps) {
  const [draftFloors, setDraftFloors] = useState<number[]>(selectedFloors);
  const [draftCapacity, setDraftCapacity] = useState(minCapacity);
  const [draftDate, setDraftDate] = useState(() => primary?.date ?? new Date());
  const [draftFrom, setDraftFrom] = useState(primary?.fromMin ?? WORK_START_MIN);
  const [draftTo, setDraftTo] = useState(primary?.toMin ?? WORK_START_MIN + SLOT_MIN);
  const [draftOnlyFree, setDraftOnlyFree] = useState(primary?.onlyFree ?? false);

  // синхронізуємо чернетку з застосованими фільтрами при відкритті
  useEffect(() => {
    if (!open) return;
    setDraftFloors(selectedFloors);
    setDraftCapacity(minCapacity);
    if (primary) {
      setDraftDate(primary.date);
      setDraftFrom(primary.fromMin);
      setDraftTo(primary.toMin);
      setDraftOnlyFree(primary.onlyFree);
    }
  }, [open, selectedFloors, minCapacity, primary]);

  const toggleFloor = (floor: number) =>
    setDraftFloors((prev) =>
      prev.includes(floor) ? prev.filter((f) => f !== floor) : [...prev, floor],
    );

  // зміна початку тягне кінець у валідний діапазон
  const handleFrom = (minutes: number) => {
    setDraftFrom(minutes);
    setDraftTo((prev) => clampToMin(minutes, prev));
  };

  const handleApply = () => {
    const patch: Partial<RoomFilters> = { floors: draftFloors, minCapacity: draftCapacity };
    if (primary) {
      patch.date = draftDate;
      patch.fromMin = draftFrom;
      patch.toMin = draftTo;
      patch.onlyFree = draftOnlyFree;
    }
    onApply(patch);
    onClose();
  };

  return (
    <Sheet open={open} onClose={onClose} label="Фільтри" gap="2rem">
      <Top>
        <Header>
          <HeaderTitle>Фільтри</HeaderTitle>
          <CloseButton type="button" onClick={onClose} aria-label="Закрити">
            <CloseIcon />
          </CloseButton>
        </Header>

        {primary && (
          <WhenFields
            date={draftDate}
            onDate={setDraftDate}
            fromMin={draftFrom}
            toMin={draftTo}
            onFrom={handleFrom}
            onTo={setDraftTo}
            onlyFree={draftOnlyFree}
            onOnlyFree={setDraftOnlyFree}
          />
        )}

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
        <Button size="sm" fullWidth onClick={handleApply}>
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
    </Sheet>
  );
}

export default FilterDrawer;
