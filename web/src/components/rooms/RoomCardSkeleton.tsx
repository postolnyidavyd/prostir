import styled, { keyframes } from 'styled-components';

const pulse = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0.45; }
`;

const Card = styled.div`
  display: flex;
  flex-direction: column;
  border: 2px solid var(--base-bright-grey);
  border-radius: 1.25rem;
  overflow: hidden;
  background-color: var(--base-white);
`;

const Block = styled.div`
  background-color: var(--grey-20);
  animation: ${pulse} 1.5s ease-in-out infinite;
`;

const Image = styled(Block)`
  width: 100%;
  aspect-ratio: 5 / 4;
`;

const Footer = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  padding: 0.625rem;
`;

const NameLine = styled(Block)`
  height: 0.875rem;
  width: 40%;
  border-radius: 0.25rem;
`;

const MetaLine = styled(Block)`
  height: 0.875rem;
  width: 3rem;
  border-radius: 0.25rem;
`;

function RoomCardSkeleton() {
  return (
    <Card>
      <Image />
      <Footer>
        <NameLine />
        <MetaLine />
      </Footer>
    </Card>
  );
}

export default RoomCardSkeleton;
