import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import styled from 'styled-components';

import ChevronLeftIcon from '../../assets/icons/Chevron_Left.svg?react';
import WarningIcon from '../../assets/icons/Triangle_Warning.svg?react';
import { toast } from '../../lib/toast';
import { useRoomChannel } from '../../lib/useRealtime';
import { addDays, kyivMinutesToUtc, startOfWeek, weekDays } from '../../lib/time';
import { useRoomFilters } from './useRoomFilters';
import { useGetRoomBookingsQuery } from '../../store/api/bookingsApi';
import { useGetRoomsQuery } from '../../store/api/roomsApi';
import { useAppSelector } from '../../store/hooks';
import { selectCurrentUser } from '../../store/authSlice';
import { text } from '../../styles/typography';
import Button from '../ui/Button';
import EmptyState from '../ui/EmptyState';
import { useCancelBooking } from '../bookings/useCancelBooking';
import BookingModal, { type BookingDraft } from './BookingModal';
import GridLegend from './GridLegend';
import RoomTabs from './RoomTabs';
import WeekGrid from './WeekGrid';
import WeekGridSkeleton from './WeekGridSkeleton';
import WeekNav from './WeekNav';

const Wrap = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 1rem;
`;

const BackLink = styled.button`
  align-self: flex-start;
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0;
  border: none;
  background: none;
  cursor: pointer;
  ${text.small};
  color: var(--secondary-text);

  svg {
    width: 1rem;
    height: 1rem;
  }

  &:hover {
    color: var(--primary-black);
  }
`;

const TopRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
`;

function toWeekParam(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

type RoomScheduleProps = {
  roomId: string;
};

function RoomSchedule({ roomId }: RoomScheduleProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentUser = useAppSelector(selectCurrentUser);

  // отримання дня початку тижня
  const weekParam = searchParams.get('week');
  const weekStart = useMemo(() => {
    const base = weekParam ? new Date(weekParam) : new Date();
    // Number.isNaN(base.getTime()) - перевірка чи валідна дата
    return startOfWeek(Number.isNaN(base.getTime()) ? new Date() : base);
  }, [weekParam]);

  // Створення списку днів для рендеру сітки
  const days = useMemo(() => weekDays(weekStart), [weekStart]);

  // час, заданий у фільтрах списку, щоб підсвітити його в сітці й прокрутити туди
  const { filters } = useRoomFilters();

  // хендлери
  const setWeek = (date: Date) =>
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('week', toWeekParam(startOfWeek(date)));
      return next;
    });

  const backToList = () =>
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.delete('room');
      next.delete('week');
      return next;
    });

  const selectRoom = (id: string) =>
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('room', id);
      return next;
    });

  // запит всіх кімат
  const { data: rooms = [], isLoading: roomsLoading } = useGetRoomsQuery({});
  const activeRoom = rooms.find((room) => room.id === roomId);

  // запит розклада
  const from = kyivMinutesToUtc(weekStart, 0).toISOString();
  const to = kyivMinutesToUtc(addDays(weekStart, 7), 0).toISOString();
  const {
    data: bookings = [],
    isLoading,
    isError,
    refetch,
  } = useGetRoomBookingsQuery({ roomId, from, to });

  // оновлення через вебсокет
  useRoomChannel(roomId, from, to);

  // чернетка бронювання
  const [draft, setDraft] = useState<BookingDraft | null>(null);
  // спосіб цього батьківскього компонента сказати сітці зняти вибір
  const [resetToken, setResetToken] = useState(0);

  const { requestCancel, dialog: cancelDialog } = useCancelBooking();

  let content;
  if (isError) {
    content = (
      <EmptyState
        tone="error"
        icon={<WarningIcon />}
        title="Не вдалося завантажити розклад"
        description="Щось пішло не так. Перевір зʼєднання та спробуй ще раз."
      >
        <Button onClick={() => refetch()}>Спробувати ще раз</Button>
      </EmptyState>
    );
  } else if (isLoading) {
    content = <WeekGridSkeleton />;
  } else {
    content = (
      <WeekGrid
        days={days}
        bookings={bookings}
        currentUserId={currentUser?.id}
        onCreate={setDraft}
        onCancel={(booking) => requestCancel({ id: booking.id, roomId })}
        highlightDay={filters.date}
        highlightFrom={filters.fromMin}
        highlightTo={filters.toMin}
        resetToken={resetToken}
      />
    );
  }

  return (
    <Wrap>
      <BackLink type="button" onClick={backToList}>
        <ChevronLeftIcon />
        Усі кімнати
      </BackLink>

      {!roomsLoading && rooms.length > 0 && (
        <RoomTabs rooms={rooms} activeId={roomId} onSelect={selectRoom} />
      )}

      <TopRow>
        <WeekNav
          weekStart={weekStart}
          onPrev={() => setWeek(addDays(weekStart, -7))}
          onNext={() => setWeek(addDays(weekStart, 7))}
          onThisWeek={() => setWeek(new Date())}
        />
      </TopRow>

      {content}

      {draft && (
        <BookingModal
          draft={draft}
          room={activeRoom}
          onClose={() => setDraft(null)}
          onCreated={() => {
            setDraft(null);
            setResetToken((token) => token + 1);
            toast.success('Бронювання створено');
          }}
          onConflict={() => {
            setDraft(null);
            setResetToken((token) => token + 1);
          }}
        />
      )}

      {cancelDialog}

      <GridLegend />
    </Wrap>
  );
}

export default RoomSchedule;
