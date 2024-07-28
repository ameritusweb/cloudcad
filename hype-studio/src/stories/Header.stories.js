import { fn } from '@storybook/test';
import { Header } from '../components/Header';

export default {
  title: 'Components/Header',
  component: Header,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    projectName: { control: 'text' },
    dimensions: { control: 'text' },
  },
  args: { onMenuClick: fn() },
};

export const Default = {
  args: {
    projectName: 'My Project',
    dimensions: '20mm x 40mm x 60mm',
  },
};

export const LongProjectName = {
  args: {
    projectName: 'Very Long Project Name That Might Overflow',
    dimensions: '20mm x 40mm x 60mm',
  },
};