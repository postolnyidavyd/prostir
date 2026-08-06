import styled from 'styled-components';

const Track = styled.button<{ $on: boolean }>`
  flex-shrink: 0;
  width: 2.25rem;
  height: 1.25rem;
  padding: 0.125rem;
  border: none;
  border-radius: 1.5rem;
  background-color: ${({ $on }) => ($on ? 'var(--base-black)' : 'var(--base-bright-grey)')};
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  transition: background-color 0.2s ease;
`;

const Knob = styled.span<{ $on: boolean }>`
  width: 1rem;
  height: 1rem;
  border-radius: 50%;
  background-color: var(--base-white);
  box-shadow: var(--shadow-sm);
  transition: transform 0.2s ease;
  transform: translateX(${({ $on }) => ($on ? '1rem' : '0')});
`;

type SwitchProps = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  id?: string;
  'aria-label'?: string;
};

function Switch({ checked, onChange, id, 'aria-label': ariaLabel }: SwitchProps) {
  return (
    <Track
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      id={id}
      $on={checked}
      onClick={() => onChange(!checked)}
    >
      <Knob $on={checked} />
    </Track>
  );
}

export default Switch;
