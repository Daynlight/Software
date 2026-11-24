import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AuthenticatedRequest } from './session.guard';
import { UsosSessionUser } from './auth.types';

export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): UsosSessionUser =>
    context.switchToHttp().getRequest<AuthenticatedRequest>().user,
);
