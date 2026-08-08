import { Outlet } from 'react-router-dom';
import styled from 'styled-components';

import { useEndReminder } from '../lib/useEndReminder';
import { useRealtimeConnection } from '../lib/useRealtime';
import MobileNav from './MobileNav';
import Sidebar from './Sidebar';

const Container = styled.div`
  display: flex;
  min-height: 100dvh;
  background-color: var(--primary-grey);
`;

const Main = styled.main`
  flex: 1;
  min-width: 0;
`;

function AppLayout() {
  useRealtimeConnection();
  useEndReminder();

  return (
    <Container>
      <Sidebar />
      <Main>
        <MobileNav />
        <Outlet />
      </Main>
    </Container>
  );
}

export default AppLayout;
