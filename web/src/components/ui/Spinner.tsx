import styled, { keyframes } from 'styled-components';

const spin = keyframes`to { transform: rotate(360deg); }`;

type Size = 'sm' | 'md' | 'lg';

const sizes: Record<Size, { ring: string; border: string }> = {
  sm: { ring: '24px', border: '2px' },
  md: { ring: '40px', border: '3px' },
  lg: { ring: '56px', border: '3px' },
};

const Ring = styled.div<{ $size: Size }>`
  width: ${({ $size }) => sizes[$size].ring};
  height: ${({ $size }) => sizes[$size].ring};
  border-radius: 50%;
  border: ${({ $size }) => sizes[$size].border} solid var(--accent-color);
  border-top-color: var(--accent-color-intense);
  animation: ${spin} 0.8s linear infinite;
  flex-shrink: 0;
`;

const FullWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 14px;
  min-height: 100dvh;
`;

const LoadingText = styled.p`
  font-size: var(--desktop-base-small);
  color: var(--secondary-text);
  margin: 0;
`;

type SpinnerProps = {
  size?: Size;
  fullscreen?: boolean;
};

function Spinner({ size = 'md', fullscreen = false }: SpinnerProps) {
  if (fullscreen) {
    return (
      <FullWrapper>
        <Ring $size="lg" />
        <LoadingText>Завантаження…</LoadingText>
      </FullWrapper>
    );
  }

  return <Ring $size={size} />;
}

export default Spinner;
