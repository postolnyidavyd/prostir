import styled from 'styled-components';

import StairsIcon from '../../assets/icons/stairs.svg?react';
import UserIcon from '../../assets/icons/User_03.svg?react';
import type { Room } from '../../store/api/roomsApi';
import { text } from '../../styles/typography';
import Badge from '../ui/Badge';

const Card = styled.article`
  position: relative;
  display: flex;
  flex-direction: column;
  border: 2px solid var(--base-bright-grey);
  border-radius: 1.25rem;
  overflow: hidden;
  background-color: var(--base-white);
  cursor: pointer;
  transition:
    border-color 0.15s ease,
    box-shadow 0.15s ease,
    transform 0.15s ease;

  &:hover {
    border-color: var(--accent-color-border-hover);
    box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.08);
    transform: translateY(-0.125rem);
  }
`;

const ImageWrap = styled.div`
  width: 100%;
  aspect-ratio: 5 / 4;
`;

const Image = styled.img`
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const BadgeWrap = styled.div`
  position: absolute;
  top: 0.5rem;
  left: 0.5rem;
`;

const Footer = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  padding: 0.625rem;
`;

const Name = styled.span`
  ${text.h8};
  color: var(--primary-black);
`;

const Meta = styled.div`
  display: flex;
  align-items: center;
  gap: 0.25rem;
`;

const Stat = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 0.125rem;
  ${text.tiny};
  color: var(--secondary-text);

  svg {
    width: 1rem;
    height: 1rem;
  }
`;

type RoomCardProps = {
  room: Room;
  // вікно в минулому забронювати не можна, тож "Недоступно" в бейджі замість зайнята
  past?: boolean;
  onSelect?: () => void;
};

function RoomCard({ room, past = false, onSelect }: RoomCardProps) {
  const badge = past
    ? { status: 'unavailable' as const, label: 'Недоступно' }
    : room.available
      ? { status: 'free' as const, label: 'Вільна' }
      : { status: 'busy' as const, label: 'Зайнята' };

  return (
    <Card onClick={onSelect}>
      <ImageWrap>
        <Image src={room.imageUrl} alt={room.name} loading="lazy" />
      </ImageWrap>
      {room.available !== undefined && (
        <BadgeWrap>
          <Badge status={badge.status}>{badge.label}</Badge>
        </BadgeWrap>
      )}
      <Footer>
        <Name>{room.name}</Name>
        <Meta>
          <Stat>
            {room.capacity}
            <UserIcon />
          </Stat>
          <Stat>
            {room.floor}
            <StairsIcon />
          </Stat>
        </Meta>
      </Footer>
    </Card>
  );
}

export default RoomCard;
