import { observable, computed, action, runInAction } from "mobx";
import {
	format,
	addMonths,
	subMonths,
	getWeeksInMonth,
	startOfWeek,
	startOfMonth,
	isSameMonth,
	addDays,
	isSameDay,
	startOfDay,
	addYears,
	addWeeks,
	endOfWeek,
	getDate,
} from "date-fns";
import ruLocale from "date-fns/locale/ru";
import { app_id, calendarWeekNames } from "../constants";
import { IApi, ISettingStore, ISettingCell, IdataSpecialDays } from "./storeTypes";

export default class SettingStore implements ISettingStore {
	private currentDateNow: number = Date.now();
	displayServerDate = "";
	displayMinStartBlockedPeriod = "";
	displayMaxEndBlockedPeriod = "";
	@observable private startOfMonthDate = Date.parse(startOfMonth(this.currentDateNow).toString());
	private endOfCurrentDateDay = Date.parse(startOfDay(this.currentDateNow).toString());

	isMobile = false;
	@observable snackBarMessage = "";
	@observable dataBlockedDays: number[] = [];
	@observable dataAllowedWeekDays: boolean[] = [];
	@observable dataBlockedPeriod: [number, number] = [0, 0];
	@observable dataAccessMember = false;
	@observable dataWidgetEnable = false;
	@observable detailedCellSettingOpened = false;
	@observable detailedCellSettingDay?: ISettingCell;
	@observable dataSpecialDays: IdataSpecialDays = {};

	constructor(private api: IApi) {}

	async init() {
		try {
			const result = await this.api.backGetSetting();
			if (!result) return;
			runInAction(() => {
				this.currentDateNow = result.CurrentDateNow;
				this.isMobile = this.api.isMobile;
				this.startOfMonthDate = Date.parse(startOfMonth(this.currentDateNow).toString());
				this.endOfCurrentDateDay = Date.parse(startOfDay(this.currentDateNow).toString());

				this.dataBlockedDays = result.SettingBlockedDays;
				this.dataAllowedWeekDays = result.SettingAllowedWeekDays;
				this.dataBlockedPeriod = result.SettingBlockedPeriod;
				this.dataAccessMember = result.SettingAccessMember;
				this.dataWidgetEnable = result.SettingWidgetEnable;
				this.dataSpecialDays = result.SettingSpecialDays;

				this.displayServerDate = new Date(this.currentDateNow).toISOString();
				this.displayMinStartBlockedPeriod = format(startOfDay(this.currentDateNow), "yyyy-MM-dd");
				this.displayMaxEndBlockedPeriod = format(addYears(this.currentDateNow, 1), "yyyy-MM-dd");
			});
		} catch (error) {
			runInAction(() => {
				this.snackBarMessage = "Ошибка авторизации, обновите страницу";
			});

			throw error;
		}
	}

	@computed
	get settingCells() {
		const weeksInMonth = getWeeksInMonth(this.startOfMonthDate, {
			weekStartsOn: 1,
		});
		let iterableDay = startOfWeek(this.startOfMonthDate, { weekStartsOn: 1 });

		return Array.apply(null, Array(weeksInMonth)).map((_weekPlug) =>
			Array.apply(null, Array(7)).map((_dayPlug, dayIndex) => {
				const cacheDay = Date.parse(iterableDay.toString());
				iterableDay = addDays(iterableDay, 1);

				return {
					cacheDay,
					displayDay: format(cacheDay, "d", { locale: ruLocale }),
					isBlocked: this.dataBlockedDays.includes(cacheDay),
					isToday: isSameDay(cacheDay, this.currentDateNow),
					isCurrentMonth: !isSameMonth(cacheDay, this.startOfMonthDate),
					isInnactive: this.checkIsInnactive(cacheDay, dayIndex),
					Description: this.dataSpecialDays[cacheDay]?.Description || "",
					Color: this.dataSpecialDays[cacheDay]?.Color || "",
				} as ISettingCell;
			})
		);
	}

	@action.bound
	nextMonth() {
		this.startOfMonthDate = Date.parse(addMonths(this.startOfMonthDate, 1).toString());
	}

	@action.bound
	prevMonth() {
		this.startOfMonthDate = Date.parse(subMonths(this.startOfMonthDate, 1).toString());
	}

	@action.bound
	clearSnackBarMessage() {
		this.snackBarMessage = "";
	}

