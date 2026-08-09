import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import styled from 'styled-components';

import AuthLayout from '../components/AuthLayout';
import Button from '../components/ui/Button';
import Spinner from '../components/ui/Spinner';
import { apiErrorMessage } from '../lib/apiError';
import authApi, { useVerifyEmailMutation } from '../store/api/authApi';
import { selectIsAuthenticated } from '../store/authSlice';
import { useAppDispatch, useAppSelector } from '../store/hooks';

type Status = 'pending' | 'success' | 'error';

// короткі заголовки під стан - щоб влазили в h1 картки, як «Вхід»/«Реєстрація»
const HEADINGS: Record<Status, { title: string; subtitle: string }> = {
  pending: { title: 'Хвилинку', subtitle: 'Підтверджуємо вашу пошту' },
  success: { title: 'Готово', subtitle: 'Пошту підтверджено' },
  error: { title: 'Помилка', subtitle: 'Не вдалося підтвердити пошту' },
};

const Body = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2rem;
`;

const SpinnerRow = styled.div`
  display: flex;
  justify-content: center;
  padding: 0.5rem 0;
`;

const Message = styled.p`
  font-family: 'e-Ukraine', sans-serif;
  font-weight: 300;
  font-size: 0.9375rem;
  line-height: 1.40625rem;
  color: var(--secondary-text);
`;

function VerifyEmailPage() {
  const [params] = useSearchParams();
  const token = params.get('token') ?? '';
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const [verifyEmail] = useVerifyEmailMutation();

  const [status, setStatus] = useState<Status>('pending');
  const [error, setErrorText] = useState('');

  // гард від StrictMode - монтує двічі і викличе 2 запити, за чого може впасти
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    if (!token) {
      setStatus('error');
      setErrorText('Посилання неповне - немає токена підтвердження.');
      return;
    }

    verifyEmail({ token })
      .unwrap()
      .then(() => {
        setStatus('success');
        // разовий рефетч сесії, щоб банер підтвердження зник
        // одразу відписуємось, щоб не тримамати підписку
        dispatch(authApi.endpoints.getMe.initiate(undefined, { forceRefetch: true })).unsubscribe();
      })
      .catch((reason) => {
        setStatus('error');
        setErrorText(apiErrorMessage(reason));
      });
  }, [token, verifyEmail, dispatch]);

  const goOn = () => navigate(isAuthenticated ? '/' : '/login');
  const { title, subtitle } = HEADINGS[status];

  return (
    <AuthLayout title={title} subtitle={subtitle}>
      {status === 'pending' && (
        <SpinnerRow>
          <Spinner />
        </SpinnerRow>
      )}

      {status === 'success' && (
        <Body>
          <Message>Тепер можна бронювати переговорні кімнати.</Message>
          <Button fullWidth onClick={goOn}>
            {isAuthenticated ? 'До бронювання' : 'Увійти'}
          </Button>
        </Body>
      )}

      {status === 'error' && (
        <Body>
          <Message>{error}</Message>
          <Button fullWidth variant="secondary" onClick={goOn}>
            {isAuthenticated ? 'На головну' : 'Увійти'}
          </Button>
        </Body>
      )}
    </AuthLayout>
  );
}

export default VerifyEmailPage;
