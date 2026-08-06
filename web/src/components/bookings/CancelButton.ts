import styled from 'styled-components';

export const CancelButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 2.5rem;
  padding: 0 1.3125rem;
  border: 1px solid #f9e6ea;
  border-radius: 0.75rem;
  background-color: var(--base-white);
  font-family: 'e-Ukraine', sans-serif;
  font-size: 0.8125rem;
  letter-spacing: -0.26px;
  color: var(--brick-red-100);
  cursor: pointer;
  white-space: nowrap;
  transition: background-color 0.15s ease;

  &:hover {
    background-color: var(--brick-red-20);
  }
`;
