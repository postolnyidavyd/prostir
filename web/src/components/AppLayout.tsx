import { Outlet } from 'react-router-dom';
import styled from 'styled-components';

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
  return (
    <Container>
      <Sidebar />
      <Main>
        <Outlet />
      </Main>
    </Container>
  );
}

export default AppLayout;
