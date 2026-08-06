import styled from 'styled-components';

import { Container, Eyebrow, SectionHeading } from './primitives';

type Step = {
  label: string;
  title: string;
  text: string;
};

const STEPS: Step[] = [
  {
    label: 'КРОК 01',
    title: 'Обери кімнату й час',
    text: 'Постав дату, час і тривалість. Увімкни «тільки вільні», щоб бачити лише те, що можна зайняти.',
  },
  {
    label: 'КРОК 02',
    title: 'Знайди вільний слот',
    text: 'Тижнева сітка показує зайняте, минуле й вільне. Тиснеш на порожній проміжок у робочих годинах.',
  },
  {
    label: 'КРОК 03',
    title: 'Заброньуй',
    text: 'Назва зустрічі — і готово. Слот стає твоїм; його побачить кожен, хто відкриє розклад кімнати.',
  },
];

const Section = styled.section`
  padding: 0 0 6rem;
`;

const Inner = styled.div`
  display: flex;
  flex-direction: column;
  gap: 3.25rem;
`;

const Head = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.875rem;
  max-width: 40rem;
`;

const Row = styled.div`
  display: flex;
  gap: 1.25rem;

  @media (max-width: 56rem) {
    flex-direction: column;
  }
`;

const Card = styled.div`
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.58125rem;
  padding: 2.125rem 1.6875rem 1.9375rem;
  background-color: var(--base-white);
  border: 1px solid var(--base-bright-grey);
  border-radius: 1.25rem;
`;

const Label = styled.span`
  font-family: 'e-UkraineHead', sans-serif;
  font-weight: 300;
  font-size: 0.8125rem;
  line-height: 1.21875rem;
  letter-spacing: 0.08125rem;
  color: var(--accent-color-deep);
`;

const Title = styled.h3`
  margin-top: 0.54375rem;
  font-family: 'e-UkraineHead', sans-serif;
  font-weight: 300;
  font-size: 1.3rem;
  line-height: 1.95rem;
  letter-spacing: -0.026rem;
  color: var(--primary-black);
`;

const Text = styled.p`
  font-family: 'e-Ukraine', sans-serif;
  font-weight: 300;
  font-size: 0.98125rem;
  line-height: 1.47rem;
  color: var(--secondary-text);
`;

function StepsSection() {
  return (
    <Section>
      <Container>
        <Inner>
          <Head>
            <Eyebrow>Як це працює</Eyebrow>
            <SectionHeading>Три кроки від «треба кімнату» до заброньовано</SectionHeading>
          </Head>
          <Row>
            {STEPS.map(({ label, title, text }) => (
              <Card key={label}>
                <Label>{label}</Label>
                <Title>{title}</Title>
                <Text>{text}</Text>
              </Card>
            ))}
          </Row>
        </Inner>
      </Container>
    </Section>
  );
}

export default StepsSection;
