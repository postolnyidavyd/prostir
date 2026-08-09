import { css } from 'styled-components';

import { media } from './media';

// Всі стилі тексту з Figma

export const text = {
  h1: css`
    font-family: 'e-Ukraine', sans-serif;
    font-size: var(--desktop-headings-h1);
    font-weight: 400;
    line-height: 3.75rem;
    letter-spacing: -0.07rem;

    ${media.phone} {
      font-size: var(--mobile-headings-h1);
      line-height: 1.75rem;
      letter-spacing: 0;
    }
  `,
  h3: css`
    font-family: 'e-Ukraine', sans-serif;
    font-size: var(--desktop-headings-h3);
    font-weight: 400;
    line-height: 2rem;
    letter-spacing: -0.035rem;

    ${media.phone} {
      font-size: var(--mobile-headings-h3);
      line-height: 1.5rem;
      letter-spacing: 0;
    }
  `,
  h4: css`
    font-family: 'e-Ukraine', sans-serif;
    font-size: var(--desktop-headings-h4);
    font-weight: 400;
    line-height: 1.75rem;
    letter-spacing: -0.03rem;

    ${media.phone} {
      font-size: var(--mobile-headings-h4);
      line-height: 1.5rem;
      letter-spacing: 0;
    }
  `,
  h5: css`
    font-family: 'e-Ukraine', sans-serif;
    font-size: var(--desktop-headings-h5);
    font-weight: 400;
    line-height: 1.5rem;
    letter-spacing: -0.025rem;

    ${media.phone} {
      font-size: var(--mobile-headings-h5);
      line-height: 1.25rem;
      letter-spacing: 0;
    }
  `,
  h6: css`
    font-family: 'e-Ukraine', sans-serif;
    font-size: var(--desktop-headings-h6);
    font-weight: 400;
    line-height: 1.75rem;
    letter-spacing: -0.0225rem;

    ${media.phone} {
      font-size: var(--mobile-headings-h6);
      line-height: 1.125rem;
      letter-spacing: 0;
    }
  `,
  h7: css`
    font-family: 'e-Ukraine', sans-serif;
    font-size: var(--desktop-headings-h7);
    font-weight: 400;
    line-height: 1.5rem;
    letter-spacing: -0.02rem;

    ${media.phone} {
      font-size: var(--mobile-headings-h7);
      line-height: 1.125rem;
      letter-spacing: 0;
    }
  `,
  h8: css`
    font-family: 'e-Ukraine', sans-serif;
    font-size: var(--desktop-headings-h8);
    font-weight: 400;
    line-height: 1rem;
    letter-spacing: -0.02rem;
  `,
  body: css`
    font-family: 'e-Ukraine', sans-serif;
    font-size: var(--desktop-base-body);
    font-weight: 300;
    line-height: 1.5rem;
    letter-spacing: -0.02rem;

    ${media.phone} {
      font-size: var(--mobile-base-body);
      font-weight: 400;
      line-height: 0.875rem;
      letter-spacing: 0;
    }
  `,
  small: css`
    font-family: 'e-Ukraine', sans-serif;
    font-size: var(--desktop-base-small);
    font-weight: 300;
    line-height: 1.125rem;
    letter-spacing: 0;

    ${media.phone} {
      font-size: var(--mobile-base-small);
      font-weight: 400;
      line-height: 0.875rem;
    }
  `,
  tiny: css`
    font-family: 'e-Ukraine', sans-serif;
    font-size: var(--desktop-base-tiny);
    font-weight: 300;
    line-height: 1rem;
    letter-spacing: 0;
  `,
} as const;