	@computed
	get currentMonthTitle() {
		return format(this.startOfMonthDate, "LLLL yyyy", {
			locale: ruLocale,
		});
	}

	@action.bound
	selectBlocked = (day: ISettingCell) => {
		if (day.isBlocked) {
			this.dataBlockedDays = this.dataBlockedDays.filter((date) => date !== day.cacheDay);
			day.isBlocked = false;
		} else {
			if (this.dataBlockedDays.length > 64) {
				this.snackBarMessage = "Количество заблокированных дней не должно превышать 64";
				return;
			}
			this.dataBlockedDays.push(day.cacheDay);
			day.isBlocked = true;
		}
	};

	private checkIsInnactive(day: number, dayInWeekIndex: number) {
		return (
			this.dataBlockedDays.includes(day) || //день исключен
			this.dataAllowedWeekDays[dayInWeekIndex] || //день недели исключен
			day < this.endOfCurrentDateDay || //прошедший день
			(this.dataBlockedPeriod[0] &&
				this.dataBlockedPeriod[1] &&
				day >= this.dataBlockedPeriod[0] &&
				day < this.dataBlockedPeriod[1]) //день входит в период
		);
	}

	@action.bound
	changeAccessMember() {
		this.dataAccessMember = !this.dataAccessMember;
	}

	@action.bound
	changeAllowedWeekDays(index: number, isChecked: boolean) {
		this.dataAllowedWeekDays[index] = isChecked;
	}

	@action.bound
	changeBlockedPeriod(index: number, value: string | number) {
		this.dataBlockedPeriod[index] = index ? new Date(value).valueOf() : startOfDay(new Date(value)).valueOf();
	}

	@computed
	get displayBlockedPeriod() {
		return [
			this.dataBlockedPeriod[0] ? format(this.dataBlockedPeriod[0], "yyyy-MM-dd") : 0,
			this.dataBlockedPeriod[1] ? format(this.dataBlockedPeriod[1], "yyyy-MM-dd") : 0,
		] as [string, string];
	}

	@computed
	get displayMaxStartBlockedPeriod() {
		return this.dataBlockedPeriod[1]
			? format(this.dataBlockedPeriod[1], "yyyy-MM-dd")
			: this.displayMaxEndBlockedPeriod;
	}

	@computed
	get displayMinEndBlockedPeriod() {
		return this.dataBlockedPeriod[0]
			? format(this.dataBlockedPeriod[0], "yyyy-MM-dd")
			: this.displayMinStartBlockedPeriod;
	}

	@action.bound
	async save() {
		try {
			const setting = {
				AccessMember: this.dataAccessMember,
				AllowedWeekDays: this.dataAllowedWeekDays,
				BlockedPeriod: this.dataBlockedPeriod,
				WidgetEnable: this.dataWidgetEnable,
				BlockedDays: this.dataBlockedDays,
				SpecialDays: this.dataSpecialDays,
			};

			const result = await this.api.backSaveSetting(setting);

			runInAction(() => {
				this.snackBarMessage = result ? "Настройки сохранены" : "Ошибка авторизации, обновите страницу";
			});
		} catch (error) {
			runInAction(() => {
				this.snackBarMessage = "Ошибка при сохранении";
			});

			throw error;
		}
	}

	@action.bound
	async resetSetting() {
		try {
			const result = await this.api.backDeleteSetting();
			runInAction(() => {
				this.snackBarMessage = result ? "Настройки сброшены" : "Ошибка авторизации, обновите страницу";
				if (result) this.init();
			});
		} catch (error) {
			runInAction(() => {
				this.snackBarMessage = "Ошибка при удалении";
			});

			throw error;
		}
	}

