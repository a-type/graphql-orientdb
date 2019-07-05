import { GraphQLType, isObjectType } from 'graphql';
import { valueNodeToValue } from 'utils/graphql';

export const hasDirective = (
  parentType: GraphQLType,
  fieldName: string,
  directiveName: string
) => {
  const directives = getFieldDirectives(parentType, fieldName);

  return directives.some(({ name }) => name.value === directiveName);
};

export const getDirectiveArgs = (
  parentType: GraphQLType,
  fieldName: string,
  directiveName: string,
  variableValues: { [name: string]: any }
) => {
  const directives = getFieldDirectives(parentType, fieldName);

  const directive = directives.find(({ name }) => name.value === directiveName);

  if (!directive || !directive.arguments) {
    return {};
  }

  return directive.arguments.reduce(
    (args, arg) => ({
      ...args,
      [arg.name.value]: valueNodeToValue(arg.value, variableValues),
    }),
    {}
  );
};

export const getFieldDirectives = (
  parentType: GraphQLType,
  fieldName: string
) => {
  if (!isObjectType(parentType)) {
    throw new Error(
      `Cannot traverse field "${fieldName}" on non-object type "${parentType}"`
    );
  }

  const field = parentType.getFields()[fieldName];

  if (!field) {
    throw new Error(
      `Field "${fieldName}" does not exist on type "${parentType.name}"`
    );
  }

  if (!field.astNode) {
    throw new Error(
      `Field "${parentType.name}.${field}" doesn't have an AST node`
    );
  }

  return field.astNode.directives || [];
};
