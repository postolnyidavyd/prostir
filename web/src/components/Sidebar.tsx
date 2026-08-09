import styled from 'styled-components';

import { media } from '../styles/media';
import SidebarContent from './SidebarContent';

const Aside = styled.aside`
  flex-shrink: 0;
  width: 13.4375rem;
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
  padding: 2rem 0.25rem 2rem 0.5rem;
  background-color: var(--primary-grey);

  ${media.phone} {
    display: none;
  }
`;

function Sidebar() {
  return (
    <Aside>
      <SidebarContent />
    </Aside>
  );
}

export default Sidebar;
