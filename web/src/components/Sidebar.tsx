import { NavLink } from 'react-router-dom';
import styled from 'styled-components';

import Logo from '../assets/Logo.svg?react';
import CalendarIcon from '../assets/icons/Calendar_Days.svg?react';
import ListIcon from '../assets/icons/List_Unordered.svg?react';
import UserIcon from '../assets/icons/User_03.svg?react';
import { selectCurrentUser } from '../store/authSlice';
import { useAppSelector } from '../store/hooks';
import { text } from '../styles/typography';
import Avatar from './ui/Avatar';

const Aside = styled.aside`
  flex-shrink: 0;
  width: 13.4375rem;
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 2rem 0.25rem 2rem 0.5rem;
  background-color: var(--primary-grey);
`;

const Top = styled.div`
  display: flex;
  flex-direction: column;
  gap: 3.75rem;
`;

const Brand = styled.div`
  display: flex;
  align-items: flex-end;
  gap: 0.5rem;
  height: 2.25rem;
`;

const BrandName = styled.span`
  ${text.h3};
  color: var(--primary-black);
`;

const Nav = styled.nav`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const Link = styled(NavLink)`
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.625rem 0.25rem;
  border-radius: 0.625rem;
  ${text.h7};
  color: var(--primary-black);
  text-decoration: none;
  transition: background-color 0.15s ease;

  svg {
    flex-shrink: 0;
    width: 1.5rem;
    height: 1.5rem;
  }

  &.active {
    background-color: var(--accent-color);
  }

  &:hover:not(.active) {
    background-color: var(--base-bright-grey);
  }
`;

const User = styled.div`
  display: flex;
  align-items: center;
  gap: 0.625rem;
`;

const UserName = styled.span`
  ${text.small};
  color: var(--primary-black);
`;

function Sidebar() {
  const user = useAppSelector(selectCurrentUser);
  const fullName = user ? `${user.lastName} ${user.firstName}` : '';
  const initials = user
    ? `${user.lastName.charAt(0)}${user.firstName.charAt(0)}`.toUpperCase()
    : '';

  return (
    <Aside>
      <Top>
        <Brand>
          <Logo width={36} height={36} />
          <BrandName>Простір</BrandName>
        </Brand>
        <Nav>
          <Link to="/" end>
            <CalendarIcon />
            <span>Бронювання</span>
          </Link>
          <Link to="/my-bookings">
            <ListIcon />
            <span>Мої бронювання</span>
          </Link>
          <Link to="/profile">
            <UserIcon />
            <span>Мій профіль</span>
          </Link>
        </Nav>
      </Top>
      <User>
        <Avatar initials={initials} />
        <UserName>{fullName}</UserName>
      </User>
    </Aside>
  );
}

export default Sidebar;
