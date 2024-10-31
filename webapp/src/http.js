const apiServer = ''

async function post(url, opts = {}) {
  opts.method = 'POST'
  return await request(url, opts)
}

async function get(url, opts = {}) {
  opts.method = 'GET'
  return await request(url, opts)
}

async function put(url, opts = {}) {
  opts.method = 'PUT'
  return await request(url, opts)
}

async function del(url, opts = {}) {
  opts.method = 'DELETE'
  return await request(url, opts)
}

const sessionKey = () => JSON.parse(localStorage.session || '{}').key || ''

async function request(url, opts = {}) {
  let options = {
    method: opts.method || 'GET',
    headers: { ...opts.headers, 'X-ApiKey': sessionKey() },
  }

  if (opts.body) {
    options.body = JSON.stringify(opts.body)
  }

  let resp = await fetch(`${apiServer}${url}`, options)
  await checkResp(resp)
  let r = {}
  try {
    r = await resp.json()
    r.headers = resp.headers
    r.success = r.code === 0
    return r
  } catch (_) {
    r.headers = resp.headers
    r.code = resp.status
    r.success = r.code === 0
    return r
  }
}

async function checkResp(resp) {
  if (resp.status == 401) {
    let err = new Error('Unauthorized')
    err.code = resp.status
    throw err
  }

  if (resp.status != 200 && resp.status != 304) {
    let err = new Error(await resp.text())
    err.code = resp.status
    throw err
  }
}

const http = {
  get: get,
  post: post,
  put: put,
  delete: del,
  request: request,
  apiServer: apiServer,
  sessionKey,
}
export default http
