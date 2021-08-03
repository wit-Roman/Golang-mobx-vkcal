import { IvkData } from './store/storeTypes'

export const app_id = 7121023
export const apiUrl = 'https://vkapp.apps-web.xyz'
//export const apiUrl = 'http://localhost:3000'
export const vkAppPage = 'https://vk.com/app'
export const versionVKApi = '5.61'

export enum uri {
  Session = '/vksession',
  Data = '/data',
  Listen = '/listen',
  Change = '/change',
}

export enum panels {
  Homepage = 'homepage',
  Calendar = 'calendar',
  Setting = 'setting',
}

export enum platforms {
  desktop_web = 'desktop_web',
  mobile_web = 'mobile_web',
}

export enum incomingDataTypes {
  pinned = 1,
}

export type Tgroup_roles = 'none' | 'member' | 'moder' | 'editor' | 'admin'
export const group_roles = ['none', 'member', 'moder', 'editor', 'admin']

export function getParameterByName(name: string, url?: string) {
  if (typeof url !== 'string') url = window.location.href
  if (typeof window !== 'object' || !url.includes(name)) return null
  name = name.replace(/[[\]]/g, '\\$&')
  const regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)'),
    results = regex.exec(url)
  if (!results) return null
  if (!results[2]) return ''
  return decodeURIComponent(results[2].replace(/\+/g, ' '))
}

export const vkDataEmpty: IvkData = {
  query_parameters: {
    iframeUrl: '',
    vk_app_id: 0,
    viewer_id: 0,
    vk_group_id: 0,
    vk_platform: null,
    group_role: null,
    rights: 0,
  },
  AuthToken: '',
}

export const genetive = (text: string | number) => {
  text = text.toString()
  return text[text.length - 1] === '1' ? 'e' : 'ах'
}

export const calendarWeekNames = [
  { small: 'ПН', med: 'Пнд', full: 'Понедельник' },
  { small: 'ВТ', med: 'Втр', full: 'Вторник' },
  { small: 'СР', med: 'Срд', full: 'Среда' },
  { small: 'ЧТ', med: 'Чтв', full: 'Четверг' },
  { small: 'ПТ', med: 'Птн', full: 'Пятница' },
  { small: 'СБ', med: 'Сбт', full: 'Суббота' },
  { small: 'ВС', med: 'Вск', full: 'Воскресенье' },
]

export const hex2rgba = (hex: string, alpha = 0.2) => {
  const [r, g, b] = hex.match(/\w\w/g)!.map((x) => parseInt(x, 16))
  return `rgba(${r},${g},${b},${alpha})`
}
