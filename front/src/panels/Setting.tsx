import React from 'react'
import { inject, observer, Observer } from 'mobx-react'

import {
  Panel,
  PanelHeader,
  PanelHeaderButton,
  Group,
  Cell,
  Header,
  Switch,
  Checkbox,
  Input,
  Snackbar,
  ActionSheet,
  ActionSheetItem,
  Button,
  Alert,
} from '@vkontakte/vkui'

import {
  Icon28ChevronBack,
  Icon16CancelCircleOutline,
  Icon16AddCircleOutline,
  Icon28WarningTriangleOutline,
  Icon28CalendarOutline,
  Icon20WriteOutline,
  Icon28RefreshOutline,
} from '@vkontakte/icons'

import { CalendarWeekNames, CalendarHeader } from '../components/CalendarPart'
import { panels, calendarWeekNames, hex2rgba } from '../constants'

import { ISettingStore, ISettingCell } from '../store/storeTypes'

interface IProps {
  id: panels
  handlePanel(panel: panels): void
  settingStore: ISettingStore
}
interface IState {
  resetAgreementActive: boolean
}

class Setting extends React.Component<IProps, IState> {
  state = { resetAgreementActive: false }

  componentDidMount() {
    this.props.settingStore.init()
  }
  handlePrevPanel = () => {
    this.props.handlePanel(panels.Homepage)
  }
  handleNextPanel = () => {
    this.props.handlePanel(panels.Calendar)
  }
  handleSaveSettings = () => {
    this.props.settingStore.save()
  }
  toogleResetAgreementActive = () => {
    this.setState({ resetAgreementActive: !this.state.resetAgreementActive })
  }
  PanelHeaderButtonPrev = (
    <PanelHeaderButton
      title="Перейти в описание"
      onClick={this.handlePrevPanel}
    >
      <Icon28ChevronBack />
    </PanelHeaderButton>
  )
  PanelHeaderButtonNext = (
    <PanelHeaderButton
      title="Перейти в календарь"
      onClick={this.handleNextPanel}
    >
      <Icon28CalendarOutline />
    </PanelHeaderButton>
  )
  SnackBarIcon = (<Icon28WarningTriangleOutline />)
  SnackBarIconUpdate = (
    <Icon28RefreshOutline
      className="snackBar_update"
      onClick={() => window.location.reload()}
    />
  )

  SwitchAccessMember = (
    <Observer>
      {() => (
        <Switch
          onChange={this.props.settingStore.changeAccessMember}
          checked={this.props.settingStore.dataAccessMember}
        />
      )}
    </Observer>
  )
  SwitchWidgetEnable = (
    <Observer>
      {() => (
        <Switch
          onChange={(e) => {
            this.props.settingStore.addWidget(e.currentTarget.checked)
          }}
          checked={this.props.settingStore.dataWidgetEnable}
        />
      )}
    </Observer>
  )

  CheckboxAllowedWeekDay = (
    <Observer>
      {() => (
        <div className="row-wrap">
          {this.props.settingStore.dataAllowedWeekDays.map(
            (isBlocked, index) => (
              <Checkbox
                key={index}
                checked={isBlocked}
                onChange={(e) => {
                  this.props.settingStore.changeAllowedWeekDays(
                    index,
                    e.target.checked,
                  )
                }}
              >
                {calendarWeekNames[index].small}
              </Checkbox>
            ),
          )}
        </div>
      )}
    </Observer>
  )

  BlockedPeriodField = (
    <Observer>
      {() => (
        <div className="row-wrap setting-period">
          От&nbsp;
          <Input
            type="date"
            value={this.props.settingStore.displayBlockedPeriod[0]}
            onChange={(e) => {
              this.props.settingStore.changeBlockedPeriod(
                0,
                e.currentTarget.value,
              )
            }}
            min={this.props.settingStore.displayMinStartBlockedPeriod}
            max={this.props.settingStore.displayMaxStartBlockedPeriod}
            alt="От"
          />
          <Icon16CancelCircleOutline
            onClick={() => {
              this.props.settingStore.changeBlockedPeriod(0, 0)
            }}
          />
          &nbsp;&nbsp;До&nbsp;
          <Input
            type="date"
            value={this.props.settingStore.displayBlockedPeriod[1]}
            onChange={(e) => {
              this.props.settingStore.changeBlockedPeriod(
                1,
                e.currentTarget.value,
              )
            }}
            min={this.props.settingStore.displayMinEndBlockedPeriod}
            max={this.props.settingStore.displayMaxEndBlockedPeriod}
            alt="До"
          />
          <Icon16CancelCircleOutline
            onClick={() => {
              this.props.settingStore.changeBlockedPeriod(1, 0)
            }}
          />
        </div>
      )}
    </Observer>
  )

