import styled from 'styled-components';

import type { Room } from '../../store/api/roomsApi';
import { text } from '../../styles/typography';

const Tabs = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 1.0625rem;
`;

const Tab = styled.button<{ $active: boolean }>`
  padding: 0.625rem;
  border-radius: 0.625rem;
  ${text.h8};
  color: var(--primary-black);
  cursor: pointer;
  border: 2px solid
    ${({ $active }) => ($active ? 'var(--accent-color-border-hover)' : 'var(--base-bright-grey)')};
  background-color: ${({ $active }) => ($active ? 'var(--accent-color)' : 'var(--base-white)')};
  transition:
    background-color 0.15s ease,
    border-color 0.15s ease;

  &:hover {
    border-color: var(--accent-color-border-hover);
  }
`;

type RoomTabsProps = {
  rooms: Room[];
  activeId: string;
  onSelect: (id: string) => void;
};

function RoomTabs({ rooms, activeId, onSelect }: RoomTabsProps) {
  return (
    <Tabs role="tablist">
      {rooms.map((room) => (
        <Tab
          key={room.id}
          type="button"
          role="tab"
          aria-selected={room.id === activeId}
          $active={room.id === activeId}
          onClick={() => onSelect(room.id)}
        >
          {room.name}
        </Tab>
      ))}
    </Tabs>
  );
}

export default RoomTabs;
