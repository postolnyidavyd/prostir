import styled from 'styled-components';

import { selectCurrentUser } from '../store/authSlice';
import { useAppSelector } from '../store/hooks';
import { media } from '../styles/media';

const Bar = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.625rem;
  min-height: 2.75rem;
  padding: 0.5rem 1.5rem;
  background-color: var(--accent-color);
  border-bottom: 1px solid var(--accent-color-border-hover);
  color: var(--accent-color-deep);
  font-family: 'e-Ukraine', sans-serif;
  font-weight: 300;
  font-size: 0.8125rem;
  line-height: 1.35;
  text-align: center;

  ${media.phone} {
    align-items: flex-start;
    text-align: left;
  }
`;

const Icon = styled.span`
  flex: none;
  display: inline-flex;
  color: var(--accent-color-deep);
`;

const Strong = styled.b`
  font-family: 'e-UkraineHead', sans-serif;
  font-weight: 400;
  color: var(--primary-black);
`;

const Email = styled.span`
  color: var(--primary-black);
`;

function VerifyEmailBanner() {
  const user = useAppSelector(selectCurrentUser);

  if (!user || user.emailVerified) return null;

  return (
    <Bar role="status">
      <Icon>
        <svg
          width="17"
          height="17"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
        >
          <rect x="3" y="5" width="18" height="14" rx="2" />
          <path d="m3 7 9 6 9-6" />
        </svg>
      </Icon>
      <span>
        <Strong>Підтвердьте пошту</Strong> — посилання для <Email>{user.email}</Email> надруковано в
        лозі сервера (dev-режим). Перейдіть за ним, щоб бронювати кімнати.
      </span>
    </Bar>
  );
}

export default VerifyEmailBanner;
