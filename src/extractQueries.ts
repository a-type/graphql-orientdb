import { QueryFieldMap, DBQuery, DBQueryParams, Plugin } from './types';
import {
  GraphQLResolveInfo,
  FieldNode,
  GraphQLObjectType,
  GraphQLSchema,
} from 'graphql';
import { IGNORED_FIELD_NAMES } from './constants';
import { hasDirective, getDirectiveArgs } from './utils/directives';
import { getFieldDef } from 'graphql/execution/execute';
import { getArgumentsPlusDefaults } from './utils/graphql';

export const extractQueriesFromOperation = (
  { fieldNodes, parentType, schema, variableValues }: GraphQLResolveInfo,
  plugins: Plugin[]
): QueryFieldMap =>
  fieldNodes.reduce(
    (queries: QueryFieldMap, field) =>
      extractQueriesFromField({
        queries,
        field,
        parentType,
        parentQuery: undefined,
        schema,
        variableValues,
        plugins,
      }),
    {}
  );

const extractQueriesFromField = ({
  queries,
  field,
  parentType,
  parentQuery,
  schema,
  variableValues,
  plugins,
}: {
  queries: QueryFieldMap;
  field: FieldNode;
  parentType: GraphQLObjectType;
  parentQuery: DBQuery | undefined;
  schema: GraphQLSchema;
  variableValues: { [name: string]: any };
  plugins: Plugin[];
}): QueryFieldMap => {
  const fieldName = field.name.value;

  if (IGNORED_FIELD_NAMES.includes(fieldName)) {
    return queries;
  }

  const skip = hasDirective(parentType, fieldName, 'skip');

  if (parentQuery && !skip) {
    parentQuery.fields.push(fieldName);
  }

  const schemaFieldDef = getFieldDef(schema, parentType, fieldName);
  if (!schemaFieldDef) {
    throw new Error(
      `Invalid state: there's no field definition for field "${fieldName}" on type "${parentType.name}"`
    );
  }

  let currentQuery: DBQuery | undefined = undefined;

  if (!skip) {
    const matchingPlugin = plugins.find(({ directiveName }) =>
      hasDirective(parentType, fieldName, directiveName)
    );

    if (matchingPlugin) {
      const directiveArgs = getDirectiveArgs(
        parentType,
        fieldName,
        matchingPlugin.directiveName,
        variableValues
      );

      const argValues = getArgumentsPlusDefaults(
        parentType.name,
        field,
        schema,
        variableValues
      );

      const paramNames: string[] = [];
      const params: DBQueryParams = {};
    }
  }
};
