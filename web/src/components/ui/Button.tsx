import type { ButtonHTMLAttributes } from 'react';
import styled, { css } from 'styled-components';

import { hoverMesh } from '../../styles/mesh';
import Spinner from './Spinner';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md';

const variants: Record<Variant, ReturnType<typeof css>> = {
  primary: css`
    background-color: var(--base-black);
    color: var(--base-white);

    &:hover:not(:disabled) {
      ${hoverMesh};
    }

    &:disabled {
      background-color: #ededed;
      color: var(--grey-100);
    }
  `,
  secondary: css`
    background-color: var(--base-white);
    color: var(--base-black);
    border: 2px solid var(--base-black);

    &:hover:not(:disabled) {
      border-color: transparent;
      background-color: rgba(13, 13, 13, 0.06);
    }

    &:hover:not(:disabled)::after {
      content: '';
      position: absolute;
      inset: -2px;
      border-radius: inherit;
      padding: 2px;
      ${hoverMesh};
      -webkit-mask:
        linear-gradient(#fff 0 0) content-box,
        linear-gradient(#fff 0 0);
      -webkit-mask-composite: xor;
      mask-composite: exclude;
      pointer-events: none;
    }

    &:disabled {
      border-color: #ededed;
      color: var(--grey-100);
    }
  `,
  ghost: css`
    background-color: transparent;
    color: var(--secondary-text);
    &:hover:not(:disabled) {
      background-color: var(--grey-20);
    }
  `,
  danger: css`
    background-color: var(--brick-red-100);
    color: var(--base-white);
    &:hover:not(:disabled) {
      background-color: var(--brick-red-80);
    }
    &:disabled {
      background-color: var(--brick-red-40);
      color: var(--grey-20);
    }
  `,
};

const sizes: Record<Size, ReturnType<typeof css>> = {
  sm: css`
    height: 40px;
    padding: 0 20px;
    gap: 8px;
    border-radius: 14px;
    font-size: 13px;
    line-height: 16px;
  `,
  md: css`
    height: 56px;
    padding: 0 30px;
    gap: 12px;
    border-radius: 20px;
    font-size: 16px;
    line-height: 24px;
  `,
};

const LoadingLayer = styled.span`
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const Inner = styled.span<{ $hidden: boolean }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: inherit;
  visibility: ${({ $hidden }) => ($hidden ? 'hidden' : 'visible')};
`;

const StyledButton = styled.button<{ $variant: Variant; $size: Size; $fullWidth: boolean }>`
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: none;
  font-weight: 400;
  letter-spacing: -0.32px;
  cursor: pointer;
  white-space: nowrap;
  transition:
    transform 0.2s cubic-bezier(0.4, 0, 0.2, 1),
    background-color 0.2s ease,
    border-color 0.2s ease;

  &:active:not(:disabled) {
    transform: scale(0.97);
  }

  &:focus-visible {
    outline: 2px solid var(--radiance-100);
    outline-offset: 2px;
  }

  ${({ $size }) => sizes[$size]}
  ${({ $variant }) => variants[$variant]}

  width: ${({ $fullWidth }) => ($fullWidth ? '100%' : 'auto')};

  &:disabled {
    cursor: not-allowed;
  }
`;

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
  isLoading?: boolean;
};

function Button({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  isLoading = false,
  disabled,
  children,
  ...props
}: ButtonProps) {
  return (
    <StyledButton
      $variant={variant}
      $size={size}
      $fullWidth={fullWidth}
      disabled={isLoading || disabled}
      {...props}
    >
      {isLoading && (
        <LoadingLayer>
          <Spinner size="sm" />
        </LoadingLayer>
      )}
      <Inner $hidden={isLoading}>{children}</Inner>
    </StyledButton>
  );
}

export default Button;
