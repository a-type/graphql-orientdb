export type Plugin = {
  directiveName: string;
  buildStatement: (directiveArgs: { [name: string]: any }) => string;
};

export type DBQuery = {
  returnsList: boolean;

  fieldNames: string[];
  fieldQueries: {
    [name: string]: DBQuery;
  };

  paramNames: string[];
  params: DBQueryParams;

  plugin: Plugin;
  directiveArgs: { [name: string]: any };
};

export type DBQueryParams = {
  args?: { [name: string]: any };
};

export type QueryFieldMap = {
  [path: string]: DBQuery;
};
