import { useState } from 'react';
import styled from 'styled-components';

import ExitIcon from '../../assets/icons/Exit.svg?react';
import { toast } from '../../lib/toast';
import { useLogoutMutation } from '../../store/api/authApi';
import Button from '../ui/Button';
import ConfirmDialog from '../ui/ConfirmDialog';
import SectionCard from './SectionCard';

const Row = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
`;

const Info = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.1875rem;
`;

const Label = styled.span`
  font-family: 'e-UkraineHead', sans-serif;
  font-weight: 400;
  font-size: 0.9375rem;
  line-height: 1.40625rem;
  color: var(--primary-black);
`;

const Sub = styled.span`
  font-family: 'e-Ukraine', sans-serif;
  font-weight: 300;
  font-size: 0.8125rem;
  line-height: 1.21875rem;
  color: var(--secondary-text);
`;

function SessionCard() {
  const [open, setOpen] = useState(false);
  const [logout, { isLoading }] = useLogoutMutation();

  const confirm = async () => {
    try {
      await logout().unwrap();
      // редірект на /login зробить RequireAuth
    } catch {
      toast.error('Не вдалося вийти', 'Спробуй ще раз.');
      setOpen(false);
    }
  };

  return (
    <SectionCard title="Сеанс">
      <Row>
        <Info>
          <Label>Вийти з акаунта</Label>
          <Sub>Завершити поточний сеанс на всіх пристроях</Sub>
        </Info>
        <Button variant="dangerSoft" size="sm" onClick={() => setOpen(true)}>
          Вийти
        </Button>
      </Row>

      <ConfirmDialog
        open={open}
        onClose={() => setOpen(false)}
        onConfirm={confirm}
        icon={<ExitIcon />}
        title="Вийти з акаунту?"
        description="Поточний сеанс на всіх пристроях завершиться. Наступного разу доведеться увійти знову."
        confirmLabel="Вийти"
        cancelLabel="Скасувати"
        loading={isLoading}
      />
    </SectionCard>
  );
}

export default SessionCard;
