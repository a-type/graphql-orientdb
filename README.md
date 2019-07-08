# graphql-orientdb

An experimental query translation / compilation layer from GraphQL to OrientDB SQL.

The purpose of this library is to allow users to easily write minimal backend API servers for rich client applications, defining their own external GraphQL schema which suits their use case, while powering that schema directly with OrientDB SQL statements.

This is accomplished using schema directives. You annotate your GraphQL schema with these directives to indicate how your fields translate into OrientDB SQL statements. These statements are then compiled over the entire GraphQL query to form a set of final SQL queries which will be run against the database.

## [Sketches] Initial ideas for query translation

I'm a visual thinker, so I'm going to start outlining what I want to accomplish with this library.

```graphql
type Post {
  id: ID!
  title: String!
}

type User {
  id: ID!
  name: String!
  bio: String

  posts: [Post!]!
    @match(statement: ":parent-HasPost->{as:post}", return: "post")
}

input UserGetInput {
  id: ID!
}

type Query {
  user(input: UserGetInput!): User
    @match(
      statement: "{class: User, where: (id = $args.input.id), as: user}"
      return: "user"
    )
}
```

Running the query

```graphql
query GetUserAndPosts {
  user(input: { id: "foo" }) {
    id
    name
    posts {
      id
      title
    }
  }
}
```

Would result in the following OrientDB SQL query:

> I'm still learning OrientDB, so I need to verify that some of these things
> would actually work...

```orientdb
SELECT id, name, posts:{id, title} FROM (
  MATCH {class: User, where: (id = $args.input.id), as: user}
  ... TODO ...
)
```

## Comparable Projects

[Join Monster](https://github.com/acarl005/join-monster) compiles SQL queries from GraphQL for most typical relational databases (but not OrientDB)

Neo4J has projects which do the same for Cypher. [neo4j-graphql-js](https://github.com/neo4j-graphql/neo4j-graphql-js) is an official project. There's also my previous foray into this area, [graphql-cypher](https://github.com/a-type/graphql-cypher), which follows similar principles to this library, only targeting Cypher. I created this library before discovering and migrating to OrientDB from Neo4J.

===========

This project was bootstrapped with [TSDX](https://github.com/jaredpalmer/tsdx).

## Local Development

Below is a list of commands you will probably find useful.

### `npm start` or `yarn start`

Runs the project in development/watch mode. Your project will be rebuilt upon changes. TSDX has a special logger for you convenience. Error messages are pretty printed and formatted for compatibility VS Code's Problems tab.

<img src="https://user-images.githubusercontent.com/4060187/52168303-574d3a00-26f6-11e9-9f3b-71dbec9ebfcb.gif" width="600" />

Your library will be rebuilt if you make edits.

### `npm run build` or `yarn build`

Bundles the package to the `dist` folder.
The package is optimized and bundled with Rollup into multiple formats (CommonJS, UMD, and ES Module).

<img src="https://user-images.githubusercontent.com/4060187/52168322-a98e5b00-26f6-11e9-8cf6-222d716b75ef.gif" width="600" />

### `npm test` or `yarn test`

Runs the test watcher (Jest) in an interactive mode.
By default, runs tests related to files changed since the last commit.
