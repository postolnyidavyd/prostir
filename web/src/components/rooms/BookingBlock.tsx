import styled from 'styled-components';

import CloseIcon from '../../assets/icons/Close_SM.svg?react';

const Block = styled.div<{ $mine: boolean; $clickable: boolean }>`
  position: absolute;
  left: 0.375rem;
  right: 0.375rem;
  overflow: hidden;
  border-radius: 0.25rem;
  background-color: var(--grey-20);
  cursor: ${({ $clickable }) => ($clickable ? 'pointer' : 'default')};
`;

const Body = styled.div<{ $mine: boolean }>`
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
  height: 100%;
  padding: 0.25rem 0.5rem;
  border-left: ${({ $mine }) => ($mine ? '4px solid var(--base-black)' : 'none')};
`;

const Title = styled.span`
  font-family: 'e-Ukraine', sans-serif;
  font-weight: 300;
  font-size: 0.75rem;
  line-height: 1.125rem;
  color: var(--primary-black);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const Sub = styled.span`
  font-family: 'e-Ukraine', sans-serif;
  font-weight: 300;
  font-size: 0.625rem;
  line-height: 0.875rem;
  color: var(--secondary-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const CancelOverlay = styled.div`
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.25rem;
  border-radius: inherit;
  background-color: rgba(204, 46, 79, 0.8);
  color: var(--base-white);
  font-family: 'e-Ukraine', sans-serif;
  font-weight: 400;
  font-size: 0.625rem;
  line-height: 0.875rem;
  opacity: 0;
  transition: opacity 0.15s ease;

  svg {
    width: 1rem;
    height: 1rem;
  }

  ${Block}:hover & {
    opacity: 1;
  }
`;

type BookingBlockProps = {
  title: string;
  timeLabel: string;
  person: string;
  mine: boolean;
  top: number;
  height: number;
  onCancel?: () => void;
};

function BookingBlock({
  title,
  timeLabel,
  person,
  mine,
  top,
  height,
  onCancel,
}: BookingBlockProps) {
  const clickable = !!onCancel;
  return (
    <Block
      $mine={mine}
      $clickable={clickable}
      style={{ top: `calc(${top}rem + 0.25rem)`, height: `calc(${height}rem - 0.5rem)` }}
      onClick={onCancel}
      role={clickable ? 'button' : undefined}
      title={clickable ? 'Скасувати бронювання' : undefined}
    >
      <Body $mine={mine}>
        <Title>{title}</Title>
        <Sub>
          {timeLabel} · {person}
        </Sub>
      </Body>
      {clickable && (
        <CancelOverlay>
          <CloseIcon />
          Скасувати
        </CancelOverlay>
      )}
    </Block>
  );
}

export default BookingBlock;
