import { useState } from 'react';
import styled from 'styled-components';

import Logo from '../assets/Logo.svg?react';
import CloseIcon from '../assets/icons/Close_SM.svg?react';
import HamburgerIcon from '../assets/icons/Hamburger_MD.svg?react';
import { media } from '../styles/media';
import { text } from '../styles/typography';
import SidebarContent from './SidebarContent';
import Sheet from './ui/Sheet';

const Bar = styled.header`
  display: none;

  ${media.phone} {
    position: sticky;
    top: 0;
    z-index: 100;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
    padding: 0.75rem 1rem;
    background-color: var(--primary-grey);
  }
`;

const Brand = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const BrandName = styled.span`
  ${text.h4};
  color: var(--primary-black);
`;

const IconButton = styled.button`
  display: inline-flex;
  padding: 0.25rem;
  border: none;
  background: none;
  color: var(--primary-black);
  cursor: pointer;

  svg {
    width: 1.5rem;
    height: 1.5rem;
  }
`;

const DrawerHeader = styled.div`
  display: flex;
  justify-content: flex-end;
`;

function MobileNav() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Bar>
        <Brand>
          <Logo width={30} height={30} />
          <BrandName>Простір</BrandName>
        </Brand>
        <IconButton type="button" onClick={() => setOpen(true)} aria-label="Меню">
          <HamburgerIcon />
        </IconButton>
      </Bar>

      <Sheet
        open={open}
        onClose={() => setOpen(false)}
        side="left"
        width="min(17rem, 82%)"
        background="var(--primary-grey)"
        padding="1.5rem 1rem"
        label="Навігація"
      >
        <DrawerHeader>
          <IconButton type="button" onClick={() => setOpen(false)} aria-label="Закрити">
            <CloseIcon />
          </IconButton>
        </DrawerHeader>
        <SidebarContent onNavigate={() => setOpen(false)} />
      </Sheet>
    </>
  );
}

export default MobileNav;
