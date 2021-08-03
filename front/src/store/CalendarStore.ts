import { observable, computed, action, reaction, runInAction } from 'mobx'
import {
  format,
  addMonths,
  subMonths,
  getISODay,
  getWeeksInMonth,
  startOfWeek,
  startOfMonth,
  startOfDay,
  isSameMonth,
  addDays,
  isSameDay,
} from 'date-fns'
import ruLocale from 'date-fns/locale/ru'

import {
  ICalendarStore,
  ICurrentCell,
  IdataUsers,
  IApi,
  ICalendarData,
  IIncomingData,
  IUserDetailData,
  IdataUsersSelectedDates,
  IdataUsersPinnedDates,
  IdataSpecialDays,
} from './storeTypes'
import { incomingDataTypes, hex2rgba } from '../constants'

class CalendarStore implements ICalendarStore {
  private currentDateNow: number = Date.now()
  @observable private startOfMonthDate = Date.parse(
    startOfMonth(Date.now()).toString(),
  )
  private endOfCurrentDateDay = Date.parse(startOfDay(Date.now()).toString())
  private currentUserViewer_id = 0
  currentUserPhoto_100 = ''

  @observable dataUserSelectedDates: number[] = []
  @observable private dataUsersSelectedDates: IdataUsersSelectedDates = {}
  @observable private dataUsers: IdataUsers = {}

  @observable dataUsersPinnedDates: IdataUsersPinnedDates = {}
  private specialDays: IdataSpecialDays = {}
  @observable detailedInfoData?: string
  private blockedDays: number[] = []
  private blockedWeekDays: boolean[] = []
  private blockedPeriod: [number | null, number | null] = [null, null]
  private isSelectBlocked = false

  @observable.ref detailedUsersInfoData: IUserDetailData[] = []
  isMobile = true
  isSmallIcon = window.innerWidth < 460
  isRedactorRights = false
  @observable isListen = false
  @observable private isSetData = false
  @observable snackBarMessage = ''

  private reactions = [
    reaction(
      () => this.isSetData && this.isListen,
      () => this.listen(),
    ),
  ]

  constructor(private api: IApi) {}

  @action.bound
  init() {
    this.isListen = true
  }

  @action.bound
  private listen() {
    this.api.backStartListen(this.changeOnSSE)
  }

  @action.bound
  dispose() {
    this.isListen = false
    this.reactions = []
  }

  @action.bound
  setData(data: ICalendarData) {
    this.currentUserViewer_id = data.currentUserViewer_id
    this.currentUserPhoto_100 = data.currentUserPhoto_100 || ''
    this.isMobile = this.api.isMobile
    this.isRedactorRights = this.api.isRedactorRights
    this.currentDateNow = data.CurrentDateNow
    this.startOfMonthDate = Date.parse(
      startOfMonth(this.currentDateNow).toString(),
    )
    this.endOfCurrentDateDay = Date.parse(
      startOfDay(this.currentDateNow).toString(),
    )

    this.dataUserSelectedDates = data.DataUserSelectedDates
    this.dataUsersSelectedDates = data.DataUsersSelectedDates
    this.dataUsers = data.DataUsers

    this.dataUsersPinnedDates = data.DataUsersPinnedDates

    this.isSelectBlocked =
      data.SettingAccessMember && !this.api.isSubscriberRights
    this.blockedDays = data.SettingBlockedDays
    this.blockedWeekDays = data.SettingAllowedWeekDays
    this.blockedPeriod = data.SettingBlockedPeriod
    this.specialDays = data.SettingSpecialDays

    this.isSetData = true
  }

  @computed
  get currentCells() {
    const weeksInMonth = getWeeksInMonth(this.startOfMonthDate, {
      weekStartsOn: 1,
    })
    let iterableDay = startOfWeek(this.startOfMonthDate, { weekStartsOn: 1 })

    return Array.apply(null, Array(weeksInMonth)).map((_weekPlug) =>
      Array.apply(null, Array(7)).map((_dayPlug, dayIndex) => {
        const cacheDay = Date.parse(iterableDay.toString())
        iterableDay = addDays(iterableDay, 1)

        const displayUsers = this.dataUsersSelectedDates[cacheDay]?.map(
          (viewer_id) =>
            this.dataUsers[viewer_id]
              ? {
                  ...this.dataUsers[viewer_id],
                  IsPinned: !!this.dataUsersPinnedDates[cacheDay]?.includes(
                    viewer_id,
                  ),
                }
              : {
                  First_name: 'неизвестно',
                  Last_name: 'неизвестно',
                  Photo_100: '',
                  IsPinned: false,
                },
        )

        return {
          cacheDay,
          displayDay: format(cacheDay, 'd', { locale: ruLocale }),
          displayUsers,
          description: this.specialDays[cacheDay]?.Description || '',
          color: this.specialDays[cacheDay]?.Color
            ? hex2rgba(this.specialDays[cacheDay].Color)
            : '',
          isSelected: this.dataUserSelectedDates.includes(cacheDay),
          isToday: isSameDay(cacheDay, this.currentDateNow),
          isCurrentMonth: !isSameMonth(cacheDay, this.startOfMonthDate),
          isInnactive: this.checkIsInnactive(cacheDay, dayIndex),
        } as ICurrentCell
      }),
    )
  }

  @action.bound
  nextMonth() {
    this.startOfMonthDate = Date.parse(
      addMonths(this.startOfMonthDate, 1).toString(),
    )
  }

  @action.bound
  prevMonth() {
    this.startOfMonthDate = Date.parse(
      subMonths(this.startOfMonthDate, 1).toString(),
    )
  }

