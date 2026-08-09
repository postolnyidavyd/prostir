import styled from 'styled-components';

import { media } from '../../styles/media';

export const Container = styled.div`
  width: 100%;
  max-width: 74rem;
  margin: 0 auto;
  padding: 0 2rem;

  ${media.phone} {
    padding: 0 1.25rem;
  }
`;

export const Eyebrow = styled.p`
  font-family: 'e-Ukraine', sans-serif;
  font-weight: 300;
  font-size: 1.1rem;
  line-height: 1.65rem;
  letter-spacing: 0.176rem;
  text-transform: uppercase;
  color: var(--secondary-text);
`;

export const SectionHeading = styled.h2`
  font-family: 'e-UkraineHead', sans-serif;
  font-weight: 300;
  font-size: 2.71875rem;
  line-height: 2.9375rem;
  letter-spacing: -0.054375rem;
  color: var(--primary-black);

  ${media.phone} {
    font-size: 1.9rem;
    line-height: 2.2rem;
    letter-spacing: -0.038rem;
  }
`;

export const SectionSub = styled.p`
  font-family: 'e-Ukraine', sans-serif;
  font-weight: 300;
  font-size: 1.1rem;
  line-height: 1.65rem;
  color: var(--secondary-text);
`;
