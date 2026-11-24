import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiConflictResponse,
  ApiCookieAuth,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { CurrentUser } from '../auth/current-user.decorator';
import { UsosSessionUser } from '../auth/auth.types';
import { SessionGuard } from '../auth/session.guard';
import { CreateGroupDto } from './dto/create-group.dto';
import { ListJoinRequestsQueryDto } from './dto/list-join-requests.dto';
import { SearchGroupsQueryDto } from './dto/search-groups.dto';
import { UpdateGroupDto } from './dto/update-group.dto';
import { GroupsService } from './groups.service';
import {
  GroupMemberView,
  GroupSummary,
  JoinRequestResult,
  JoinRequestView,
  Paginated,
} from './groups.types';

@ApiTags('groups')
@ApiCookieAuth('pri_session')
@UseGuards(SessionGuard)
@Controller('groups')
export class GroupsController {
  constructor(private readonly groups: GroupsService) {}

  @Post()
  @ApiOperation({ summary: 'Utwórz grupę projektową i zostań jej liderem' })
  @ApiCreatedResponse({ description: 'Grupa utworzona' })
  @ApiUnauthorizedResponse({ description: 'Brak sesji' })
  @ApiForbiddenResponse({ description: 'Użytkownik nie jest studentem' })
  @ApiConflictResponse({ description: 'Użytkownik należy już do grupy' })
  create(
    @CurrentUser() user: UsosSessionUser,
    @Body() dto: CreateGroupDto,
  ): Promise<GroupSummary> {
    return this.groups.create(user, dto);
  }

  @Patch(':groupId')
  @ApiOperation({ summary: 'Zmień nazwę lub opis grupy (tylko lider)' })
  @ApiOkResponse({ description: 'Grupa zaktualizowana' })
  @ApiUnauthorizedResponse({ description: 'Brak sesji' })
  @ApiForbiddenResponse({ description: 'Użytkownik nie jest liderem' })
  @ApiNotFoundResponse({ description: 'Grupa nie istnieje' })
  update(
    @CurrentUser() user: UsosSessionUser,
    @Param('groupId', ParseUUIDPipe) groupId: string,
    @Body() dto: UpdateGroupDto,
  ): Promise<GroupSummary> {
    return this.groups.update(user, groupId, dto);
  }

  @Post(':groupId/leave')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Opuść grupę' })
  @ApiNoContentResponse({ description: 'Grupa opuszczona' })
  @ApiUnauthorizedResponse({ description: 'Brak sesji' })
  @ApiForbiddenResponse({ description: 'Użytkownik nie należy do grupy' })
  @ApiNotFoundResponse({ description: 'Grupa nie istnieje' })
  leave(
    @CurrentUser() user: UsosSessionUser,
    @Param('groupId', ParseUUIDPipe) groupId: string,
  ): Promise<void> {
    return this.groups.leave(user, groupId);
  }

  @Get()
  @ApiOperation({ summary: 'Wyszukaj i filtruj grupy projektowe' })
  @ApiOkResponse({ description: 'Stronicowana lista grup' })
  @ApiUnauthorizedResponse({ description: 'Brak sesji' })
  search(
    @CurrentUser() user: UsosSessionUser,
    @Query() query: SearchGroupsQueryDto,
  ): Promise<Paginated<GroupSummary>> {
    return this.groups.search(user, query);
  }

  @Post(':groupId/join-requests')
  @ApiOperation({ summary: 'Wyślij prośbę o dołączenie do grupy' })
  @ApiCreatedResponse({ description: 'Prośba utworzona' })
  @ApiUnauthorizedResponse({ description: 'Brak sesji' })
  @ApiForbiddenResponse({ description: 'Użytkownik nie jest studentem' })
  @ApiNotFoundResponse({ description: 'Grupa nie istnieje' })
  @ApiConflictResponse({
    description: 'Użytkownik jest członkiem grupy lub ma oczekującą prośbę',
  })
  requestToJoin(
    @CurrentUser() user: UsosSessionUser,
    @Param('groupId', ParseUUIDPipe) groupId: string,
  ): Promise<JoinRequestResult> {
    return this.groups.requestToJoin(user, groupId);
  }

  @Get(':groupId/members')
  @ApiOperation({ summary: 'Pobierz skład grupy (tylko członkowie)' })
  @ApiOkResponse({ description: 'Lista członków grupy' })
  @ApiUnauthorizedResponse({ description: 'Brak sesji' })
  @ApiForbiddenResponse({ description: 'Użytkownik nie jest członkiem grupy' })
  @ApiNotFoundResponse({ description: 'Grupa nie istnieje' })
  members(
    @CurrentUser() user: UsosSessionUser,
    @Param('groupId', ParseUUIDPipe) groupId: string,
  ): Promise<GroupMemberView[]> {
    return this.groups.members(user, groupId);
  }

  @Get(':groupId/join-requests')
  @ApiOperation({ summary: 'Pobierz prośby o dołączenie (tylko lider)' })
  @ApiOkResponse({ description: 'Stronicowana lista próśb' })
  @ApiUnauthorizedResponse({ description: 'Brak sesji' })
  @ApiForbiddenResponse({ description: 'Użytkownik nie jest liderem' })
  @ApiNotFoundResponse({ description: 'Grupa nie istnieje' })
  listRequests(
    @CurrentUser() user: UsosSessionUser,
    @Param('groupId', ParseUUIDPipe) groupId: string,
    @Query() query: ListJoinRequestsQueryDto,
  ): Promise<Paginated<JoinRequestView>> {
    return this.groups.listRequests(user, groupId, query);
  }

  @Post(':groupId/join-requests/:requestId/accept')
  @ApiOperation({ summary: 'Zaakceptuj prośbę o dołączenie (tylko lider)' })
  @ApiOkResponse({ description: 'Prośba zaakceptowana' })
  @ApiUnauthorizedResponse({ description: 'Brak sesji' })
  @ApiForbiddenResponse({ description: 'Użytkownik nie jest liderem' })
  @ApiNotFoundResponse({ description: 'Grupa lub prośba nie istnieje' })
  @ApiConflictResponse({
    description:
      'Grupa pełna, prośba nieoczekująca lub użytkownik w innej grupie',
  })
  accept(
    @CurrentUser() user: UsosSessionUser,
    @Param('groupId', ParseUUIDPipe) groupId: string,
    @Param('requestId', ParseUUIDPipe) requestId: string,
  ): Promise<JoinRequestResult> {
    return this.groups.accept(user, groupId, requestId);
  }

  @Post(':groupId/join-requests/:requestId/reject')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Odrzuć prośbę o dołączenie (tylko lider)' })
  @ApiOkResponse({ description: 'Prośba odrzucona' })
  @ApiUnauthorizedResponse({ description: 'Brak sesji' })
  @ApiForbiddenResponse({ description: 'Użytkownik nie jest liderem' })
  @ApiNotFoundResponse({ description: 'Grupa lub prośba nie istnieje' })
  @ApiConflictResponse({ description: 'Prośba nie jest oczekująca' })
  reject(
    @CurrentUser() user: UsosSessionUser,
    @Param('groupId', ParseUUIDPipe) groupId: string,
    @Param('requestId', ParseUUIDPipe) requestId: string,
  ): Promise<JoinRequestResult> {
    return this.groups.reject(user, groupId, requestId);
  }
}
