import api from "@/api/request";

export const auth = {
  login: (params) => api.post('/v1/api/keys', params),
  logOut: (params) => api.delete('/v1/api/keys', params),

}

