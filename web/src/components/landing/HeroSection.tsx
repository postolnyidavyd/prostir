import styled from 'styled-components';

import LinkButton from './LinkButton';
import { Container } from './primitives';

const HERO_IMAGE = '/landing-hero-new.png';

const Section = styled.section`
  padding: 5.5rem 0 6rem;
`;

const Layout = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 3.5rem;
`;

const Copy = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 1.375rem;
`;

const Heading = styled.h1`
  font-family: 'e-UkraineHead', sans-serif;
  font-weight: 300;
  font-size: 3.5625rem;
  line-height: 4.243125rem;
  letter-spacing: -0.0831875rem;
  color: var(--primary-black);
`;

const Accent = styled.span`
  color: var(--accent-color-deep);
`;

const Paragraph = styled.p`
  max-width: 28.6875rem;
  font-family: 'e-Ukraine', sans-serif;
  font-weight: 300;
  font-size: 1.125rem;
  line-height: 1.86rem;
  color: var(--secondary-text);
`;

const Frame = styled.div`
  position: relative;
  width: min(37.5625rem, 100%);
  aspect-ratio: 601 / 312;
  border-radius: 0.625rem;
  overflow: hidden;
  background-color: var(--secondary-grey);
  box-shadow: 4px 6px 7px 1px rgba(0, 0, 0, 0.2);
`;

const Shot = styled.img`
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

function HeroSection() {
  return (
    <Section>
      <Container>
        <Layout>
          <Copy>
            <Heading>
              Переговорна
              <br />— <Accent>за два</Accent>
              <br />
              <Accent>кліки</Accent> , без
              <br />
              листування
            </Heading>
            <Paragraph>
              Весь тиждень кімнати перед очима. Видно, що зайнято, а що вільне — обираєш час і
              бронюєш. Своє скасовуєш сам, чуже лишається недоторканим.
            </Paragraph>
            <LinkButton to="/register" $variant="dark" $size="md">
              Забронювати кімнату
            </LinkButton>
          </Copy>
          <Frame>
            <Shot src={HERO_IMAGE} alt="Тижневий розклад кімнати в застосунку Простір" />
          </Frame>
        </Layout>
      </Container>
    </Section>
  );
}

export default HeroSection;
