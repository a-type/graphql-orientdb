import {
  FieldNode,
  GraphQLSchema,
  isObjectType,
  ValueNode,
  NameNode,
} from 'utils/graphql';
import { FieldMissingError } from 'errors';

export const getArgumentsPlusDefaults = (
  parentTypeName: string,
  field: FieldNode,
  schema: GraphQLSchema,
  variables: { [name: string]: any }
): { [name: string]: any } => {
  const schemaType = schema.getType(parentTypeName);

  if (!schemaType || !isObjectType(schemaType)) {
    throw new Error(
      `Invalid state: Unknown or non-object type name "${parentTypeName}" (type: ${schemaType})`
    );
  }

  const schemaField = schemaType.getFields()[field.name.value];

  if (!schemaField) {
    throw new FieldMissingError(schemaType.name, field.name.value);
  }

  const defaults = schemaField.args.reduce(
    (argMap, arg) =>
      arg.defaultValue !== undefined
        ? { ...argMap, [arg.name]: arg.defaultValue }
        : argMap,
    {}
  );

  return {
    ...defaults,
    ...argFieldsToValues({}, field.arguments || [], variables),
  };
};

export const argFieldsToValues = (
  providedValues: { [key: string]: any },
  fields: readonly { value: ValueNode; name: NameNode }[],
  variables: { [variableName: string]: any }
) =>
  fields.reduce((acc, fieldNode) => {
    acc[fieldNode.name.value] = valueNodeToValue(fieldNode.value, variables);
    return acc;
  }, providedValues);

export const valueNodeToValue = (
  valueNode: ValueNode,
  variables: { [variableName: string]: any }
) => {
  if (valueNode.kind === 'Variable') {
    return variables[valueNode.name.value];
  } else if (valueNode.kind === 'NullValue') {
    return null;
  } else if (valueNode.kind === 'ObjectValue') {
    return argFieldsToValues({}, valueNode.fields, variables);
  } else if (valueNode.kind === 'ListValue') {
    return valueNode.values.map(value => valueNodeToValue(value, variables));
  } else if (valueNode.kind === 'IntValue') {
    return parseInt(valueNode.value, 10);
  } else if (valueNode.kind === 'FloatValue') {
    return parseFloat(valueNode.value);
  } else {
    return valueNode.value;
  }
};
