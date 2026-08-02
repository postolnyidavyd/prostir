import { useId, useState, type InputHTMLAttributes, type Ref } from 'react';
import styled from 'styled-components';

import HideIcon from '../../assets/icons/Hide.svg?react';
import ShowIcon from '../../assets/icons/Show.svg?react';

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
  width: 100%;
`;

const Field = styled.div`
  position: relative;
  width: 100%;
`;

const StyledInput = styled.input<{ $error: boolean; $hasToggle: boolean }>`
  width: 100%;
  height: 56px;
  padding: 0 ${({ $hasToggle }) => ($hasToggle ? '3rem' : '1rem')} 0 1rem;
  font-size: 16px;
  letter-spacing: -0.32px;
  color: var(--primary-black);
  background-color: var(--base-white);
  border: 1.5px solid
    ${({ $error }) => ($error ? 'var(--brick-red-100)' : 'var(--base-bright-grey)')};
  border-radius: 14px;
  outline: none;
  transition: border-color 0.2s ease;

  &::placeholder {
    color: transparent;
  }

  &:-webkit-autofill {
    -webkit-box-shadow: 0 0 0 1000px var(--base-white) inset;
    -webkit-text-fill-color: var(--primary-black);
  }

  &:focus {
    border-color: ${({ $error }) =>
      $error ? 'var(--brick-red-100)' : 'var(--accent-color-intense)'};
  }

  &:disabled {
    background-color: var(--primary-grey);
    color: var(--grey-60);
    cursor: not-allowed;
  }
`;

const Label = styled.label<{ $error: boolean }>`
  position: absolute;
  left: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  padding: 0 0.25rem;
  background-color: var(--base-white);
  font-size: 16px;
  letter-spacing: -0.32px;
  color: ${({ $error }) => ($error ? 'var(--brick-red-100)' : 'var(--grey-100)')};
  pointer-events: none;
  transition: all 0.18s ease-out;

  /* спливає на межу при фокусі, заповненні або автозаповнені */
  ${StyledInput}:focus ~ &,
  ${StyledInput}:not(:placeholder-shown) ~ &,
  ${StyledInput}:-webkit-autofill ~ & {
    top: 0;
    font-size: 12px;
  }

  ${StyledInput}:focus ~ & {
    color: ${({ $error }) => ($error ? 'var(--brick-red-100)' : 'var(--accent-color-intense)')};
  }
`;

const ToggleButton = styled.button`
  position: absolute;
  right: 0.5rem;
  top: 50%;
  transform: translateY(-50%);
  display: inline-flex;
  padding: 0.5rem;
  border: none;
  background: none;
  color: var(--grey-100);
  cursor: pointer;
  transition: color 0.2s ease;

  &:hover {
    color: var(--primary-black);
  }
`;

const ErrorText = styled.p`
  font-size: var(--desktop-base-small);
  color: var(--brick-red-100);
`;

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string | undefined;
  ref?: Ref<HTMLInputElement>;
};

function Input({ label, id, error, type, ref, ...props }: InputProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;

  const [revealed, setRevealed] = useState(false);
  const isPassword = type === 'password';
  const resolvedType = isPassword && revealed ? 'text' : type;

  return (
    <Wrapper>
      <Field>
        <StyledInput
          id={inputId}
          ref={ref}
          type={resolvedType}
          placeholder=" "
          $error={!!error}
          $hasToggle={isPassword}
          {...props}
        />
        <Label htmlFor={inputId} $error={!!error}>
          {label}
        </Label>
        {isPassword && (
          <ToggleButton
            type="button"
            onClick={() => setRevealed((prev) => !prev)}
            aria-label={revealed ? 'Сховати пароль' : 'Показати пароль'}
            tabIndex={-1}
          >
            {revealed ? <HideIcon /> : <ShowIcon />}
          </ToggleButton>
        )}
      </Field>
      {error && <ErrorText>{error}</ErrorText>}
    </Wrapper>
  );
}

export default Input;
