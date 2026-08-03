import styled from 'styled-components';

import { text } from '../styles/typography';

const Wrap = styled.div`
  padding: 2rem;
`;

const Title = styled.h1`
  ${text.h3};
  color: var(--primary-black);
`;

function MyBookingsPage() {
  return (
    <Wrap>
      <Title>Мої бронювання</Title>
    </Wrap>
  );
}

export default MyBookingsPage;
