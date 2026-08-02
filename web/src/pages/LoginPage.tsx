import { Link } from 'react-router-dom';
import styled from 'styled-components';

import AuthLayout from '../components/AuthLayout';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { apiErrorMessage, apiFieldErrors } from '../lib/apiError';
import { toast } from '../lib/toast';
import { useZodForm } from '../lib/useZodForm';
import { loginSchema, type LoginValues } from '../lib/validation/auth';
import { useLoginMutation } from '../store/api/authApi';

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

function LoginPage() {
  const { field, handleSubmit, setError } = useZodForm(loginSchema);
  const [login, { isLoading }] = useLoginMutation();

  const onSubmit = handleSubmit(async (values) => {
    try {
      await login(values).unwrap();
      // редірект зробить PublicOnly, щойно статус стане authenticated
    } catch (error) {
      const fields = apiFieldErrors(error);
      const entries = Object.entries(fields);

      if (entries.length > 0) {
        entries.forEach(([name, message]) => setError(name as keyof LoginValues, { message }));
      } else {
        toast.error(apiErrorMessage(error));
      }
    }
  });

  return (
    <AuthLayout title="Вхід" subtitle="З поверненням!">
      <Form onSubmit={onSubmit} noValidate>
        <Fields>
          <Input label="Email" type="email" autoComplete="email" {...field('email')} />
          <Input
            label="Пароль"
            type="password"
            autoComplete="current-password"
            {...field('password')}
          />
        </Fields>
        <Button type="submit" fullWidth isLoading={isLoading}>
          Увійти
        </Button>
      </Form>
      <Switch>
        Немає акаунту? <Link to="/register">Зареєструватися</Link>
      </Switch>
    </AuthLayout>
  );
}

export default LoginPage;
