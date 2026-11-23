import { DynamicModule, Inject, Provider, Type } from '@nestjs/common';

export function getRepositoryToken(entity: Type<unknown>): string {
  return `${entity.name}Repository`;
}

export function InjectRepository(entity: Type<unknown>): ParameterDecorator {
  return Inject(getRepositoryToken(entity));
}

export class TypeOrmModule {
  static forRoot(): DynamicModule {
    return {
      module: TypeOrmModule,
      providers: [],
      exports: [],
    };
  }

  static forRootAsync(): DynamicModule {
    return {
      module: TypeOrmModule,
      providers: [],
      exports: [],
    };
  }

  static forFeature(entities: Type<unknown>[] = []): DynamicModule {
    const providers: Provider[] = entities.map((entity) => ({
      provide: getRepositoryToken(entity),
      useValue: {},
    }));

    return {
      module: TypeOrmModule,
      providers,
      exports: providers,
    };
  }
}
