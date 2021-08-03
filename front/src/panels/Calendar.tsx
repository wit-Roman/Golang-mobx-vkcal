import React from "react";
import { inject, observer, Observer } from "mobx-react";

import {
	Panel,
	PanelHeader,
	PanelHeaderButton,
	Group,
	Avatar,
	Snackbar,
	ActionSheet,
	ActionSheetItem,
	Link,
} from "@vkontakte/vkui";

import {
	Icon28ChevronBack,
	Icon16CheckCircleOutline,
	Icon16CancelCircleOutline,
	Icon16AddCircleOutline,
	Icon16ClockCircleFill,
	Icon16SearchOutline,
	Icon20PinOutline,
	Icon20PinSlashOutline,
	Icon12Lock,
	Icon16Linked,
	Icon28WarningTriangleOutline,
	Icon28RefreshOutline,
} from "@vkontakte/icons";

import { CalendarWeekNames, CalendarHeader } from "../components/CalendarPart";
import { panels } from "../constants";
import { ICalendarStore, ICurrentCell } from "../store/storeTypes";

interface IProps {
	id: panels;
	handlePanel(panel: panels): void;
	calendarStore: ICalendarStore;
}

class Calendar extends React.Component<IProps> {
	componentDidMount() {
		this.props.calendarStore.init();
	}
	componentWillUnmount() {
		this.props.calendarStore.dispose();
	}

	handlePrevPanel = () => {
		this.props.handlePanel(panels.Homepage);
	};

	PanelHeaderButtonPrev = (
		<PanelHeaderButton title="Перейти в описание" onClick={this.handlePrevPanel}>
			<Icon28ChevronBack />
		</PanelHeaderButton>
	);
	PanelHeaderButtonNext = (<Avatar size={36} src={this.props.calendarStore.currentUserPhoto_100} />);
	SnackBarIcon = (<Icon28WarningTriangleOutline />);
	SnackBarIconUpdate = (
		<Icon28RefreshOutline className="snackBar_update" onClick={() => window.location.reload()} />
	);

	detailedUsersInfo = (
		<ActionSheet
			className="calendar_detailedUsersInfo"
			onClose={this.props.calendarStore.closeDetailedUsersInfo}
			iosCloseItem={
				<ActionSheetItem autoclose mode="cancel">
					Закрыть
				</ActionSheetItem>
			}
		>
			<Observer>
				{() => (
					<>
						{this.props.calendarStore.detailedInfoData ? (
							<ActionSheetItem autoclose={false}>
								{this.props.calendarStore.detailedInfoData}
							</ActionSheetItem>
						) : null}
						{this.props.calendarStore.detailedUsersInfoData?.map((user, index) => (
							<ActionSheetItem key={index} autoclose={false}>
								<div className="row">
									<Avatar
										src={user.Photo_100}
										alt={user.First_name + " " + user.Last_name}
										size={24}
										className="inline"
									/>
									&nbsp;
									{user.First_name}
									&nbsp;
									{user.Last_name}
									&nbsp;
									<Link
										href={"https://vk.com/id" + user.viewer_id}
										title={user.First_name + " " + user.Last_name}
										target="_blank"
										rel="noopener noreferrer"
									>
										Перейти
										<Icon16Linked className="inline" />
									</Link>
									{this.props.calendarStore.isRedactorRights ? (
										user.IsPinned ? (
											<Icon20PinSlashOutline
												className="calendar_detailed_pinned cancel"
												onClick={() => {
													this.props.calendarStore.pinViewerDate(
														user.date,
														user.viewer_id,
														false
													);
												}}
											/>
										) : (
											<Icon20PinOutline
												className="calendar_detailed_pinned"
												onClick={() => {
													this.props.calendarStore.pinViewerDate(
														user.date,
														user.viewer_id,
														true
													);
												}}
											/>
										)
									) : null}
								</div>
							</ActionSheetItem>
						))}
					</>
				)}
			</Observer>
		</ActionSheet>
	);

	renderCell = (day: ICurrentCell, dayIndex: number) => {
		const { select, openDetailedUsersInfo } = this.props.calendarStore;
		const displayUsersLength = day.displayUsers?.length;

		return (
			<div
				className={`col calendar_body_cell ${day.isCurrentMonth ? "another" : ""} ${
					day.isSelected ? "selected" : ""
				} ${day.isInnactive ? "unselected" : ""} `}
				key={dayIndex}
				style={{ backgroundColor: day.color }}
			>
				<div className={`row calendar_body_cell_control ${day.isInnactive ? "innactive" : ""}`}>
					<div
						className="calendar_body_cell_control_col_1"
						onClick={() => {
							select(day);
						}}
					>
						<span
							className={`calendar_body_cell_control_add inline ${
								day.isInnactive ? "innactive" : day.isSelected ? "blue" : "green"
							}`}
						>
							{day.isInnactive ? (
								day.isSelected ? (
									<Icon16CheckCircleOutline />
								) : (
									<Icon16ClockCircleFill />
								)
							) : day.isSelected ? (
								<Icon16CancelCircleOutline />
							) : (
								<Icon16AddCircleOutline />
							)}
						</span>
						<span className={`calendar_body_cell_control_number ${day.isToday ? "today" : ""}`}>
							{day.displayDay}
						</span>
					</div>
					{(!!displayUsersLength || !!day.description) && (
						<div
							className="calendar_body_cell_control_col_2"
							onClick={() => {
								openDetailedUsersInfo(day.cacheDay);
							}}
						>
							{displayUsersLength ? (
								<span className="calendar_body_cell_control_count">{displayUsersLength}</span>
							) : null}
							<span className="calendar_body_cell_control_search inline">
								<Icon16SearchOutline />
							</span>
						</div>
					)}
				</div>
				<div
					className="calendar_body_cell_users_wrap"
					onClick={() => {
						select(day);
					}}
				>
					<div className="calendar_body_cell_users">
						{day.displayUsers?.map((user, userIndex) => (
							<div key={userIndex} className={`calendar_body_cell_item ${user.IsPinned ? "pinned" : ""}`}>
								<Avatar src={user.Photo_100} alt={user.First_name + " " + user.Last_name} size={24} />
								{user.IsPinned && <Icon12Lock className="pinned_icon" />}
							</div>
						))}
					</div>
				</div>
			</div>
		);
	};

	render() {
		const {
			calendarStore: {
				currentCells,
				detailedUsersInfoData,
				detailedInfoData,
				snackBarMessage,
				clearSnackBarMessage,
				isMobile,
				prevMonth,
				nextMonth,
				currentMonthTitle,
			},
			id,
		} = this.props;

		return (
			<Panel id={id}>
				<PanelHeader left={this.PanelHeaderButtonPrev} right={this.PanelHeaderButtonNext}>
					Посещения
				</PanelHeader>

				<Group title="Выбрать день">
					<div className="calendar">
						<CalendarHeader
							prevMonth={prevMonth}
							nextMonth={nextMonth}
							currentMonthTitle={currentMonthTitle}
						/>
						<CalendarWeekNames isMobile={isMobile} />
						<div className="calendar_body">
							{currentCells.map((week, weekIndex) => (
								<div className="row" key={weekIndex}>
									{week.map((day, dayIndex) => this.renderCell(day, dayIndex))}
								</div>
							))}
						</div>
					</div>
				</Group>
				{(!!detailedUsersInfoData?.length || !!detailedInfoData) && this.detailedUsersInfo}
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
			</Panel>
		);
	}
}

export default inject("calendarStore")(observer(Calendar)) as unknown as React.ComponentType<
	Omit<IProps, "calendarStore">
>;
