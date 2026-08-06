import { Link } from 'react-router-dom';
import styled, { css } from 'styled-components';

import { hoverMesh } from '../../styles/mesh';

type Variant = 'dark' | 'outline' | 'ghost';
type Size = 'md' | 'sm';

const variants: Record<Variant, ReturnType<typeof css>> = {
  dark: css`
    background-color: var(--primary-black);
    color: var(--base-white);

    &:hover {
      ${hoverMesh};
    }
  `,
  outline: css`
    background-color: var(--base-white);
    color: var(--primary-black);
    border: 1px solid var(--primary-black);

    &:hover {
      background-color: rgba(13, 13, 13, 0.06);
    }
  `,
  ghost: css`
    background-color: transparent;
    color: var(--secondary-text);

    &:hover {
      background-color: rgba(13, 13, 13, 0.04);
    }
  `,
};

const sizes: Record<Size, ReturnType<typeof css>> = {
  md: css`
    height: 3.5rem;
    padding: 0 1.875rem;
    border-radius: 1.25rem;
    font-size: 1rem;
    line-height: 1.5rem;
    letter-spacing: -0.02rem;
  `,
  sm: css`
    height: 2.5rem;
    padding: 0 1.25rem;
    border-radius: 0.75rem;
    font-size: 0.8125rem;
    line-height: 1.21875rem;
    letter-spacing: -0.01625rem;
  `,
};

const LinkButton = styled(Link)<{ $variant: Variant; $size: Size }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-family: 'e-Ukraine', sans-serif;
  font-weight: 400;
  white-space: nowrap;
  text-decoration: none;
  cursor: pointer;
  transition:
    transform 0.2s cubic-bezier(0.4, 0, 0.2, 1),
    background-color 0.2s ease;

  &:active {
    transform: scale(0.97);
  }

  ${({ $size }) => sizes[$size]}
  ${({ $variant }) => variants[$variant]}
`;

export default LinkButton;
