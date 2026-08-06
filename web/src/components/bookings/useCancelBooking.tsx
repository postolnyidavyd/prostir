import { useState, type ReactNode } from 'react';

import CalendarCloseIcon from '../../assets/icons/Calendar_Close.svg?react';
import { toast } from '../../lib/toast';
import { useCancelBookingMutation } from '../../store/api/bookingsApi';
import ConfirmDialog from '../ui/ConfirmDialog';

type CancelTarget = { id: string; roomId: string };

export function useCancelBooking(): {
  requestCancel: (target: CancelTarget) => void;
  dialog: ReactNode;
} {
  const [target, setTarget] = useState<CancelTarget | null>(null);
  const [cancelBooking, { isLoading }] = useCancelBookingMutation();

  const confirm = async () => {
    if (!target) return;
    try {
      await cancelBooking(target).unwrap();
      toast.success('Бронювання скасовано');
    } catch {
      toast.error('Не вдалося скасувати', 'Спробуй ще раз.');
    } finally {
      setTarget(null);
    }
  };

  const dialog = (
    <ConfirmDialog
      open={target !== null}
      onClose={() => setTarget(null)}
      onConfirm={confirm}
      icon={<CalendarCloseIcon />}
      title="Скасувати бронювання?"
      description="Слот звільниться і стане доступним іншим. Цю дію не можна відмінити."
      confirmLabel="Так, скасувати"
      cancelLabel="Назад"
      loading={isLoading}
    />
  );

  return { requestCancel: setTarget, dialog };
}
