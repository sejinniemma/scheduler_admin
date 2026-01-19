export interface Schedule {
  id: string;
  mainUser: string;
  subUser: string;
  groom: string;
  bride: string;
  time: string;
  userArrivalTime?: string;
  location?: string;
  venue?: string;
  date: string;
  memo?: string;
  mainUserMemo?: string | null;
  subUserMemo?: string | null;
  mainUserReportStatus?: string | null;
  subUserReportStatus?: string | null;
  mainUserConfirmed?: boolean;
  subUserConfirmed?: boolean;
  status: string;
  currentStep?: number;
  createdAt?: string;
  updatedAt?: string;
}
