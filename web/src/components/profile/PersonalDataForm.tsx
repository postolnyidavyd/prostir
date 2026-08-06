import styled from 'styled-components';

import { apiErrorMessage, apiFieldErrors } from '../../lib/apiError';
import { toast } from '../../lib/toast';
import { useZodForm } from '../../lib/useZodForm';
import { updateProfileSchema, type UpdateProfileValues } from '../../lib/validation/profile';
import { useUpdateProfileMutation } from '../../store/api/authApi';
import type { User } from '../../store/authSlice';
import Button from '../ui/Button';
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

const Row = styled.div`
  display: flex;
  gap: 0.75rem;
`;

const EmailGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`;

const Hint = styled.p`
  font-family: 'e-Ukraine', sans-serif;
  font-weight: 300;
  font-size: 0.75rem;
  line-height: 1.125rem;
  color: var(--grey-100);
`;

const Actions = styled.div`
  display: flex;
  justify-content: flex-end;
`;

const FIELDS = ['firstName', 'lastName', 'email'] as const;

function PersonalDataForm({ user }: { user: User }) {
  const { field, handleSubmit, setError, reset, formState } = useZodForm(updateProfileSchema, {
    defaultValues: { firstName: user.firstName, lastName: user.lastName, email: user.email },
  });
  const [updateProfile, { isLoading }] = useUpdateProfileMutation();

  const onSubmit = handleSubmit(async (values) => {
    try {
      await updateProfile(values).unwrap();
      reset(values); // нові значення стають базовими
      toast.success('Дані оновлено');
    } catch (error) {
      const fields = apiFieldErrors(error);
      const known = Object.entries(fields).filter(([name]) => FIELDS.includes(name as never));

      if (known.length > 0) {
        known.forEach(([name, message]) => setError(name as keyof UpdateProfileValues, { message }));
      } else {
        toast.error(apiErrorMessage(error));
      }
    }
  });

  return (
    <SectionCard title="Особисті дані">
      <Form onSubmit={onSubmit} noValidate>
        <Fields>
          <Row>
            <Input label="Ім'я" autoComplete="given-name" {...field('firstName')} />
            <Input label="Прізвище" autoComplete="family-name" {...field('lastName')} />
          </Row>
          <EmailGroup>
            <Input label="Email" type="email" autoComplete="email" {...field('email')} />
            <Hint>Використовується для входу. Має бути унікальним.</Hint>
          </EmailGroup>
        </Fields>
        <Actions>
          {/*formState.isDirty показує чи значення поля відрізняються від default*/}
          <Button type="submit" size="sm" isLoading={isLoading} disabled={!formState.isDirty}>
            Зберегти зміни
          </Button>
        </Actions>
      </Form>
    </SectionCard>
  );
}

export default PersonalDataForm;
