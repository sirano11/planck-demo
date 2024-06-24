import { BoxProps } from '@chakra-ui/react';
import { SVGProps } from 'react';

export type SvgIcon = SVGProps<SVGSVGElement> &
  BoxProps &
  Omit<React.SVGProps<SVGElement>, keyof BoxProps>;
