export const RECOMMENDED_MEMBERS = 5;
export const MAX_MEMBERS = 6;

export enum GroupWarningCode {
  GROUP_IS_LARGE = 'GROUP_IS_LARGE',
  GROUP_IS_FULL = 'GROUP_IS_FULL',
}

export interface GroupWarning {
  code: GroupWarningCode;
  message: string;
}

export function groupSizeWarnings(memberCount: number): GroupWarning[] {
  if (memberCount >= MAX_MEMBERS) {
    return [
      {
        code: GroupWarningCode.GROUP_IS_FULL,
        message:
          'Grupa ma już maksymalną liczbę 6 członków. Dołączenie nie będzie możliwe.',
      },
    ];
  }

  if (memberCount >= RECOMMENDED_MEMBERS) {
    return [
      {
        code: GroupWarningCode.GROUP_IS_LARGE,
        message:
          'Grupa ma już 5 lub więcej członków. To duża liczba osób — projekt może być trudniejszy w koordynacji.',
      },
    ];
  }

  return [];
}
