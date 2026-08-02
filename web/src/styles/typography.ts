import { css } from 'styled-components';

// Всі стилі тексту з Figma

export const text = {
  h1: css`
    font-family: 'e-Ukraine', sans-serif;
    font-size: var(--desktop-headings-h1);
    font-weight: 400;
    line-height: 3.75rem;
    letter-spacing: -0.07rem;
  `,
  h3: css`
    font-family: 'e-Ukraine', sans-serif;
    font-size: var(--desktop-headings-h3);
    font-weight: 400;
    line-height: 2rem;
    letter-spacing: -0.035rem;
  `,
  h5: css`
    font-family: 'e-Ukraine', sans-serif;
    font-size: var(--desktop-headings-h5);
    font-weight: 400;
    line-height: 1.5rem;
    letter-spacing: -0.025rem;
  `,
  h6: css`
    font-family: 'e-Ukraine', sans-serif;
    font-size: var(--desktop-headings-h6);
    font-weight: 400;
    line-height: 1.75rem;
    letter-spacing: -0.0225rem;
  `,
  h7: css`
    font-family: 'e-Ukraine', sans-serif;
    font-size: var(--desktop-headings-h7);
    font-weight: 400;
    line-height: 1.5rem;
    letter-spacing: -0.02rem;
  `,
  body: css`
    font-family: 'e-Ukraine', sans-serif;
    font-size: var(--desktop-base-body);
    font-weight: 300;
    line-height: 1.5rem;
    letter-spacing: -0.02rem;
  `,
  small: css`
    font-family: 'e-Ukraine', sans-serif;
    font-size: var(--desktop-base-small);
    font-weight: 300;
    line-height: 1.125rem;
    letter-spacing: 0;
  `,
  tiny: css`
    font-family: 'e-Ukraine', sans-serif;
    font-size: var(--desktop-base-tiny);
    font-weight: 300;
    line-height: 1rem;
    letter-spacing: 0;
  `,
} as const;
