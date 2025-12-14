import { gql } from '@apollo/client';

// User Queries
export const GET_ME = gql`
  query GetMe {
    me {
      id
      name
      phone
      role
      tenantId
    }
  }
`;

export const GET_USERS = gql`
  query GetUsers {
    users {
      id
      name
      phone
      role
      tenantId
    }
  }
`;

// User Mutations
export const CREATE_USER = gql`
  mutation CreateUser(
    $name: String!
    $phone: String!
    $tenantId: String!
    $role: String
  ) {
    createUser(name: $name, phone: $phone, tenantId: $tenantId, role: $role) {
      id
      name
      phone
      role
      tenantId
    }
  }
`;

export const UPDATE_USER = gql`
  mutation UpdateUser($id: ID!, $name: String, $phone: String) {
    updateUser(id: $id, name: $name, phone: $phone) {
      id
      name
      phone
    }
  }
`;

export const DELETE_USER = gql`
  mutation DeleteUser($id: ID!) {
    deleteUser(id: $id)
  }
`;
