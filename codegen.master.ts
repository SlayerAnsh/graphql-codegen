import { configDotenv } from 'dotenv'
configDotenv();
import { CodegenConfig } from '@graphql-codegen/cli'

const config: CodegenConfig = {
  schema: process.env.GQL_URL,
  documents: 'schema/**/*.graphql',
  ignoreNoDocuments: true,
  generates: {
    'schema/master-schema.graphql': {
      plugins: ['./plugins/dist/index.js']
    },
    'schema/schema-ast.graphql': {
      plugins: ['schema-ast']
    }
  },
}

export default config