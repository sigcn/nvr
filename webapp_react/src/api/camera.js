import api from "@/api/request";

export const camera = {
  list: (params) => api.get(`/v1/api/cameras`, params),

  save: (params) => api.post(`v1/api/cameras`, params),

  delete: (id) => api.delete(`v1/api/cameras/${id}`),

  saveRemark: (id, params) => api.patch(`v1/api/cameras/${id}/remark`, params),

  reload: () => api.post('/v1/api/cameras/reload'),

  stat: (params) => api.get('/v1/api/stat', params),

  preview: (id) => api.get(`/media/${id}/live.ts`),
}

