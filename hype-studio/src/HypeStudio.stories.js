import React from 'react';
import { HypeStudio } from './HypeStudio';
import { handlers } from './mocks/handlers';

export default {
  title: 'HypeStudio',
  component: HypeStudio,
  parameters: {
    msw: {
      handlers: handlers,
    },
  },
};

const Template = (args) => <HypeStudio {...args} />;

export const Default = Template.bind({});
Default.args = {};