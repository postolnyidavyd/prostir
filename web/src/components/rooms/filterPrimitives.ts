import styled from 'styled-components';

import { text } from '../../styles/typography';


export const Section = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

export const SectionHead = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.625rem;
`;

export const SectionTitle = styled.span`
  ${text.body};
  color: var(--primary-black);
`;

export const Hint = styled.span`
  ${text.tiny};
  color: var(--secondary-text);
`;
