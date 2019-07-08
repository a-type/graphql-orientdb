import { QueryFieldMap, DBQuery, DBQueryParams, Plugin } from './types';
import {
  GraphQLResolveInfo,
  FieldNode,
  GraphQLObjectType,
  GraphQLSchema,
  SelectionSetNode,
  FragmentDefinitionNode,
} from 'graphql';
import { IGNORED_FIELD_NAMES } from './constants';
import { hasDirective, getDirectiveArgs } from './utils/directives';
import { getFieldDef } from 'graphql/execution/execute';
import { getNameOrAlias, extractObjectType } from './utils/graphql';
import {
  getArgumentsPlusDefaults,
  isListOrWrappedListType,
} from './utils/graphql';

type CommonExtractionParams = {
  queries: QueryFieldMap;
  schema: GraphQLSchema;
  fragments: { [key: string]: FragmentDefinitionNode };
  parentQuery: DBQuery | undefined;
  variableValues: { [name: string]: any };
  parentType: GraphQLObjectType;
  path: string[];
  plugins: Plugin[];
};

export const extractQueriesFromOperation = (
  {
    fieldNodes,
    parentType,
    schema,
    variableValues,
    fragments,
  }: GraphQLResolveInfo,
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
        path: [getNameOrAlias(field)],
        fragments,
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
  path,
  fragments,
  ...rest
}: CommonExtractionParams & {
  field: FieldNode;
}): QueryFieldMap => {
  const fieldName = field.name.value;

  if (IGNORED_FIELD_NAMES.includes(fieldName)) {
    return queries;
  }

  const skip = hasDirective(parentType, fieldName, 'skip');

  if (parentQuery && !skip) {
    parentQuery.fieldNames.push(fieldName);
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

      if (Object.keys(argValues).length) {
        paramNames.push('args');
        params.args = argValues;
      }

      currentQuery = {
        returnsList: isListOrWrappedListType(schemaFieldDef.type),
        plugin: matchingPlugin,
        directiveArgs,
        paramNames,
        params,
        fieldNames: [],
        fieldQueries: {},
      };

      if (parentQuery) {
        parentQuery.fieldQueries[fieldName] = currentQuery;
      } else {
        queries[path.join(',')] = currentQuery;
      }
    }
  }

  if (!field.selectionSet) {
    return queries;
  }

  const currentTypeAsObjectType = extractObjectType(schemaFieldDef.type);

  if (!currentTypeAsObjectType) {
    return queries;
  }

  return extractQueriesFromSelectionSet({
    selectionSet: field.selectionSet,
    queries,
    parentQuery,
    parentType: currentTypeAsObjectType,
    variableValues,
    schema,
    path,
    fragments,
    plugins,
    ...rest,
  });
};

const extractQueriesFromSelectionSet = ({
  selectionSet,
  queries,
  path,
  ...rest
}: CommonExtractionParams & {
  selectionSet: SelectionSetNode;
}): QueryFieldMap =>
  selectionSet.selections.reduce((reducedQueries, selection) => {
    if (selection.kind === 'Field') {
      return extractQueriesFromField({
        queries: reducedQueries,
        field: selection,
        path: [...path, getNameOrAlias(selection)],
        ...rest,
      });
    } else if (selection.kind === 'InlineFragment') {
      return extractQueriesFromSelectionSet({
        selectionSet: selection.selectionSet,
        queries: reducedQueries,
        path,
        ...rest,
      });
    } else {
      const fragment = rest.fragments[selection.name.value];
      return extractQueriesFromSelectionSet({
        selectionSet: fragment.selectionSet,
        queries: reducedQueries,
        path,
        ...rest,
      });
    }
  }, queries);
