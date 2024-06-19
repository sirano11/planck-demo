import { Box, BoxProps } from '@chakra-ui/react';
import React from 'react';

import { panelCard } from '@/raydium/theme/cssBlocks';

interface PanelCardProps extends BoxProps {
  variant?: 'light' | 'dark';
}

const PanelCard = React.forwardRef<HTMLDivElement, PanelCardProps>(
  (props, ref) => {
    return (
      <Box
        ref={ref}
        {...panelCard}
        display="flex"
        flexDir="column"
        {...props}
      />
    );
  },
);

PanelCard.displayName = 'PanelCard';

/** @deprecated just use block:{@link panelCard} */
export default PanelCard;
