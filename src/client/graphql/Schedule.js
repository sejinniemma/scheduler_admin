import { gql } from '@apollo/client';

// Schedule Queries
export const GET_SCHEDULES = gql`
  query GetSchedules($date: String, $subStatus: String, $status: String) {
    schedules(date: $date, subStatus: $subStatus, status: $status) {
      id
      mainUser
      subUser
      groom
      bride
      time
      location
      venue
      date
      memo
      mainUserMemo
      subUserMemo
      status
      subStatus
      createdAt
      updatedAt
    }
  }
`;

export const GET_SCHEDULES_LIST = gql`
  query GetSchedulesList {
    schedulesList {
      id
      mainUser
      subUser
      groom
      bride
      time
      location
      venue
      date
      memo
      mainUserMemo
      subUserMemo
      status
      subStatus
      createdAt
      updatedAt
    }
  }
`;

// Schedule Mutations
export const CREATE_SCHEDULE = gql`
  mutation CreateSchedule(
    $mainUser: String!
    $subUser: String
    $groom: String!
    $bride: String!
    $date: String!
    $time: String!
    $location: String
    $venue: String
    $memo: String
    $status: String
    $subStatus: String
  ) {
    createSchedule(
      mainUser: $mainUser
      subUser: $subUser
      groom: $groom
      bride: $bride
      date: $date
      time: $time
      location: $location
      venue: $venue
      memo: $memo
      status: $status
      subStatus: $subStatus
    ) {
      id
      mainUser
      subUser
      groom
      bride
      date
      time
      location
      venue
      memo
      status
      subStatus
    }
  }
`;

export const UPDATE_SCHEDULE = gql`
  mutation UpdateSchedule(
    $id: ID!
    $mainUser: String
    $subUser: String
    $groom: String
    $bride: String
    $date: String
    $time: String
    $location: String
    $venue: String
    $memo: String
    $status: String
    $subStatus: String
    $currentStep: Int
  ) {
    updateSchedule(
      id: $id
      mainUser: $mainUser
      subUser: $subUser
      groom: $groom
      bride: $bride
      date: $date
      time: $time
      location: $location
      venue: $venue
      memo: $memo
      status: $status
      subStatus: $subStatus
      currentStep: $currentStep
    ) {
      id
      mainUser
      subUser
      groom
      bride
      date
      time
      location
      venue
      memo
      status
      subStatus
      currentStep
    }
  }
`;

export const DELETE_SCHEDULE = gql`
  mutation DeleteSchedule($id: ID!) {
    deleteSchedule(id: $id)
  }
`;

export const CONFIRM_SCHEDULES = gql`
  mutation ConfirmSchedules($scheduleIds: [ID!]!) {
    confirmSchedules(scheduleIds: $scheduleIds) {
      success
      updatedCount
    }
  }
`;
