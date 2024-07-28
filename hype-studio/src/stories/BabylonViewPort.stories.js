import { fn } from '@storybook/test';
import { BabylonViewport } from '../components/BabylonViewport';

export default {
  title: 'Components/BabylonViewport',
  component: BabylonViewport,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
  argTypes: {
    controlMode: {
      control: 'select',
      options: ['zoom', 'pan', 'rotate'],
    },
  },
  args: { onViewChange: fn() },
};

export const Default = {
  args: {
    controlMode: 'rotate',
  },
};

export const ZoomMode = {
  args: {
    controlMode: 'zoom',
  },
};

export const PanMode = {
  args: {
    controlMode: 'pan',
  },
};