  select = async (item: ICurrentCell) => {
    if (this.isSelectBlocked) {
      this.snackBarMessage = 'Записаться могут только участники сообщества'
      return
    }

    const date = item.cacheDay
    if (!date) return
    if (item.isInnactive) {
      this.snackBarMessage = 'Выбранная дата неактивна'
      return
    }
    if (this.dataUsersPinnedDates[date]?.includes(this.currentUserViewer_id)) {
      this.snackBarMessage = 'Запись на этот день закрелена администратором'
      return
    }

    try {
      const result = await this.api.backSendDate(date, !item.isSelected)

      if (result) {
        runInAction(() => {
          item.isSelected = result.IsWriting
          this.currentDateNow = result.CurrentDateNow

          if (item.isSelected) {
            this.dataUserSelectedDates.push(date)
            this.dataUsersSelectedDates[date] = this.dataUsersSelectedDates[
              date
            ]
              ? this.dataUsersSelectedDates[date].concat(result.Viewer_id)
              : [result.Viewer_id]
          } else {
            this.dataUserSelectedDates = this.dataUserSelectedDates.filter(
              (elem) => elem !== date,
            )
            this.dataUsersSelectedDates[date] = this.dataUsersSelectedDates[
              date
            ]
              ? this.dataUsersSelectedDates[date].filter(
                  (elem) => elem !== result.Viewer_id,
                )
              : []
          }
        })
      }
    } catch (e) {
      runInAction(() => {
        this.snackBarMessage =
          'Превышено число запросов или время сессии истекло'
      })
      throw e
    }
  }

  @action
  changeOnSSE = (incomingData: IIncomingData) => {
    const [date, viewer_id, isWriting, typeIncomingData] = incomingData

    if (typeIncomingData === incomingDataTypes.pinned) {
      runInAction(() => {
        if (isWriting) {
          if (this.dataUsersPinnedDates[date]) {
            this.dataUsersPinnedDates[date].push(viewer_id)
          } else {
            this.dataUsersPinnedDates[date] = [viewer_id]
          }
        } else {
          if (this.dataUsersPinnedDates[date]) {
            this.dataUsersPinnedDates[date] = this.dataUsersPinnedDates[
              date
            ].filter((pinned_viewer_id) => pinned_viewer_id !== viewer_id)
          }
        }
      })
      return
    }

    if (isWriting) {
      this.dataUsersSelectedDates[date] = this.dataUsersSelectedDates[date]
        ? this.dataUsersSelectedDates[date].concat(viewer_id)
        : [viewer_id]
    } else {
      if (this.dataUsersSelectedDates[date]) {
        const deletedIndex = this.dataUsersSelectedDates[date].findIndex(
          (elem) => elem === viewer_id,
        )
        if (deletedIndex !== -1)
          this.dataUsersSelectedDates[date].splice(deletedIndex, 1)
      }
    }
    if (!this.dataUsers[viewer_id] && !!viewer_id) {
      this.api.backGetUserData(viewer_id)?.then((result) => {
        if (result)
          runInAction(() => {
            this.dataUsers[viewer_id] = result
          })
      })
    }
  }

  private checkIsInnactive(day: number, dayInWeekIndex: number) {
    return (
      this.blockedDays.includes(day) || //день исключен
      this.blockedWeekDays[dayInWeekIndex] || //день недели исключен
      day < this.endOfCurrentDateDay || //прошедший день
      (this.blockedPeriod[0] &&
        this.blockedPeriod[1] &&
        day >= this.blockedPeriod[0] &&
        day < this.blockedPeriod[1]) //день входит в период
    )
  }

  @computed
  get currentMonthTitle() {
    return format(this.startOfMonthDate, 'LLLL yyyy', {
      locale: ruLocale,
    })
  }

  @action.bound
  openDetailedUsersInfo(date: number) {
    this.detailedInfoData = this.specialDays[date]?.Description
    this.detailedUsersInfoData = this.dataUsersSelectedDates[date]?.map(
      (viewer_id) =>
        this.dataUsers[viewer_id]
          ? Object.assign(this.dataUsers[viewer_id], {
              viewer_id,
              date,
              IsPinned: !!this.dataUsersPinnedDates[date]?.includes(viewer_id),
            })
          : {
              First_name: 'неизвестно',
              Last_name: 'неизвестно',
              Photo_100: '',
              viewer_id,
              IsPinned: false,
              date,
            },
    )
  }
  @action.bound
  closeDetailedUsersInfo() {
    this.detailedInfoData = undefined
    this.detailedUsersInfoData = []
  }

  pinViewerDate = async (date: number, viewer_id: number, isNew: boolean) => {
    if (!this.isRedactorRights) {
      this.snackBarMessage = 'Недостаточно прав'
      return
    }
    if (this.checkIsInnactive(date, getISODay(date) - 1)) {
      this.snackBarMessage = 'Невозможно закрепить - неактивная дата'
      return
    }

    try {
      const result = await this.api.backSendPinDate(date, viewer_id, isNew)
      runInAction(() => {
        this.currentDateNow = result.CurrentDateNow
        if (result.IsPinned === 1) {
          if (this.dataUsersPinnedDates[date]) {
            this.dataUsersPinnedDates[date].push(viewer_id)
          } else {
            this.dataUsersPinnedDates[date] = [viewer_id]
          }
        } else if (result.IsPinned === 0) {
          if (this.dataUsersPinnedDates[date]) {
            this.dataUsersPinnedDates[date] = this.dataUsersPinnedDates[
              date
            ].filter((pinned_viewer_id) => pinned_viewer_id !== viewer_id)
          }
        }
      })
      this.openDetailedUsersInfo(date)
    } catch (e) {
      throw e
    }
  }

  @action.bound
  clearSnackBarMessage() {
    this.snackBarMessage = ''
  }
}

export default CalendarStore
