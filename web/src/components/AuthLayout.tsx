import type { ReactNode } from 'react';
import styled from 'styled-components';

import Logo from '../assets/Logo.svg?react';
import { text } from '../styles/typography';

const Screen = styled.div`
  min-height: 100dvh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
  background-color: var(--primary-grey);
`;

const Card = styled.div`
  width: 100%;
  max-width: 31.75rem;
  display: flex;
  flex-direction: column;
  gap: 2rem;
  background-color: var(--base-white);
  border: 1px solid var(--base-bright-grey);
  border-radius: 1.5rem;
  box-shadow: var(--shadow);
  padding: 2.5625rem 2.3125rem 2.3125rem;
`;

const Header = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.625rem;
`;

const Brand = styled.div`
  display: flex;
  align-items: center;
  gap: 0.625rem;
`;

const BrandName = styled.span`
  ${text.h6};
  color: var(--primary-black);
`;

const Title = styled.h1`
  ${text.h1};
  color: var(--primary-black);
`;

const Subtitle = styled.p`
  /* 0.9375rem/1.40625rem (15/22.5) — окремий розмір підзаголовка з макета, у токенах немає */
  font-family: 'e-Ukraine', sans-serif;
  font-weight: 300;
  font-size: 0.9375rem;
  line-height: 1.40625rem;
  color: var(--secondary-text);
`;

type AuthLayoutProps = {
  title: string;
  subtitle: string;
  children: ReactNode;
};

function AuthLayout({ title, subtitle, children }: AuthLayoutProps) {
  return (
    <Screen>
      <Card>
        <Header>
          <Brand>
            <Logo width={36} height={36} />
            <BrandName>Простір</BrandName>
          </Brand>
          <Title>{title}</Title>
          <Subtitle>{subtitle}</Subtitle>
        </Header>
        {children}
      </Card>
    </Screen>
  );
}

export default AuthLayout;
