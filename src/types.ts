export type Plugin = {
  directiveName: string;
};

export type DBQuery = {
  fields: string[];
  fieldQueries: {
    [name: string]: DBQuery;
  };
};

export type DBQueryParams = {
  args?: any;
};

export type QueryFieldMap = {
  [path: string]: DBQuery;
};
