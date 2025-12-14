export interface Schedule {
  id: string;
  mainUser: string;
  subUser: string;
  groom: string;
  bride: string;
  time: string;
  location?: string;
  venue?: string;
  date: string;
  memo?: string;
  status: string;
  subStatus: string;
  currentStep?: number;
  createdAt?: string;
  updatedAt?: string;
}