  detailedCellSetting = (
    <ActionSheet
      className="calendar_detailedUsersInfo"
      onClose={this.props.settingStore.closeDetailedCellSetting}
      iosCloseItem={
        <ActionSheetItem autoclose mode="cancel">
          Закрыть
        </ActionSheetItem>
      }
    >
      <Observer>
        {() => (
          <>
            <ActionSheetItem autoclose={false}>
              <span className="calendar_detailedUsersInfo_label">
                Добавить описание:
              </span>
              <Input
                className="calendar_detailedUsersInfo_input_text inline"
                type="text"
                value={
                  this.props.settingStore.detailedCellSettingDay?.Description
                }
                onChange={(e) => {
                  this.props.settingStore.changeDetailedCellSettingDescription(
                    e.target.value,
                  )
                }}
                placeholder="Описание"
                alt="Добавить описание"
              />
              <Icon16CancelCircleOutline
                className="calendar_detailedUsersInfo_icon_clear inline"
                onClick={
                  this.props.settingStore.clearDetailedCellSettingDescription
                }
              />
            </ActionSheetItem>
            <ActionSheetItem autoclose={false}>
              <span className="calendar_detailedUsersInfo_label">
                Добавить фон:
              </span>
              <Input
                className="calendar_detailedUsersInfo_input_color inline"
                type="color"
                value={this.props.settingStore.detailedCellSettingDay?.Color}
                onChange={(e) => {
                  this.props.settingStore.changeDetailedCellSettingColor(
                    e.target.value,
                  )
                }}
                placeholder="Цвет"
                alt="Добавить фон"
              />
              <Icon16CancelCircleOutline
                className="calendar_detailedUsersInfo_icon_clear inline"
                onClick={this.props.settingStore.clearDetailedCellSettingColor}
              />
            </ActionSheetItem>
            <ActionSheetItem autoclose={false}>
              <div className="row-set">
                <Button
                  onClick={this.props.settingStore.saveDetailedCellSetting}
                  size="l"
                  stretched
                >
                  Сохранить
                </Button>
                <Button
                  onClick={this.props.settingStore.deleteDetailedCellSetting}
                  size="l"
                  stretched
                  mode="secondary"
                >
                  Удалить
                </Button>
              </div>
            </ActionSheetItem>
          </>
        )}
      </Observer>
    </ActionSheet>
  )

  renderCell = (day: ISettingCell, dayIndex: number) => {
    const {
      selectBlocked,
      openDetailedCellSetting,
      isSmallIcon,
    } = this.props.settingStore
    const iconSize = isSmallIcon ? 11 : undefined
    return (
      <div
        className={`col calendar_body_cell ${
          day.isCurrentMonth ? 'another' : ''
        } ${day.isBlocked ? 'blocked' : ''} ${
          day.isInnactive ? 'unselected' : ''
        } `}
        key={dayIndex}
        style={{ backgroundColor: day.Color ? hex2rgba(day.Color) : '' }}
      >
        <div
          className={`row calendar_body_cell_control ${
            day.isInnactive ? 'innactive' : ''
          }`}
        >
          <div
            className="calendar_body_cell_control_col_1 settings"
            onClick={() => {
              selectBlocked(day)
            }}
          >
            <span
              className={`calendar_body_cell_control_add inline ${
                day.isBlocked ? 'red' : day.isInnactive ? 'innactive' : 'green'
              }`}
            >
              {day.isBlocked ? (
                <Icon16CancelCircleOutline width={iconSize} height={iconSize} />
              ) : (
                <Icon16AddCircleOutline width={iconSize} height={iconSize} />
              )}
            </span>
            <span
              className={`calendar_body_cell_control_number ${
                day.isToday ? 'today' : ''
              }`}
            >
              {day.displayDay}
            </span>
          </div>
          <div
            className="calendar_body_cell_control_col_2"
            onClick={() => {
              openDetailedCellSetting(day)
            }}
          >
            <span>
              <Icon20WriteOutline
                width={iconSize}
                height={iconSize}
                className={`calendar_body_cell_control_edit inline ${
                  day.Description || day.Color ? 'changed' : ''
                }`}
              />
            </span>
          </div>
        </div>
      </div>
    )
  }

