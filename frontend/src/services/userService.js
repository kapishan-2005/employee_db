/**
 * User Service
 * Handles CEO/Admin user management (list + create HR/Manager/Employee accounts)
 */

import { api, endpoints } from './api';

export const userService = {
  list: async () => {
    return await api.get(endpoints.users.list);
  },

  create: async ({ username, email, password, role, employee_id }) => {
    return await api.post(endpoints.users.register, {
      username,
      email,
      password,
      role,
      employee_id,
    });
  },
};

export default userService;
