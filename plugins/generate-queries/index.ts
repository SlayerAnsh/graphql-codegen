import { DocumentNode, GraphQLField, GraphQLList, GraphQLNonNull, GraphQLObjectType, GraphQLSchema, Kind, OperationDefinitionNode, OperationTypeNode, print } from 'graphql';
import { PluginFunction, PluginValidateFn, Types } from '@graphql-codegen/plugin-helpers';
import { OperationsDocumentConfig } from './config';
import { buildOperationNodeForField } from '@graphql-tools/utils';

const QUERY_PREFIX = 'CODEGEN_GENERATED'

export const plugin: PluginFunction<OperationsDocumentConfig> = async (
    schema: GraphQLSchema,
    documents: Types.DocumentFile[],
    config: OperationsDocumentConfig
): Promise<Types.PluginOutput> => {
    const definitions: OperationDefinitionNode[] = [];

    type Selection = Record<string, any>;
    const fieldsToBuild: {
        queryName: string,
        selection: Selection
    }[] = [];

    const buildForField = (field: GraphQLField<any, any, any>, getSelection: (nested: Selection) => Selection, fieldName: string) => {
        if (!field || !!field.deprecationReason) return;
        let nestedField = field.type;

        // Process graphql lists
        while (nestedField instanceof GraphQLList || nestedField instanceof GraphQLNonNull) {
            nestedField = nestedField.ofType;
        }

        // If Scalar type, return true to include this field
        if (!(nestedField instanceof GraphQLObjectType)) {
            if (field.args.length > 0) {
                fieldsToBuild.push({
                    selection: getSelection({
                        [field.name]: true
                    }),
                    queryName: `${fieldName}_${field.name}`
                })
                return undefined;
            }
            return true;
        }

        // If its an object type then create a nestedKeys struct and return it
        let nestedKeys: Selection = {}
        for (const subField in nestedField.getFields()) {
            let subFieldBuild = buildForField(nestedField.getFields()[subField], (_nested) => {
                return getSelection({
                    [field.name]: _nested
                })
            }, `${fieldName}_${field.name}`)
            if (subFieldBuild)
                nestedKeys[subField] = subFieldBuild;
        }

        // If this object has no nested fields, then its a wrong schema, remove it from the build
        if (Object.keys(nestedKeys).length == 0) {
            return undefined;
        }
        fieldsToBuild.push({
            selection: getSelection({
                [field.name]: nestedKeys
            }),
            queryName: `${fieldName}_${field.name}`
        })
        if (field.args.length > 0) {
            return undefined;
        }
        return nestedKeys
    }

    const OP_TYPES = [{
        op: OperationTypeNode.QUERY,
        field: schema.getQueryType()
    },
    {
        op: OperationTypeNode.SUBSCRIPTION,
        field: schema.getSubscriptionType()
    }
    ];
    OP_TYPES.forEach(opType => {
        if (!opType.field) return;
        fieldsToBuild.length = 0;
        for (const fieldName in opType.field.getFields()) {
            const field = opType.field.getFields()[fieldName];
            if (!field) continue;
            const res = buildForField(field, (_nested) => {
                return _nested
            }, QUERY_PREFIX)
            if (res) {
                fieldsToBuild.push({
                    selection: {
                        [fieldName]: res
                    },
                    queryName: `${QUERY_PREFIX}_${fieldName}`
                })
            }
        }
        fieldsToBuild.forEach(build => {
            const fieldName = Object.keys(build.selection)[0];
            const definition = buildOperationNodeForField({
                'field': fieldName,
                'kind': opType.op,
                'depthLimit': config.depthLimit,
                'schema': schema,
                'circularReferenceDepth': config.circularReferenceDepth,
                'selectedFields': build.selection[fieldName]
            })
            const newDef = {
                ...definition
            }
            newDef.name = {
                kind: Kind.NAME,
                value: build.queryName.toUpperCase()
            }
            definitions.push(newDef)
        })
    })

    const document: DocumentNode = {
        kind: Kind.DOCUMENT,
        definitions,
    };

    const content = print(document);
    return {
        content,
    };
};

export const validate: PluginValidateFn<OperationsDocumentConfig> = async (
    _schema: GraphQLSchema,
    _documents: Types.DocumentFile[],
    config: OperationsDocumentConfig,
    outputFile: string
) => {
    if (!outputFile.endsWith('.graphql')) {
        throw new Error(`Plugin "operations-document" requires extension to be '.graphql' !`);
    }
};

export default { plugin, validate };