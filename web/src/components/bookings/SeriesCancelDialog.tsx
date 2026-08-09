import { useState, type ReactNode } from 'react';
import styled from 'styled-components';

import CloseIcon from '../../assets/icons/Close_SM.svg?react';
import { media } from '../../styles/media';
import { text } from '../../styles/typography';
import Button from '../ui/Button';
import Modal from '../ui/Modal';

export type CancelScope = 'one' | 'series';

const Card = styled.div`
  width: min(28.3125rem, calc(100vw - 3rem));
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
  padding: 2rem;
  background-color: var(--base-white);
  border: 1px solid var(--base-bright-grey);
  border-radius: 1.25rem;
  box-shadow: var(--shadow);

  ${media.phone} {
    gap: 1.25rem;
    padding: 1.5rem;
  }
`;

const CloseRow = styled.div`
  display: flex;
  justify-content: flex-end;
  width: 100%;
`;

const CloseButton = styled.button`
  display: inline-flex;
  padding: 0;
  border: none;
  background: none;
  color: var(--primary-black);
  cursor: pointer;

  svg {
    width: 1.5rem;
    height: 1.5rem;
  }
`;

const IconBox = styled.div`
  width: 3.25rem;
  height: 3.25rem;
  display: grid;
  place-items: center;
  border-radius: 1rem;
  background-color: var(--brick-red-20);
  color: var(--brick-red-100);

  svg {
    width: 1.625rem;
    height: 1.625rem;
  }
`;

const Title = styled.h2`
  ${text.h5};
  color: var(--primary-black);
  text-align: center;
`;

const Description = styled.p`
  ${text.small};
  color: var(--secondary-text);
  text-align: center;
`;

const Options = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.625rem;
  width: 100%;
`;

const Option = styled.button<{ $selected: boolean }>`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.875rem 1rem;
  border: 1.5px solid
    ${({ $selected }) => ($selected ? 'var(--accent-color-deep)' : 'var(--base-bright-grey)')};
  border-radius: 0.875rem;
  background-color: ${({ $selected }) => ($selected ? 'var(--accent-color)' : 'var(--base-white)')};
  cursor: pointer;
  text-align: left;
  transition:
    border-color 0.15s ease,
    background-color 0.15s ease;

  &:hover {
    border-color: var(--accent-color-deep);
  }
`;

const Radio = styled.span<{ $selected: boolean }>`
  flex: none;
  width: 1.125rem;
  height: 1.125rem;
  display: grid;
  place-items: center;
  border-radius: 50%;
  border: 2px solid
    ${({ $selected }) => ($selected ? 'var(--accent-color-deep)' : 'var(--base-bright-grey)')};
  transition: border-color 0.15s ease;

  &::after {
    content: '';
    width: 0.5rem;
    height: 0.5rem;
    border-radius: 50%;
    background-color: var(--accent-color-deep);
    opacity: ${({ $selected }) => ($selected ? 1 : 0)};
    transform: scale(${({ $selected }) => ($selected ? 1 : 0.4)});
    transition:
      opacity 0.15s ease,
      transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
  }

  @media (prefers-reduced-motion: reduce) {
    &::after {
      transition: none;
    }
  }
`;

const OptionText = styled.span`
  ${text.body};
  color: var(--primary-black);
`;

const Actions = styled.div`
  display: grid;
  grid-template-columns: 1.5fr 2fr;
  gap: 0.5rem;
  width: 100%;

  ${media.phone} {
    grid-template-columns: 1fr;
  }
`;

type SeriesCancelDialogProps = {
  open: boolean;
  onClose: () => void;
  onConfirm: (scope: CancelScope) => void;
  icon: ReactNode;
  description?: string;
  upcomingCount?: number;
  loading?: boolean;
};

function SeriesCancelDialog({
  open,
  onClose,
  onConfirm,
  icon,
  description,
  upcomingCount,
  loading = false,
}: SeriesCancelDialogProps) {
  const [scope, setScope] = useState<CancelScope>('one');

  return (
    <Modal open={open} onClose={onClose} label="Скасувати повторюване бронювання?">
      <Card>
        <CloseRow>
          <CloseButton type="button" onClick={onClose} aria-label="Закрити">
            <CloseIcon />
          </CloseButton>
        </CloseRow>
        <IconBox>{icon}</IconBox>
        <Title>Скасувати повторюване?</Title>
        {description && <Description>{description}</Description>}

        <Options role="radiogroup">
          <Option
            type="button"
            role="radio"
            aria-checked={scope === 'one'}
            $selected={scope === 'one'}
            onClick={() => setScope('one')}
          >
            <Radio $selected={scope === 'one'} />
            <OptionText>Лише це бронювання</OptionText>
          </Option>
          <Option
            type="button"
            role="radio"
            aria-checked={scope === 'series'}
            $selected={scope === 'series'}
            onClick={() => setScope('series')}
          >
            <Radio $selected={scope === 'series'} />
            <OptionText>Усю серію{upcomingCount != null ? ` (${upcomingCount})` : ''}</OptionText>
          </Option>
        </Options>

        <Actions>
          <Button variant="secondary" fullWidth onClick={onClose}>
            Назад
          </Button>
          <Button variant="danger" fullWidth isLoading={loading} onClick={() => onConfirm(scope)}>
            Так, скасувати
          </Button>
        </Actions>
      </Card>
    </Modal>
  );
}

export default SeriesCancelDialog;
