import { css, keyframes } from 'styled-components';

const wander = keyframes`
  0%   { background-position: 0 50%; }
  25%  { background-position: 50% 0; }
  50%  { background-position: 100% 50%; }
  75%  { background-position: 50% 100%; }
  100% { background-position: 0 50%; }
`;

export const hoverMesh = css`
  background-color: #0d0d0d;
  background-image:
    radial-gradient(circle at 35% 40%, #3a3a3a, transparent 45%),
    radial-gradient(circle at 65% 60%, #242424, transparent 50%);
  background-size: 180% 180%;
  animation: ${wander} 12s linear infinite;
  background-origin: border-box;
`;
