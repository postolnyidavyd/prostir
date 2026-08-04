import { useState } from 'react';
import styled from 'styled-components';

import FilterIcon from '../assets/icons/Filter.svg?react';
import SearchIcon from '../assets/icons/Lens_Minus.svg?react';
import WarningIcon from '../assets/icons/Triangle_Warning.svg?react';
import FilterDrawer from '../components/rooms/FilterDrawer';
import RoomCard from '../components/rooms/RoomCard';
import RoomCardSkeleton from '../components/rooms/RoomCardSkeleton';
import RoomsToolbar from '../components/rooms/RoomsToolbar';
import { useRoomFilters } from '../components/rooms/useRoomFilters';
import Button from '../components/ui/Button';
import EmptyState from '../components/ui/EmptyState';
import { freeWord, roomsWord } from '../lib/plural';
import { MAX_DURATION_MIN, SLOT_MIN, WORK_END_MIN, isSlotPast, slotLabel, slotToIso } from '../lib/time';
import {
  useGetRoomFilterOptionsQuery,
  useGetRoomsQuery,
  type RoomsQuery,
} from '../store/api/roomsApi';
import { text } from '../styles/typography';

const Wrap = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 1rem;
`;

const Title = styled.h1`
  ${text.h5};
  color: var(--primary-black);
`;

const Found = styled.p`
  ${text.small};
  color: var(--secondary-text);
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(12rem, 1fr));
  gap: 1rem;
`;

const SKELETON_COUNT = 5;
const FALLBACK_MAX_CAPACITY = 20;

function RoomsPage() {
  const { filters, update } = useRoomFilters();
  const { date, fromMin, toMin, onlyFree, floors: selectedFloors, minCapacity } = filters;
  const [drawerOpen, setDrawerOpen] = useState(false);

  // зміна початку тримає кінець межах 30 хв і 4 год та не пізніше 19
  const handleFromMin = (minutes: number) =>
    update((prev) => {
      const min = minutes + SLOT_MIN;
      const max = Math.min(WORK_END_MIN, minutes + MAX_DURATION_MIN);
      return { fromMin: minutes, toMin: Math.min(Math.max(prev.toMin, min), max) };
    });

  const shiftDay = (delta: number) =>
    update((prev) => {
      const next = new Date(prev.date);
      next.setDate(next.getDate() + delta);
      return { date: next };
    });

  const params: RoomsQuery = { from: slotToIso(date, fromMin), to: slotToIso(date, toMin) };
  if (onlyFree) params.onlyFree = true;
  if (selectedFloors.length > 0) params.floors = selectedFloors;
  if (minCapacity > 0) params.minCapacity = minCapacity;

  const { data: rooms = [], isFetching, isError, refetch } = useGetRoomsQuery(params);

  // опції фільтрів
  const { data: filterOptions } = useGetRoomFilterOptionsQuery();
  const floorOptions = filterOptions?.floors ?? [];
  const maxCapacity = filterOptions?.maxCapacity ?? FALLBACK_MAX_CAPACITY;


  const isInPast = isSlotPast(date, fromMin);

  const freeCount = isInPast ? 0 : rooms.filter((room) => room.available).length;
  const filterCount = selectedFloors.length + (minCapacity > 0 ? 1 : 0);

  let content;
  if (isError) {
    content = (
      <EmptyState
        tone="error"
        icon={<WarningIcon />}
        title="Не вдалося завантажити"
        description="Щось пішло не так. Перевір зʼєднання та спробуй ще раз."
      >
        <Button onClick={() => refetch()}>Спробувати ще раз</Button>
      </EmptyState>
    );
  } else if (isFetching) {
    content = (
      <Grid>
        {Array.from({ length: SKELETON_COUNT }).map((_, index) => (
          <RoomCardSkeleton key={index} />
        ))}
      </Grid>
    );
  } else if (onlyFree && (rooms.length === 0 || isInPast)) {
    content = (
      <EmptyState
        icon={<SearchIcon />}
        title={`На ${slotLabel(date, fromMin)}–${slotLabel(date, toMin)} вільних кімнат немає`}
        description="Усі кімнати зайняті в цей час. Спробуй інший час або зменш тривалість."
      >
        <Button variant="secondary" onClick={() => update({ onlyFree: false })}>
          Показати всі кімнати
        </Button>
      </EmptyState>
    );
  } else if (rooms.length === 0) {
    content = (
      <EmptyState
        icon={<FilterIcon />}
        title="Нічого не знайдено"
        description="За обраними фільтрами немає кімнат. Спробуй змінити критерії пошуку."
      >
        <Button variant="secondary" onClick={() => update({ floors: [], minCapacity: 0 })}>
          Скинути фільтри
        </Button>
      </EmptyState>
    );
  } else {
    content = (
      <Grid>
        {rooms.map((room) => (
          <RoomCard key={room.id} room={room} past={isInPast} />
        ))}
      </Grid>
    );
  }

  return (
    <Wrap>
      <Title>Бронювання</Title>
      <RoomsToolbar
        date={date}
        onDateChange={(next) => update({ date: next })}
        onPrevDay={() => shiftDay(-1)}
        onNextDay={() => shiftDay(1)}
        fromMin={fromMin}
        toMin={toMin}
        onFromMin={handleFromMin}
        onToMin={(minutes) => update({ toMin: minutes })}
        onlyFree={onlyFree}
        onOnlyFree={(value) => update({ onlyFree: value })}
        onMoreFilters={() => setDrawerOpen(true)}
        filterCount={filterCount}
      />
      {!isFetching && !isError && rooms.length > 0 && (
        <Found>
          Знайдено {rooms.length} {roomsWord(rooms.length)} · {freeCount} {freeWord(freeCount)} на{' '}
          {slotLabel(date, fromMin)}–{slotLabel(date, toMin)}
        </Found>
      )}
      {content}
      <FilterDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        floors={floorOptions}
        selectedFloors={selectedFloors}
        minCapacity={minCapacity}
        maxCapacity={maxCapacity}
        onApply={(floors, capacity) => update({ floors, minCapacity: capacity })}
        onReset={() => update({ floors: [], minCapacity: 0 })}
      />
    </Wrap>
  );
}

export default RoomsPage;
