import styled from 'styled-components';

import LinkButton from './LinkButton';
import { Container } from './primitives';

const Section = styled.section`
  padding: 6rem 0 6.75rem;
`;

const Inner = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3rem;
`;

const Heading = styled.h2`
  font-family: 'e-UkraineHead', sans-serif;
  font-weight: 300;
  font-size: 3.2rem;
  line-height: 3.36rem;
  letter-spacing: -0.064rem;
  text-align: center;
  color: var(--primary-black);
`;

const Actions = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0.875rem;
`;

function CtaSection() {
  return (
    <Section>
      <Container>
        <Inner>
          <Heading>Наступна зустріч заслуговує на кімнату</Heading>
          <Actions>
            <LinkButton to="/register" $variant="dark" $size="md">
              Створити акаунт
            </LinkButton>
            <LinkButton to="/login" $variant="outline" $size="md">
              Увійти
            </LinkButton>
          </Actions>
        </Inner>
      </Container>
    </Section>
  );
}

export default CtaSection;
