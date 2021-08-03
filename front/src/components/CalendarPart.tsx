import React from 'react'
import { Observer } from 'mobx-react'
import {
  Icon28ArrowLeftOutline,
  Icon28ArrowRightOutline,
} from '@vkontakte/icons'
import { calendarWeekNames } from '../constants'

export interface IPropsCalendarWeekNames {
  isMobile: boolean
}
export const CalendarWeekNames: React.FC<IPropsCalendarWeekNames> = ({
  isMobile,
}) => (
  <div className="row calendar_daysNames">
    {calendarWeekNames.map((name, index) => (
      <div className="col" key={index}>
        <Observer>{() => (isMobile ? name.med : name.full)}</Observer>
      </div>
    ))}
  </div>
)

export interface IPropsCalendarHeader {
  currentMonthTitle: string
  prevMonth(): void
  nextMonth(): void
}
export const CalendarHeader: React.FC<IPropsCalendarHeader> = ({
  currentMonthTitle,
  prevMonth,
  nextMonth,
}) => (
  <div className="row calendar_header">
    <div className="calendar_header_col-start">
      <div className="calendar_header_icon" onClick={prevMonth}>
        <Icon28ArrowLeftOutline />
      </div>
    </div>
    <div className="calendar_header_col-center">
      <span>
        <Observer>{() => currentMonthTitle}</Observer>
      </span>
    </div>
    <div className="calendar_header_col-end">
      <div className="calendar_header_icon" onClick={nextMonth}>
        <Icon28ArrowRightOutline />
      </div>
    </div>
  </div>
)
