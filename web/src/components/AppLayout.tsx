import { Outlet } from 'react-router-dom';
import styled from 'styled-components';

import { useEndReminder } from '../lib/useEndReminder';
import { useRealtimeConnection } from '../lib/useRealtime';
import MobileNav from './MobileNav';
import Sidebar from './Sidebar';
import VerifyEmailBanner from './VerifyEmailBanner';

const Shell = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 100dvh;
  background-color: var(--primary-grey);
`;

const Row = styled.div`
  display: flex;
  flex: 1;
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
    <Shell>
      <VerifyEmailBanner />
      <Row>
        <Sidebar />
        <Main>
          <MobileNav />
          <Outlet />
        </Main>
      </Row>
    </Shell>
  );
}

export default AppLayout;