	@action.bound
	openDetailedCellSetting(day: ISettingCell) {
		this.detailedCellSettingOpened = true;
		this.detailedCellSettingDay = day;
	}
	@action.bound
	closeDetailedCellSetting() {
		this.detailedCellSettingOpened = false;
		this.detailedCellSettingDay = undefined;
	}
	@action.bound
	clearDetailedCellSettingDescription() {
		if (!this.detailedCellSettingDay) return;
		this.detailedCellSettingDay.Description = "";
	}
	@action.bound
	clearDetailedCellSettingColor() {
		if (!this.detailedCellSettingDay) return;
		this.detailedCellSettingDay.Color = "";
	}
	@action.bound
	changeDetailedCellSettingDescription(description: string) {
		if (!this.detailedCellSettingDay) return;
		this.detailedCellSettingDay.Description = description;
	}
	@action.bound
	changeDetailedCellSettingColor(color: string) {
		if (!this.detailedCellSettingDay) return;
		this.detailedCellSettingDay.Color = color;
	}
	@action.bound
	saveDetailedCellSetting() {
		if (!this.detailedCellSettingDay) return;

		if (Object.entries(this.dataSpecialDays).length > 64) {
			this.snackBarMessage = "Достигнут лимит 64, удалите предыдущие";
			return;
		}

		if (this.detailedCellSettingDay.Description.length > 78 || this.detailedCellSettingDay.Color.length > 30) {
			this.snackBarMessage = "Максимальная длина поля 80 символов";
			return;
		}

		if (!this.detailedCellSettingDay.Description && !this.detailedCellSettingDay.Color) {
			this.deleteDetailedCellSetting();
			return;
		}

		this.dataSpecialDays[this.detailedCellSettingDay.cacheDay] = {
			Description: this.detailedCellSettingDay.Description,
			Color: this.detailedCellSettingDay.Color,
		};

		/*this.snackBarMessage = !this.detailedCellSettingDay.Description
      ? 'Рамка добавлена ко дню'
      : !this.detailedCellSettingDay.Color
      ? 'Описание добавлено ко дню'
      : 'Описание и рамка добавлены ко дню'*/

		this.closeDetailedCellSetting();
	}
	@action.bound
	deleteDetailedCellSetting() {
		if (!this.detailedCellSettingDay) return;

		this.dataSpecialDays[this.detailedCellSettingDay.cacheDay] = {
			Description: "",
			Color: "",
		};

		this.closeDetailedCellSetting();
	}

	//Widget
	@action.bound
	async addWidget(check: boolean) {
		if (!check) {
			this.dataWidgetEnable = false;
			return;
		}

		try {
			const countSelectedDates = await this.api.backGetCountSelectedDates();

			const startDate = startOfWeek(this.currentDateNow, { weekStartsOn: 1 });
			//const monthEnd = endOfMonth(currentDate)
			const periodEnd = addWeeks(startDate, 5);
			const endDate = endOfWeek(periodEnd);
			const startDateformated = format(startDate, "dd.MM.yyyy");
			const endDateformated = format(endDate, "dd.MM.yyyy");

			let day = startDate;
			let count = 0;
			const num_count = (w: number) => {
				const n = getDate(day);
				const d = Date.parse(day.toString());
				let c = countSelectedDates[d] || 0;
				count += c;
				//@ts-ignore
				if (this.checkIsInnactive(d, w)) c += " *";

				day = addDays(day, 7);
				return n + " | " + c;
			};

			let body = "";
			for (let i = 0; i < calendarWeekNames.length; i++) {
				body +=
					'[{ \
          "text": "' +
					calendarWeekNames[i].full +
					'", \
          }, \
          { \
            "text": "' +
					num_count(i) +
					'", \
          }, \
          { \
            "text": "' +
					num_count(i) +
					'", \
          }, \
          { \
            "text": "' +
					num_count(i) +
					'", \
          }, \
          { \
            "text": "' +
					num_count(i) +
					'", \
          }, \
          { \
            "text": "' +
					num_count(i) +
					'", \
          }, \
          ], \
        ';
				day = addDays(startDate, i + 1);
			}

			const code = (group_id: number) =>
				'return { \
        "title": "Посещения на ' +
				startDateformated +
				" - " +
				endDateformated +
				'", \
        "title_counter": ' +
				count +
				', \
        "more": "Открыть в приложении ", \
        "more_url": "https://vk.com/club' +
				group_id +
				"?w=app" +
				app_id +
				"_-" +
				group_id +
				'", \
        "body": [ \
            ' +
				body +
				"\
        ] \
      };";

			const result = await this.api.bridgeAddWidget(code);
			if (result) {
				runInAction(() => {
					this.dataWidgetEnable = true;
					this.snackBarMessage = "Виджет создан";
				});
			} else {
				runInAction(() => {
					this.dataWidgetEnable = false;
					this.snackBarMessage = "Запрос не отправлен";
				});
			}

			if (this.dataWidgetEnable) {
				const result = await this.api.backEnableWidget();
				console.log(result);
				this.dataWidgetEnable = !!result?.Enabled;
			}
		} catch (error) {
			runInAction(() => {
				this.snackBarMessage = "Запрос не отправлен";
			});
			throw error;
		}
	}
}
