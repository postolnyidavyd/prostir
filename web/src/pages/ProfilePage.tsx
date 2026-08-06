import styled from 'styled-components';

import PasswordForm from '../components/profile/PasswordForm';
import PersonalDataForm from '../components/profile/PersonalDataForm';
import SessionCard from '../components/profile/SessionCard';
import { selectCurrentUser } from '../store/authSlice';
import { useAppSelector } from '../store/hooks';
import { text } from '../styles/typography';

const Wrap = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1rem;
  max-width: 40rem;
`;

const Title = styled.h1`
  ${text.h5};
  color: var(--primary-black);
`;

function ProfilePage() {
  const user = useAppSelector(selectCurrentUser);

  if (!user) return null;

  return (
    <Wrap>
      <Title>Мій профіль</Title>
      <PersonalDataForm user={user} />
      <PasswordForm />
      <SessionCard />
    </Wrap>
  );
}

export default ProfilePage;
