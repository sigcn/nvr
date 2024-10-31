import api from "@/utils/request";

export const camera = {
  list: (params) => api.post(`/v1/camera/list`, params),

}

