import styled from 'styled-components';

import { text } from '../../styles/typography';

const Circle = styled.div`
  flex-shrink: 0;
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
  background-color: var(--base-bright-grey);
  display: flex;
  align-items: center;
  justify-content: center;
  ${text.h7};
  color: var(--primary-black);
`;

type AvatarProps = {
  initials: string;
};

function Avatar({ initials }: AvatarProps) {
  return <Circle>{initials}</Circle>;
}

export default Avatar;
