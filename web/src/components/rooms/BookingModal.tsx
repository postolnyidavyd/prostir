import { useMemo, useState } from 'react';
import styled from 'styled-components';

import AddIcon from '../../assets/icons/Add_Plus.svg?react';
import ClockIcon from '../../assets/icons/Clock.svg?react';
import CloseIcon from '../../assets/icons/Close_SM.svg?react';
import StairsIcon from '../../assets/icons/stairs.svg?react';
import UserIcon from '../../assets/icons/User_03.svg?react';
import WarningIcon from '../../assets/icons/Triangle_Warning.svg?react';
import {
  MAX_DURATION_MIN,
  SLOT_MIN,
  formatDayShort,
  formatDuration,
  kyivMinutesToUtc,
  slotLabel,
} from '../../lib/time';
import { useCreateBookingMutation } from '../../store/api/bookingsApi';
import type { Room } from '../../store/api/roomsApi';
import { text } from '../../styles/typography';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Modal from '../ui/Modal';
import Popover from '../ui/Popover';

export type BookingDraft = {
  day: Date;
  startMin: number;
  endMin: number;
  // найпізніший вільний кінець від startMin
  maxEndMin: number;
};

const Card = styled.div`
  width: min(28.3125rem, calc(100vw - 3rem));
  display: flex;
  flex-direction: column;
  gap: 2rem;
  padding: 2rem;
  background-color: var(--base-white);
  border: 2px solid var(--base-bright-grey);
  border-radius: 1.25rem;
  box-shadow: var(--shadow);
`;

const Head = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const Title = styled.h2`
  ${text.h6};
  color: var(--primary-black);
`;

const CloseButton = styled.button`
  display: inline-flex;
  padding: 0;
  border: none;
  background: none;
  color: var(--primary-black);
  cursor: pointer;

  svg {
    width: 1.5rem;
    height: 1.5rem;
  }
`;

const RoomChip = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  padding: 0.625rem;
  background-color: var(--accent-color);
  border: 2px solid var(--base-bright-grey);
  border-radius: 0.625rem;
`;

const RoomName = styled.span`
  ${text.h8};
  color: var(--primary-black);
`;

const RoomMeta = styled.div`
  display: flex;
  align-items: center;
  gap: 0.25rem;
`;

const Stat = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 0.125rem;
  ${text.tiny};
  color: var(--secondary-text);

  svg {
    width: 1rem;
    height: 1rem;
  }
`;

const Group = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const TwoCol = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
`;


const PickerSlot = styled.div`
  & > * {
    width: 100%;
  }
`;

const Field = styled.button<{ $open: boolean }>`
  position: relative;
  width: 100%;
  height: 56px;
  padding: 0 1rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  text-align: left;
  background-color: var(--base-white);
  border: 1.5px solid
    ${({ $open }) => ($open ? 'var(--accent-color-intense)' : 'var(--base-bright-grey)')};
  border-radius: 14px;
  cursor: pointer;
  transition: border-color 0.2s ease;

  &:hover {
    border-color: var(--accent-color-intense);
  }

  svg {
    width: 1.125rem;
    height: 1.125rem;
    color: var(--secondary-text);
    flex-shrink: 0;
  }
`;

const FieldLabel = styled.span`
  position: absolute;
  top: 0;
  left: 0.75rem;
  transform: translateY(-50%);
  padding: 0 0.25rem;
  background-color: var(--base-white);
  font-size: 12px;
  letter-spacing: -0.24px;
  color: var(--grey-100);
`;

const FieldValue = styled.span`
  font-size: 16px;
  letter-spacing: -0.32px;
  color: var(--primary-black);
`;

const Options = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.25rem;
  width: 13.5rem;
  padding: 0.625rem;
`;

const Slot = styled.button<{ $on: boolean }>`
  padding: 0.5625rem 0;
  border: none;
  border-radius: 0.5rem;
  ${text.small};
  color: ${({ $on }) => ($on ? 'var(--base-white)' : 'var(--primary-black)')};
  background-color: ${({ $on }) => ($on ? 'var(--base-black)' : 'transparent')};
  cursor: pointer;
  transition: background-color 0.15s ease;

  &:hover {
    background-color: ${({ $on }) => ($on ? 'var(--base-black)' : 'var(--primary-grey)')};
  }
`;

const Hint = styled.p`
  padding: 0.25rem 0.5rem;
  border-radius: 0.125rem;
  background-color: var(--gorse-40);
  ${text.tiny};
  color: var(--primary-black);
`;

const Banner = styled.p`
  padding: 0.5rem 0.625rem;
  border-radius: 0.5rem;
  background-color: var(--brick-red-20);
  ${text.small};
  color: var(--brick-red-100);
`;

const Actions = styled.div`
  display: grid;
  grid-template-columns: 1.5fr 2fr;
  gap: 0.25rem;
`;

// помітний стан 409 — слот перехопили поки заповнювали форму
const IconBox = styled.div`
  align-self: center;
  width: 5rem;
  height: 5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 1.5rem;
  background-color: var(--brick-red-20);
  color: var(--brick-red-100);

  svg {
    width: 2.333rem;
    height: 2.333rem;
  }
`;

