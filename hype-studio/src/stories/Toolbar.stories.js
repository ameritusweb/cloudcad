import { fn } from '@storybook/test';
import { Toolbar } from '../components/Toolbar';

export default {
  title: 'Components/Toolbar',
  component: Toolbar,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    activeView: {
      control: 'select',
      options: ['List View', 'Sketch View', 'Extrude View', 'Import/Export View', 'Fillet/Chamfer View', 'Dimension Tool View'],
    },
  },
  args: { onItemClick: fn() },
};

export const Default = {
  args: {
    activeView: 'List View',
  },
};

export const SketchViewActive = {
  args: {
    activeView: 'Sketch View',
  },
};