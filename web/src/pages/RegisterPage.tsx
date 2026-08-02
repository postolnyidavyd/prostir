import { Link } from 'react-router-dom';
import styled from 'styled-components';

import AuthLayout from '../components/AuthLayout';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { apiErrorMessage, apiFieldErrors } from '../lib/apiError';
import { toast } from '../lib/toast';
import { useZodForm } from '../lib/useZodForm';
import { registerSchema, type RegisterValues } from '../lib/validation/auth';
import { useRegisterMutation } from '../store/api/authApi';

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 2rem;
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

const Switch = styled.p`
  border-top: 1px solid #f1f4f6; /* grey/95 з макета, у токенах немає */
  padding-top: 0.3125rem;
  text-align: center;
  font-family: 'e-Ukraine', sans-serif;
  font-weight: 300;
  font-size: 0.875rem;
  line-height: 1.3125rem;
  color: var(--secondary-text);

  a {
    color: #4f6a64; /* колір лінка з макета (Cutty Sark) */
  }
`;

function RegisterPage() {
  const { field, handleSubmit, setError } = useZodForm(registerSchema);
  const [register, { isLoading }] = useRegisterMutation();

  const onSubmit = handleSubmit(async (values) => {
    try {
      await register(values).unwrap();
    } catch (error) {
      const fields = apiFieldErrors(error);
      const entries = Object.entries(fields);

      if (entries.length > 0) {
        entries.forEach(([name, message]) => setError(name as keyof RegisterValues, { message }));
      } else {
        toast.error(apiErrorMessage(error));
      }
    }
  });

  return (
    <AuthLayout title="Реєстрація" subtitle="Створіть акаунт, щоб почати">
      <Form onSubmit={onSubmit} noValidate>
        <Fields>
          <Row>
            <Input label="Ім'я" autoComplete="given-name" {...field('firstName')} />
            <Input label="Прізвище" autoComplete="family-name" {...field('lastName')} />
          </Row>
          <Input label="Email" type="email" autoComplete="email" {...field('email')} />
          <Input
            label="Пароль"
            type="password"
            autoComplete="new-password"
            {...field('password')}
          />
        </Fields>
        <Button type="submit" fullWidth isLoading={isLoading}>
          Створити акаунт
        </Button>
      </Form>
      <Switch>
        Вже маєте акаунт? <Link to="/login">Увійти</Link>
      </Switch>
    </AuthLayout>
  );
}

export default RegisterPage;
