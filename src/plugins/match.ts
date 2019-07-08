import { Plugin } from '../types';

const buildStatement = (directiveArgs: { [name: string]: any }) => {
  const { statement } = directiveArgs;

  return statement;
};

export const match: Plugin = {
  directiveName: 'match',
  buildStatement,
};
