import { LeftPanel } from './LeftPanel';

export default {
  title: 'Components/LeftPanel',
  component: LeftPanel,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    content: { control: 'array' },
  },
};

export const Default = {
  args: {
    content: ['Sketch1', 'Sketch2', 'Fillet1', 'Sketch3'],
  },
};

export const EmptyPanel = {
  args: {
    content: [],
  },
};

export const LongList = {
  args: {
    content: Array.from({ length: 20 }, (_, i) => `Item ${i + 1}`),
  },
};