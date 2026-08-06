import type { ReactNode } from 'react';
import styled from 'styled-components';

import { text } from '../../styles/typography';

type Tone = 'neutral' | 'error';

const Wrap = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1.5rem;
  padding: 2.5rem 1.75rem;
`;

const Group = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
`;

const IconBox = styled.div<{ $tone: Tone }>`
  width: 5rem;
  height: 5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 1.5rem;
  background-color: ${({ $tone }) =>
    $tone === 'error' ? 'var(--brick-red-20)' : 'var(--accent-color)'};
  color: ${({ $tone }) =>
    $tone === 'error' ? 'var(--brick-red-100)' : 'var(--accent-color-intense)'};

  svg {
    width: 2.333rem;
    height: 2.333rem;
  }
`;

const TextGroup = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.625rem;
  text-align: center;
`;

const Title = styled.h2`
  ${text.h4};
  color: var(--primary-black);
`;

const Description = styled.p`
  font-family: 'e-Ukraine', sans-serif;
  font-weight: 300;
  font-size: 0.875rem;
  line-height: 1.3125rem;
  color: var(--secondary-text);
  max-width: 22.5625rem;
`;

const Actions = styled.div`
  display: flex;
  gap: 0.625rem;
`;

type EmptyStateProps = {
  icon: ReactNode;
  title: string;
  description: string;
  tone?: Tone;
  children?: ReactNode;
};

function EmptyState({ icon, title, description, tone = 'neutral', children }: EmptyStateProps) {
  return (
    <Wrap>
      <Group>
        <IconBox $tone={tone}>{icon}</IconBox>
        <TextGroup>
          <Title>{title}</Title>
          <Description>{description}</Description>
        </TextGroup>
      </Group>
      {children && <Actions>{children}</Actions>}
    </Wrap>
  );
}

export default EmptyState;
