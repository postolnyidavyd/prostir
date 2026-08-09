import { useState, type ReactNode } from 'react';

import CalendarCloseIcon from '../../assets/icons/Calendar_Close.svg?react';
import { bookingsWord } from '../../lib/plural';
import { formatTime, weeklyAdverb } from '../../lib/time';
import { toast } from '../../lib/toast';
import {
  useCancelBookingMutation,
  useCancelSeriesMutation,
  useLazyGetMySeriesQuery,
} from '../../store/api/bookingsApi';
import ConfirmDialog from '../ui/ConfirmDialog';
import SeriesCancelDialog, { type CancelScope } from './SeriesCancelDialog';

// скасувати одне бронювання або всю серію одразу
type Target =
  | { mode: 'one'; id: string; roomId: string; seriesId: string | null }
  | { mode: 'series'; seriesId: string; roomId: string };

type OneInput = { id: string; roomId: string; seriesId?: string | null };
type SeriesInput = { seriesId: string; roomId: string };

const capitalize = (value: string) => value.charAt(0).toUpperCase() + value.slice(1);

export function useCancelBooking(): {
  requestCancel: (target: OneInput) => void;
  requestCancelSeries: (target: SeriesInput) => void;
  dialog: ReactNode;
} {
  const [target, setTarget] = useState<Target | null>(null);
  const [cancelBooking, { isLoading }] = useCancelBookingMutation();
  const [cancelSeries, { isLoading: seriesLoading }] = useCancelSeriesMutation();
  // назву, час, кількість серії для модалки тягнемо ліниво
  const [fetchSeries, { data: seriesList }] = useLazyGetMySeriesQuery();

  const close = () => setTarget(null);

  const cancelOne = async () => {
    if (target?.mode !== 'one') return;
    try {
      await cancelBooking({ id: target.id, roomId: target.roomId }).unwrap();
      toast.success('Бронювання скасовано');
    } catch {
      toast.error('Не вдалося скасувати', 'Спробуй ще раз.');
    } finally {
      close();
    }
  };

  const cancelWholeSeries = async () => {
    if (!target || target.seriesId === null) return;
    try {
      const { canceled } = await cancelSeries({
        seriesId: target.seriesId,
        roomId: target.roomId,
      }).unwrap();
      toast.success('Серію скасовано', `Знято ${canceled} ${bookingsWord(canceled)}`);
    } catch {
      toast.error('Не вдалося скасувати серію', 'Спробуй ще раз.');
    } finally {
      close();
    }
  };

  const series =
    target?.seriesId != null
      ? seriesList?.find((item) => item.seriesId === target.seriesId)
      : undefined;

  const seriesSchedule = series
    ? `"${series.title}" - ${capitalize(weeklyAdverb(new Date(series.startsAt)))}, ${formatTime(series.startsAt)}–${formatTime(series.endsAt)}`
    : undefined;

  let dialog: ReactNode = null;
  if (target?.mode === 'series') {
    dialog = (
      <ConfirmDialog
        open
        onClose={close}
        onConfirm={cancelWholeSeries}
        icon={<CalendarCloseIcon />}
        title="Скасувати серію?"
        description="Усі майбутні повторення цієї серії буде скасовано. Цю дію не можна відмінити."
        confirmLabel="Так, скасувати серію"
        loading={seriesLoading}
      />
    );
  } else if (target?.mode === 'one' && target.seriesId !== null) {
    dialog = (
      <SeriesCancelDialog
        open
        onClose={close}
        onConfirm={(scope: CancelScope) => (scope === 'one' ? cancelOne() : cancelWholeSeries())}
        icon={<CalendarCloseIcon />}
        description={seriesSchedule}
        upcomingCount={series?.upcomingCount}
        loading={isLoading || seriesLoading}
      />
    );
  } else if (target?.mode === 'one') {
    dialog = (
      <ConfirmDialog
        open
        onClose={close}
        onConfirm={cancelOne}
        icon={<CalendarCloseIcon />}
        title="Скасувати бронювання?"
        description="Слот звільниться і стане доступним іншим. Цю дію не можна відмінити."
        confirmLabel="Так, скасувати"
        loading={isLoading}
      />
    );
  }

  return {
    requestCancel: ({ id, roomId, seriesId }) => {
      if (seriesId) fetchSeries(undefined, true);
      setTarget({ mode: 'one', id, roomId, seriesId: seriesId ?? null });
    },
    requestCancelSeries: (input) => setTarget({ mode: 'series', ...input }),
    dialog,
  };
}
