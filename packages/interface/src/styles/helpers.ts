// https://github.com/junhoyeo/junho.io-v2/blob/main/web/utils/css.ts
import { SerializedStyles, css } from '@emotion/react';

export const fixedWidth = (width: number): SerializedStyles => css`
  width: ${width}px;
  max-width: ${width}px;
  min-width: ${width}px;
`;

export const fixedHeight = (height: number): SerializedStyles => css`
  height: ${height}px;
  max-height: ${height}px;
  min-height: ${height}px;
`;