  render() {
    const {
      settingStore: {
        snackBarMessage,
        clearSnackBarMessage,
        prevMonth,
        nextMonth,
        currentMonthTitle,
        settingCells,
        isMobile,
        displayServerDate,
        dataAccessMember,
        detailedCellSettingOpened,
        resetSetting,
        dataWidgetEnable,
      },
      id,
    } = this.props
    return (
      <Panel id={id}>
        <PanelHeader
          left={this.PanelHeaderButtonPrev}
          right={this.PanelHeaderButtonNext}
        >
          Настройки
        </PanelHeader>

        <Group title="Общие">
          <Cell indicator={displayServerDate}>Время сервера</Cell>
          <Cell
            indicator={dataAccessMember ? 'Вкл' : 'Выкл'}
            after={this.SwitchAccessMember}
          >
            Разрешить запись только участникам сообщества
          </Cell>
          <Header mode="tertiary">Ограничение по дням недели</Header>
          <Cell>{this.CheckboxAllowedWeekDay}</Cell>
          <Header mode="tertiary">Исключить временной период</Header>
          <Cell>{this.BlockedPeriodField}</Cell>
        </Group>

        <Group title="Виджет группы">
          <Cell
            indicator={dataWidgetEnable ? 'Вкл' : 'Выкл'}
            after={this.SwitchWidgetEnable}
          >
            Автопубликация виджета в сообществе
          </Cell>
        </Group>

        <Group title="Выбрать день">
          <div className="calendar">
            <CalendarHeader
              prevMonth={prevMonth}
              nextMonth={nextMonth}
              currentMonthTitle={currentMonthTitle}
            />
            <CalendarWeekNames isMobile={isMobile} />
            <div className="calendar_body setting">
              {settingCells.map((week, weekIndex) => (
                <div className="row" key={weekIndex}>
                  {week.map((day, dayIndex) => this.renderCell(day, dayIndex))}
                </div>
              ))}
            </div>
          </div>
        </Group>
        {detailedCellSettingOpened && this.detailedCellSetting}

        <Group title="Сохранить настройки">
          <div className="row-set">
            <Button onClick={this.handleSaveSettings} size="l" stretched>
              Сохранить
            </Button>
            <Button
              onClick={this.toogleResetAgreementActive}
              size="l"
              stretched
              mode="secondary"
            >
              Сбросить все настройки
            </Button>
          </div>
        </Group>

        {!!snackBarMessage && (
          <Snackbar
            before={this.SnackBarIcon}
            after={this.SnackBarIconUpdate}
            onClose={clearSnackBarMessage}
            onActionClick={clearSnackBarMessage}
          >
            {snackBarMessage}
          </Snackbar>
        )}
        {this.state.resetAgreementActive && (
          <Alert
            actions={[
              {
                title: 'Отмена',
                autoclose: true,
                mode: 'cancel',
              },
              {
                title: 'Сбросить',
                autoclose: true,
                mode: 'destructive',
                action: resetSetting,
              },
            ]}
            actionsLayout="horizontal"
            onClose={this.toogleResetAgreementActive}
            header="Сброс настроек"
            text="Вы уверены, что хотите сбросить все настройки группы?"
          />
        )}
      </Panel>
    )
  }
}

export default (inject('settingStore')(
  observer(Setting),
) as unknown) as React.ComponentType<Omit<IProps, 'settingStore'>>
