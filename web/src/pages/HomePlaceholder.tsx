import styled from 'styled-components';

import Button from '../components/ui/Button';
import { useLogoutMutation } from '../store/api/authApi';
import { useAppSelector } from '../store/hooks';

const Wrapper = styled.div`
  padding: 2rem;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 1rem;
`;

const Greeting = styled.p`
  color: var(--secondary-text);
`;

// тимчасова головна
function HomePlaceholder() {
  const user = useAppSelector((state) => state.auth.user);
  const [logout, { isLoading }] = useLogoutMutation();

  return (
    <Wrapper>
      <h1>Простір</h1>
      {user && (
        <Greeting>
          {user.firstName} {user.lastName} · {user.email}
        </Greeting>
      )}
      <Button variant="secondary" onClick={() => logout()} isLoading={isLoading}>
        Вийти
      </Button>
    </Wrapper>
  );
}

export default HomePlaceholder;
