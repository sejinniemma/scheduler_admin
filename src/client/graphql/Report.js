import { gql } from '@apollo/client';

// Report Mutations
export const CREATE_ARRIVAL_REPORT = gql`
  mutation CreateArrivalReport($scheduleId: ID!) {
    createReport(scheduleId: $scheduleId, status: "arrival", currentStep: 3) {
      id
      schedule
      user
      status
      currentStep
      createdAt
    }
  }
`;

export const CREATE_WAKEUP_REPORT = gql`
  mutation CreateWakeupReport($scheduleId: ID!, $estimatedTime: String) {
    createReport(
      scheduleId: $scheduleId
      status: "wakeup"
      estimatedTime: $estimatedTime
      currentStep: 1
    ) {
      id
      schedule
      user
      status
      currentStep
      estimatedTime
      createdAt
    }
  }
`;

export const CREATE_DEPARTURE_REPORT = gql`
  mutation CreateDepartureReport($scheduleId: ID!, $estimatedTime: String) {
    createReport(
      scheduleId: $scheduleId
      status: "departure"
      estimatedTime: $estimatedTime
      currentStep: 2
    ) {
      id
      schedule
      user
      status
      currentStep
      estimatedTime
      createdAt
    }
  }
`;

export const CREATE_COMPLETED_REPORT = gql`
  mutation CreateCompletedReport($scheduleId: ID!, $memo: String) {
    createReport(
      scheduleId: $scheduleId
      status: "completed"
      currentStep: 3
      memo: $memo
    ) {
      id
      schedule
      user
      status
      currentStep
      memo
      createdAt
    }
  }
`;

