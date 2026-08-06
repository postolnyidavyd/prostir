import { useState } from 'react';
import styled from 'styled-components';

import WarningIcon from '../../assets/icons/Triangle_Warning.svg?react';
import { apiErrorMessage, apiFieldErrors } from '../../lib/apiError';
import { toast } from '../../lib/toast';
import { useZodForm } from '../../lib/useZodForm';
import { changePasswordSchema, type ChangePasswordValues } from '../../lib/validation/profile';
import { useChangePasswordMutation } from '../../store/api/authApi';
import Button from '../ui/Button';
import ConfirmDialog from '../ui/ConfirmDialog';
import Input from '../ui/Input';
import SectionCard from './SectionCard';

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 0.625rem;
`;

const Fields = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const Actions = styled.div`
  display: flex;
  justify-content: flex-end;
`;

const FIELDS = ['currentPassword', 'newPassword'] as const;

function PasswordForm() {
  const { field, handleSubmit, setError, reset } = useZodForm(changePasswordSchema);
  const [changePassword, { isLoading }] = useChangePasswordMutation();
  // валідовані значення чекають підтвердження в модалці попередження
  const [pending, setPending] = useState<ChangePasswordValues | null>(null);

  const onSubmit = handleSubmit((values) => setPending(values));

  const confirm = async () => {
    if (!pending) return;
    try {
      await changePassword(pending).unwrap();
      toast.success('Пароль змінено');
      reset();
    } catch (error) {
      const fields = apiFieldErrors(error);
      const known = Object.entries(fields).filter(([name]) => FIELDS.includes(name as never));

      if (known.length > 0) {
        known.forEach(([name, message]) => setError(name as keyof ChangePasswordValues, { message }));
      } else {
        toast.error(apiErrorMessage(error));
      }
    } finally {
      setPending(null);
    }
  };

  return (
    <SectionCard title="Зміна пароля">
      <Form onSubmit={onSubmit} noValidate>
        <Fields>
          <Input
            label="Поточний пароль"
            type="password"
            autoComplete="current-password"
            {...field('currentPassword')}
          />
          <Input
            label="Новий пароль"
            type="password"
            autoComplete="new-password"
            {...field('newPassword')}
          />
        </Fields>
        <Actions>
          <Button type="submit" size="sm">
            Зберегти зміни
          </Button>
        </Actions>
      </Form>

      <ConfirmDialog
        open={pending !== null}
        onClose={() => setPending(null)}
        onConfirm={confirm}
        icon={<WarningIcon />}
        title="Змінити пароль?"
        description="Усі інші пристрої буде розлоговано — доведеться увійти знову."
        confirmLabel="Так, змінити"
        cancelLabel="Назад"
        loading={isLoading}
      />
    </SectionCard>
  );
}

export default PasswordForm;
