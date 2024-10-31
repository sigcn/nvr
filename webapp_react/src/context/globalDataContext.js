import {atom} from "jotai"
import {atomWithStorage} from 'jotai/utils'

const GlobalContext = atom({});

const UserInfoAtom = atomWithStorage('userInfo', {})

const TokenAtom = atomWithStorage('token', '', {
  getItem: k => localStorage.getItem(k),
  setItem: (k, v) => localStorage.setItem(k, v),
  delayInit: true
})

export {
  GlobalContext,
  UserInfoAtom,
  TokenAtom,
}