const ConflictText = styled.p`
  ${text.body};
  color: var(--secondary-text);
  text-align: center;
`;

type ApiError = {
  status?: number | string;
  data?: { message?: string; errors?: Record<string, string[]> };
};

type BookingModalProps = {
  draft: BookingDraft;
  room: Room | undefined;
  onClose: () => void;
  onCreated: () => void;
  // 409 слот зайняли поки заповнювали
  onConflict: () => void;
};

function BookingModal({ draft, room, onClose, onCreated, onConflict }: BookingModalProps) {
  const { day, startMin } = draft;
  const [endMin, setEndMin] = useState(draft.endMin);
  const [name, setName] = useState('');
  const [nameError, setNameError] = useState<string | undefined>();
  const [banner, setBanner] = useState<string | undefined>();
  // 409 показуємо на всю модалку, щоб користувач не пропустив
  const [conflict, setConflict] = useState(false);

  const [createBooking, { isLoading }] = useCreateBookingMutation();

  const endOptions = useMemo(() => {
    const hi = Math.min(draft.maxEndMin, startMin + MAX_DURATION_MIN);
    const list: number[] = [];
    for (let m = startMin + SLOT_MIN; m <= hi; m += SLOT_MIN) list.push(m);
    return list;
  }, [startMin, draft.maxEndMin]);

  const submit = async () => {
    const title = name.trim();
    if (title.length < 1) {
      setNameError('Введи назву зустрічі');
      return;
    }
    if (title.length > 100) {
      setNameError('Назва не може бути довшою за 100 символів');
      return;
    }
    setBanner(undefined);
    try {
      await createBooking({
        roomId: room?.id ?? '',
        title,
        startsAt: kyivMinutesToUtc(day, startMin).toISOString(),
        endsAt: kyivMinutesToUtc(day, endMin).toISOString(),
      }).unwrap();
      onCreated();
    } catch (err) {
      const { status, data } = err as ApiError;
      if (status === 409) {
        setConflict(true);
        return;
      }
      if (status === 400 && data?.errors?.title?.[0]) {
        setNameError(data.errors.title[0]);
        return;
      }
      setBanner(data?.message ?? 'Не вдалося забронювати. Спробуй ще раз.');
    }
  };

  if (conflict) {
    return (
      <Modal open onClose={onConflict} label="Час зайнято">
        <Card>
          <Head>
            <Title>Цей час щойно зайняли</Title>
            <CloseButton type="button" onClick={onConflict} aria-label="Закрити">
              <CloseIcon />
            </CloseButton>
          </Head>
          <IconBox>
            <WarningIcon />
          </IconBox>
          <ConflictText>
            Поки ви заповнювали форму, хтось забронював цей слот. Розклад уже оновлено — оберіть інший
            вільний час.
          </ConflictText>
          <Button fullWidth onClick={onConflict}>
            Обрати інший час
          </Button>
        </Card>
      </Modal>
    );
  }

  return (
    <Modal open onClose={onClose} label="Нове бронювання">
      <Card>
        <Head>
          <Title>Нове бронювання</Title>
          <CloseButton type="button" onClick={onClose} aria-label="Закрити">
            <CloseIcon />
          </CloseButton>
        </Head>

        {room && (
          <RoomChip>
            <RoomName>{room.name}</RoomName>
            <RoomMeta>
              <Stat>
                {room.capacity}
                <UserIcon />
              </Stat>
              <Stat>
                {room.floor}
                <StairsIcon />
              </Stat>
            </RoomMeta>
          </RoomChip>
        )}

        <Input
          label="Назва зустрічі"
          value={name}
          maxLength={100}
          error={nameError}
          onChange={(event) => {
            setName(event.target.value);
            if (nameError) setNameError(undefined);
          }}
        />

        <Group>
          <TwoCol>
            <Input label="Дата" value={formatDayShort(day)} readOnly disabled />
            <PickerSlot>
              <Popover
                renderTrigger={(toggle, open) => (
                  <Field type="button" $open={open} onClick={toggle}>
                    <FieldLabel>Час</FieldLabel>
                    <FieldValue>
                      {slotLabel(day, startMin)} – {slotLabel(day, endMin)}
                    </FieldValue>
                    <ClockIcon />
                  </Field>
                )}
              >
                {(close) => (
                  <Options>
                    {endOptions.map((value) => (
                      <Slot
                        key={value}
                        type="button"
                        $on={value === endMin}
                        onClick={() => {
                          setEndMin(value);
                          close();
                        }}
                      >
                        {slotLabel(day, value)}
                      </Slot>
                    ))}
                  </Options>
                )}
              </Popover>
            </PickerSlot>
          </TwoCol>

          <Hint>Тривалість: {formatDuration(endMin - startMin)}</Hint>
        </Group>

        {banner && <Banner>{banner}</Banner>}

        <Actions>
          <Button variant="secondary" fullWidth onClick={onClose}>
            Скасувати
          </Button>
          <Button fullWidth isLoading={isLoading} onClick={submit}>
            <AddIcon width={24} height={24} />
            Забронювати
          </Button>
        </Actions>
      </Card>
    </Modal>
  );
}

export default BookingModal;
