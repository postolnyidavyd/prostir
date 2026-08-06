import type { ComponentType, SVGProps } from 'react';
import styled from 'styled-components';

import CalendarEventIcon from '../../assets/icons/Calendar_Event.svg?react';
import CheckIcon from '../../assets/icons/Check.svg?react';
import ClockIcon from '../../assets/icons/Clock.svg?react';
import LockIcon from '../../assets/icons/Lock.svg?react';
import { Container, Eyebrow, SectionHeading, SectionSub } from './primitives';

type Feature = {
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  title: string;
  text: string;
};

const FEATURES: Feature[] = [
  {
    icon: CalendarEventIcon,
    title: 'Тижнева сітка',
    text: 'Сім днів і робочі години кімнати в одному екрані. Крок — 30 хвилин.',
  },
  {
    icon: CheckIcon,
    title: 'Тільки вільні',
    text: 'Задаєш час і тривалість — сітка лишає кімнати, де цей слот справді вільний. Жодних здогадок.',
  },
  {
    icon: ClockIcon,
    title: 'Своє під контролем',
    text: 'Свої майбутні бронювання скасовуєш у пару кліків. Чуже — недоторкане, це правило сервера.',
  },
  {
    icon: LockIcon,
    title: 'Без накладок',
    text: 'Два бронювання на один слот фізично неможливі — це гарантує сама база, а не перевірка в інтерфейсі.',
  },
];

const Section = styled.section`
  padding: 6.9375rem 0 6rem;
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

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1.25rem;

  @media (max-width: 48rem) {
    grid-template-columns: 1fr;
  }
`;

const Card = styled.article`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.625rem;
  padding: 1.9375rem 1.9375rem 2.1875rem;
  background-color: var(--base-white);
  border: 1px solid var(--base-bright-grey);
  border-radius: 1.25rem;
  box-shadow: var(--shadow-sm);
`;

const IconBox = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.875rem;
  height: 2.875rem;
  border-radius: 0.8125rem;
  background-color: var(--accent-color);
  color: var(--accent-color-intense);

  svg {
    width: 1.5rem;
    height: 1.5rem;
  }
`;

const CardTitle = styled.h3`
  margin-top: 0.625rem;
  font-family: 'e-UkraineHead', sans-serif;
  font-weight: 300;
  font-size: 1.35rem;
  line-height: 2.025rem;
  letter-spacing: -0.027rem;
  color: var(--primary-black);
`;

const CardText = styled.p`
  font-family: 'e-Ukraine', sans-serif;
  font-weight: 300;
  font-size: 1rem;
  line-height: 1.5rem;
  color: var(--secondary-text);
`;

function FeaturesSection() {
  return (
    <Section>
      <Container>
        <Inner>
          <Head>
            <Eyebrow>Можливості</Eyebrow>
            <SectionHeading>Розклад, який не треба ні в кого перепитувати</SectionHeading>
            <SectionSub>
              Одна сторінка замінює чат «хто зайняв Титан о третій». Стан кімнати видно одразу.
            </SectionSub>
          </Head>
          <Grid>
            {FEATURES.map(({ icon: Icon, title, text }) => (
              <Card key={title}>
                <IconBox>
                  <Icon />
                </IconBox>
                <CardTitle>{title}</CardTitle>
                <CardText>{text}</CardText>
              </Card>
            ))}
          </Grid>
        </Inner>
      </Container>
    </Section>
  );
}

export default FeaturesSection;
