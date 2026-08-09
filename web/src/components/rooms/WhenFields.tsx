import { useMemo } from 'react';
import styled from 'styled-components';

import ArrowRightIcon from '../../assets/icons/Arrow_Right_MD.svg?react';
import Switch from '../ui/Switch';
import DatePicker from './DatePicker';
import TimePicker from './TimePicker';
import { Hint, Section, SectionHead, SectionTitle } from './filterPrimitives';
import { fromTimeOptions, toTimeOptions } from './timeOptions';

const TimeRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.625rem;
`;

const ToggleRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.625rem;
`;

type WhenFieldsProps = {
  date: Date;
  onDate: (date: Date) => void;
  fromMin: number;
  toMin: number;
  onFrom: (minutes: number) => void;
  onTo: (minutes: number) => void;
  onlyFree: boolean;
  onOnlyFree: (value: boolean) => void;
};

//винесено просто раді читаємості
function WhenFields({
  date,
  onDate,
  fromMin,
  toMin,
  onFrom,
  onTo,
  onlyFree,
  onOnlyFree,
}: WhenFieldsProps) {
  const fromOptions = useMemo(() => fromTimeOptions(date), [date]);
  const toOptions = useMemo(() => toTimeOptions(date, fromMin), [date, fromMin]);

  return (
    <>
      <Section>
        <SectionHead>
          <SectionTitle>Дата</SectionTitle>
          <Hint>На який день потрібна кімната</Hint>
        </SectionHead>
        <DatePicker date={date} onChange={onDate} />
      </Section>

      <Section>
        <SectionHead>
          <SectionTitle>Час</SectionTitle>
          <Hint>Проміжок, у який має бути вільно</Hint>
        </SectionHead>
        <TimeRow>
          <TimePicker value={fromMin} options={fromOptions} onChange={onFrom} />
          <ArrowRightIcon width={18} height={18} />
          <TimePicker value={toMin} options={toOptions} onChange={onTo} />
        </TimeRow>
      </Section>

      <Section>
        <ToggleRow>
          <Switch checked={onlyFree} onChange={onOnlyFree} aria-label="Тільки вільні" />
          <SectionTitle>Тільки вільні</SectionTitle>
        </ToggleRow>
      </Section>
    </>
  );
}

export default WhenFields;
