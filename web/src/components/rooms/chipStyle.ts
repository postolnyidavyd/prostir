import { css } from 'styled-components';

import { text } from '../../styles/typography';

// спільний вигляд чіпів тулбара
export const chipStyle = css`
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.375rem;
  border: 1px solid var(--grey-80);
  border-radius: 0.625rem;
  background-color: var(--base-white);
  color: var(--primary-black);
  cursor: pointer;
  white-space: nowrap;
  ${text.small};
  transition:
    background-color 0.15s ease,
    border-color 0.15s ease;

  svg {
    width: 1.125rem;
    height: 1.125rem;
    flex-shrink: 0;
  }

  &:hover {
    background-color: var(--primary-grey);
    border-color: var(--grey-100);
  }
`;
