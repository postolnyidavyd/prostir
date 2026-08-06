import styled from 'styled-components';

import Logo from '../../assets/Logo.svg?react';
import { Container } from './primitives';

const Foot = styled.footer`
  border-top: 1px solid var(--base-bright-grey);
  padding: 2.5625rem 0 2.5rem;
`;

const Row = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 1.25rem;
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
  color: var(--grey-100);
`;

const Muted = styled.span`
  font-family: 'e-Ukraine', sans-serif;
  font-weight: 300;
  font-size: 0.875rem;
  line-height: 1.3125rem;
  color: var(--grey-100);
`;

const Author = styled(Muted)`
  margin-left: auto;
`;

function LandingFooter() {
  return (
    <Foot>
      <Container>
        <Row>
          <Brand>
            <Logo width={36} height={36} />
            <BrandName>Простір</BrandName>
          </Brand>
          <Muted>Бронювання переговорних</Muted>
          <Author>Створив Постольний Давид</Author>
        </Row>
      </Container>
    </Foot>
  );
}

export default LandingFooter;
