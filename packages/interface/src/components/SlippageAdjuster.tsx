import { useState } from 'react';

import { Slider } from '@/components/ui/slider';

const SlippageAdjuster = () => {
  const [slippage, setSlippage] = useState(0.5);

  return (
    <div className="flex items-center space-x-2">
      <span className="text-sm">Slippage: {slippage}%</span>
      <Slider
        value={[slippage]}
        onValueChange={(value) => setSlippage(value[0])}
        min={0}
        max={5}
        step={0.1}
      />
    </div>
  );
};

export default SlippageAdjuster;
