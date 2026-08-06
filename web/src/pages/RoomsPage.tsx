import { useSearchParams } from 'react-router-dom';

import RoomList from '../components/rooms/RoomList';
import RoomSchedule from '../components/rooms/RoomSchedule';

function RoomsPage() {
  const [searchParams] = useSearchParams();
  const roomId = searchParams.get('room');

  return roomId ? <RoomSchedule roomId={roomId} /> : <RoomList />;
}

export default RoomsPage;
