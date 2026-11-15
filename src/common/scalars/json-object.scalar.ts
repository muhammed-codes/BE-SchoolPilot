import { GraphQLScalarType, Kind } from 'graphql';

const parseLiteral = (ast: any): any => {
  switch (ast.kind) {
    case Kind.STRING:
    case Kind.BOOLEAN:
      return ast.value;
    case Kind.INT:
    case Kind.FLOAT:
      return parseFloat(ast.value);
    case Kind.OBJECT: {
      const value = Object.create(null);
      ast.fields.forEach((field: any) => {
        value[field.name.value] = parseLiteral(field.value);
      });
      return value;
    }
    case Kind.LIST:
      return ast.values.map(parseLiteral);
    case Kind.NULL:
      return null;
    default:
      return null;
  }
};

export const GraphQLJSONObject = new GraphQLScalarType({
  name: 'JSONObject',
  description: 'Arbitrary JSON object value scalar',
  serialize: (value) => value,
  parseValue: (value) => value,
  parseLiteral,
});
