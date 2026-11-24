import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { JoinRequestStatus } from '../../database/join_requests/join-requests.entity';
import { CreateGroupDto } from './create-group.dto';
import { ListJoinRequestsQueryDto } from './list-join-requests.dto';
import { SearchGroupsQueryDto } from './search-groups.dto';
import { UpdateGroupDto } from './update-group.dto';

function errorsFor<T extends object>(type: new () => T, value: object) {
  return validateSync(plainToInstance(type, value));
}

describe('group DTO validation', () => {
  it('accepts a valid create payload and rejects invalid lengths', () => {
    expect(
      errorsFor(CreateGroupDto, {
        name: 'Zespół A',
        description: 'Opis projektu inżynierskiego',
      }),
    ).toEqual([]);
    expect(
      errorsFor(CreateGroupDto, { name: 'ab', description: 'short' }),
    ).toHaveLength(2);
  });

  it('applies search defaults and transforms query values', () => {
    const query = plainToInstance(SearchGroupsQueryDto, {
      hasFreeSlots: 'true',
      page: '2',
      limit: '10',
    });

    expect(query).toEqual(
      expect.objectContaining({
        hasFreeSlots: true,
        page: 2,
        limit: 10,
        sort: 'createdAt',
        order: 'desc',
      }),
    );
    expect(errorsFor(SearchGroupsQueryDto, { hasFreeSlots: 'false' })).toEqual(
      [],
    );
  });

  it('rejects invalid search query values', () => {
    expect(
      errorsFor(SearchGroupsQueryDto, {
        hasFreeSlots: 'maybe',
        minFreeSlots: '7',
        page: '0',
        limit: '101',
        sort: 'unknown',
        order: 'sideways',
        search: 'x'.repeat(101),
        leader: 'x'.repeat(101),
      }),
    ).toHaveLength(8);
  });

  it('transforms and validates the mine filter', () => {
    expect(
      (
        plainToInstance(SearchGroupsQueryDto, {
          mine: 'true',
        }) as SearchGroupsQueryDto
      ).mine,
    ).toBe(true);
    expect(errorsFor(SearchGroupsQueryDto, { mine: 'maybe' })).toHaveLength(1);
  });

  it('validates group updates and allows partial data', () => {
    expect(errorsFor(UpdateGroupDto, {})).toEqual([]);
    expect(errorsFor(UpdateGroupDto, { name: 'Zespół A' })).toEqual([]);
    expect(
      errorsFor(UpdateGroupDto, { name: 'x', description: 'short' }),
    ).toHaveLength(2);
  });

  it('validates request status and pagination', () => {
    expect(
      errorsFor(ListJoinRequestsQueryDto, {
        status: 'ALL',
        page: '2',
        limit: '10',
      }),
    ).toEqual([]);
    expect(
      errorsFor(ListJoinRequestsQueryDto, {
        status: 'INVALID',
        page: '0',
        limit: '0',
      }),
    ).toHaveLength(3);
    expect(
      (
        plainToInstance(
          ListJoinRequestsQueryDto,
          {},
        ) as ListJoinRequestsQueryDto
      ).status,
    ).toBe(JoinRequestStatus.PENDING);
  });
});
