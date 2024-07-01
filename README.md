# Graphql Codegen (Typescript)
Query functions and hooks generator for graphql

## Auto-generate All Queries
Inside the `plugins` directory, we have a powerful custom plugin. It's a type of AST that visits each node and creates a special query for it if it satisfies these requirements:
1. It's a node that requires arguments
2. It's an object node with subfields.

Files are generated using the `npm run codegen:master` script. This always runs before codegen to generate all the operation nodes.

This tool is potent and will generate almost all the queries you might need, even specifics like querying only the app config.

You can also add custom queries if needed. For instance, to get app config and app components in a single query without wanting addresses in the query. Adding new queries is straightforward and described in the next section.

## How to Add New Queries
1. Create `.graphql` files inside the `schema` folder. These files will contain the document node (the query you use in the GQL playground).
2. After creating all the queries, run `npm run codegen`, and codegen will produce the following files:
    - `apollo-helper.ts`: Contains field policy types used to define key fields for the arguments.
    - `node.ts`: Contains `graphql-request` functions. Use this for non-React applications like CLI.
    - `react.ts`: Produces `apollo-client` hooks which can be used directly in your React projects.
    - `types.d.ts`: Contains all the Base Types declared in the GraphQL schema

Here are a few guidelines to keep the project streamlined:
1. Assign descriptive names to each query.
2. Ensure there are no duplicate queries or queries with the same name.
3. Avoid modifying existing queries. If a query name is already present but you want to use it for a new query, use a different name instead of changing the existing one.
4. Don't clutter queries with unnecessary data. If you anticipate a future use case, create two queries: one with specific fields and another with additional fields that may be useful. This approach ensures you won't need to add a new query later as all the fields would likely be included in your master query
