import type { ReactNode } from 'react';
import styled from 'styled-components';

const Card = styled.section`
  display: flex;
  flex-direction: column;
  gap: 0.625rem;
  padding: 0.6875rem 1.0625rem;
  background-color: var(--base-white);
  border: 1px solid var(--base-bright-grey);
  border-radius: 1.25rem;
  box-shadow: var(--shadow-sm);
`;

const Heading = styled.h2`
  font-family: 'e-UkraineHead', sans-serif;
  font-weight: 400;
  font-size: 1.15rem;
  line-height: 1.725rem;
  letter-spacing: -0.368px;
  color: var(--primary-black);
`;

type SectionCardProps = {
  title: string;
  children: ReactNode;
};

function SectionCard({ title, children }: SectionCardProps) {
  return (
    <Card>
      <Heading>{title}</Heading>
      {children}
    </Card>
  );
}

export default SectionCard;
