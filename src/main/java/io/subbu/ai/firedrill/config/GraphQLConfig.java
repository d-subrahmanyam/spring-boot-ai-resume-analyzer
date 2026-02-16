package io.subbu.ai.firedrill.config;

import graphql.scalars.ExtendedScalars;
import graphql.schema.GraphQLScalarType;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.graphql.execution.RuntimeWiringConfigurer;

/**
 * GraphQL configuration for custom scalar types.
 * Provides implementations for UUID, DateTime, and Upload scalar types used in the schema.
 */
@Configuration
public class GraphQLConfig {

    /**
     * Configure GraphQL scalars for UUID, DateTime, and Upload types.
     * 
     * @return RuntimeWiringConfigurer with scalar type definitions
     */
    @Bean
    public RuntimeWiringConfigurer runtimeWiringConfigurer() {
        return wiringBuilder -> wiringBuilder
                .scalar(ExtendedScalars.UUID)
                .scalar(ExtendedScalars.DateTime)
                .scalar(uploadScalar());
    }

    /**
     * Create Upload scalar type for file uploads.
     * This is a custom scalar that handles multipart file uploads in GraphQL mutations.
     * 
     * @return GraphQLScalarType for Upload
     */
    private GraphQLScalarType uploadScalar() {
        return GraphQLScalarType.newScalar()
                .name("Upload")
                .description("Upload scalar type for file uploads")
                .coercing(new graphql.schema.Coercing<Object, Object>() {
                    @Override
                    public Object serialize(Object dataFetcherResult) {
                        // Not used for uploads
                        throw new UnsupportedOperationException("Upload scalar is only for input");
                    }

                    @Override
                    public Object parseValue(Object input) {
                        // Handle multipart file upload
                        return input;
                    }

                    @Override
                    public Object parseLiteral(Object input) {
                        // Uploads are not supported as literals
                        throw new UnsupportedOperationException("Upload scalar does not support literals");
                    }
                })
                .build();
    }
}
