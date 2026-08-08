import type { ReactNode } from 'react';
import styled from 'styled-components';

import CloseIcon from '../../assets/icons/Close_SM.svg?react';
import { media } from '../../styles/media';
import { text } from '../../styles/typography';
import Button from './Button';
import Modal from './Modal';

const Card = styled.div`
  width: min(28.3125rem, calc(100vw - 3rem));
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2rem;
  padding: 2rem;
  background-color: var(--base-white);
  border: 1px solid var(--base-bright-grey);
  border-radius: 1.25rem;
  box-shadow: var(--shadow);

  ${media.phone} {
    gap: 1.5rem;
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
  width: 5rem;
  height: 5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 1.5rem;
  background-color: var(--brick-red-20);
  color: var(--brick-red-100);

  svg {
    width: 2.333rem;
    height: 2.333rem;
  }
`;

const Title = styled.h2`
  ${text.h4};
  color: var(--primary-black);
  text-align: center;
`;

const Description = styled.p`
  ${text.body};
  color: var(--secondary-text);
  text-align: center;
`;

const Actions = styled.div`
  display: grid;
  grid-template-columns: 1.5fr 2fr;
  gap: 0.25rem;
  width: 100%;

  ${media.phone} {
    grid-template-columns: 1fr;
    gap: 0.5rem;
  }
`;

type ConfirmDialogProps = {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  icon: ReactNode;
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel?: string;
  loading?: boolean;
};

function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  icon,
  title,
  description,
  confirmLabel,
  cancelLabel = 'Назад',
  loading = false,
}: ConfirmDialogProps) {
  return (
    <Modal open={open} onClose={onClose} label={title}>
      <Card>
        <CloseRow>
          <CloseButton type="button" onClick={onClose} aria-label="Закрити">
            <CloseIcon />
          </CloseButton>
        </CloseRow>
        <IconBox>{icon}</IconBox>
        <Title>{title}</Title>
        <Description>{description}</Description>
        <Actions>
          <Button variant="secondary" fullWidth onClick={onClose}>
            {cancelLabel}
          </Button>
          <Button variant="danger" fullWidth isLoading={loading} onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </Actions>
      </Card>
    </Modal>
  );
}

export default ConfirmDialog;
