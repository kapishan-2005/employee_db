/**
 * User Service
 * Handles CEO/Admin user management (list + create HR/Manager/Employee accounts)
 */

import { api, endpoints } from './api';

export const userService = {
  list: async () => {
    return await api.get(endpoints.users.list);
  },

  create: async (data) => {
    return await api.post(endpoints.users.create, data);
  },
};

export default userService;
