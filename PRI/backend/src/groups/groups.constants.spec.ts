import { GroupWarningCode, groupSizeWarnings } from './groups.constants';

describe('groupSizeWarnings', () => {
  it('returns no warning below the recommended size', () => {
    expect(groupSizeWarnings(1)).toEqual([]);
    expect(groupSizeWarnings(4)).toEqual([]);
  });

  it('warns when the group reaches the recommended size', () => {
    expect(groupSizeWarnings(5)).toEqual([
      expect.objectContaining({ code: GroupWarningCode.GROUP_IS_LARGE }),
    ]);
  });

  it('warns about the hard limit for a full group', () => {
    expect(groupSizeWarnings(6)).toEqual([
      expect.objectContaining({ code: GroupWarningCode.GROUP_IS_FULL }),
    ]);
  });
});
