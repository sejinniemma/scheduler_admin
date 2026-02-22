import Schedule from '../models/Schedule';
import Report from '../models/Report';
import UserConfirm from '../models/UserConfirm';

/**
 * 스케줄 전체 삭제 (연관 Report, UserConfirm 함께 삭제)
 * @returns {{ deletedSchedules: number, deletedReports: number, deletedUserConfirms: number }}
 */
export async function deleteAllSchedules() {
  const [scheduleResult, reportResult, userConfirmResult] = await Promise.all([
    Schedule.deleteMany({}),
    Report.deleteMany({}),
    UserConfirm.deleteMany({}),
  ]);

  return {
    deletedSchedules: scheduleResult.deletedCount ?? 0,
    deletedReports: reportResult.deletedCount ?? 0,
    deletedUserConfirms: userConfirmResult.deletedCount ?? 0,
  };
}
