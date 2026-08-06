import styled from 'styled-components';

import Logo from '../../assets/Logo.svg?react';
import LinkButton from './LinkButton';

const Bar = styled.header`
  position: sticky;
  top: 0;
  z-index: 10;
  display: flex;
  justify-content: center;
  background-color: rgba(247, 247, 247, 0.82);
  backdrop-filter: blur(6px);
`;

const Container = styled.div`
  width: 100%;
  max-width: 74rem;
  height: 4.75rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 2rem;
`;

const Brand = styled.div`
  display: flex;
  align-items: center;
  gap: 0.625rem;
`;

const BrandName = styled.span`
  font-family: 'e-UkraineHead', sans-serif;
  font-weight: 400;
  font-size: 1.375rem;
  line-height: 2.0625rem;
  letter-spacing: -0.01375rem;
  color: var(--primary-black);
`;

const Actions = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

function LandingHeader() {
  return (
    <Bar>
      <Container>
        <Brand>
          <Logo width={36} height={36} />
          <BrandName>Простір</BrandName>
        </Brand>
        <Actions>
          <LinkButton to="/login" $variant="ghost" $size="sm">
            Увійти
          </LinkButton>
          <LinkButton to="/register" $variant="dark" $size="sm">
            Створити акаунт
          </LinkButton>
        </Actions>
      </Container>
    </Bar>
  );
}

export default LandingHeader;
