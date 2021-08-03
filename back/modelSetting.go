package main

import (
	"strconv"
	"strings"
)

type IresultGroupSetting struct {
	CurrentDateNow int64
	Isettings_allowed
	SettingBlockedDays Isettings_blockedDays
	SettingSpecialDays Isettings_specialDays
}
type IrowSetting struct {
	option_name  string
	option_value string
}
type Isettings_allowed struct {
	SettingAccessMember    bool
	SettingAllowedWeekDays [7]bool
	SettingBlockedPeriod   [2]int64
	SettingWidgetEnable    bool
	SettingWidgetToken     string
}
type Isettings_blockedDays []int64

//Включена ли опция права в группах
var AccessMemberGroups = make(map[int64]bool)

func selectGroupSetting(group_id int64) (bool, IresultGroupSetting) {
	const selectQuery = "SELECT option_name, option_value FROM `settings_allowed` WHERE group_id=?; "
	selectedRows, err := DB.Query(selectQuery, group_id)
	if err != nil {
		return false, IresultGroupSetting{}
	}
	defer selectedRows.Close()

	dataSetting := Isettings_allowed{}

	for selectedRows.Next() {
		var row IrowSetting
		err := selectedRows.Scan(&row.option_name, &row.option_value)
		if err != nil {
			return false, IresultGroupSetting{}
		}

		switch row.option_name {
		case "accessMember":
			dataSetting.SettingAccessMember = row.option_value == "1"
			AccessMemberGroups[group_id] = dataSetting.SettingAccessMember
		case "allowedWeekDays":
			days := strings.Split(row.option_value, ",")
			var values [7]bool
			for i := 0; i < 7; i++ {
				values[i] = (days[i] == "1")
			}
			dataSetting.SettingAllowedWeekDays = values
		case "blockedPeriod":
			days := strings.Split(row.option_value, ",")
			dayStart, err := strconv.ParseInt(days[0], 10, 64)
			if err != nil {
				dayStart = 0
			}
			dayEnd, err := strconv.ParseInt(days[1], 10, 64)
			if err != nil {
				dayEnd = 0
			}
			dataSetting.SettingBlockedPeriod = [2]int64{dayStart, dayEnd}
		case "widgetEnable":
			dataSetting.SettingWidgetEnable = row.option_value == "1"
		case "widgetToken":
			dataSetting.SettingWidgetToken = row.option_value
		}
	}

	blockedDays := getBlockedDays(group_id)
	_, specialDays := getSpecialDays(group_id)

	CurrentDateNow := transformDate(currentDateNow(), false)
	return true, IresultGroupSetting{CurrentDateNow, dataSetting, blockedDays, specialDays}
}

func getBlockedDays(group_id int64) Isettings_blockedDays {
	blockedDays := make(Isettings_blockedDays, 0)

	const selectQueryDays = "SELECT date FROM `settings_blockedDays` WHERE group_id=?; "
	selectedRowsDays, err := DB.Query(selectQueryDays, group_id)
	if err != nil {
		return blockedDays
	}
	defer selectedRowsDays.Close()

	for selectedRowsDays.Next() {
		var date int64
		err := selectedRowsDays.Scan(&date)
		if err != nil {
			return blockedDays
		}

		blockedDays = append(blockedDays, date)
	}

	return blockedDays
}

func checkDefaultSettingIsNeeded(group_id int64) bool {
	count := 0

	const selectCount = "SELECT COUNT(*) FROM `settings_allowed` WHERE group_id=?; "
	if err := DB.QueryRow(selectCount, group_id).Scan(&count); err != nil {
		count = 0
	}
	if count >= settingOptionsCount {
		return false
	}
	//Настройки не были созданы
	return true
}
func createDefaultSetting(group_id int64) (bool, IresultGroupSetting) {
	var option_name [settingOptionsCount]string
	var option_value [settingOptionsCount]string

	AccessMemberGroups[group_id] = false

	option_name[0] = "accessMember"
	option_name[1] = "allowedWeekDays"
	option_name[2] = "blockedPeriod"
	option_name[3] = "widgetEnable"
	option_name[4] = "widgetToken"

	option_value[0] = "0"
	option_value[1] = "0,0,0,0,0,0,0"
	option_value[2] = "0,0"
	option_value[3] = "0"
	option_value[4] = "''"

	const deleteQuery = "DELETE FROM `settings_allowed` WHERE group_id=?; "
	if _, err := DB.Exec(deleteQuery, group_id); err != nil {
		return false, IresultGroupSetting{}
	}

	CurrentDateNow := currentDateNow()
	const insertQuery = "INSERT INTO `settings_allowed` (group_id, option_name, option_value, creating) VALUES (?, ?, ?, ?), (?, ?, ?, ?), (?, ?, ?, ?), (?, ?, ?, ?), (?, ?, ?, ?); "
	if _, err := DB.Exec(insertQuery,
		group_id, option_name[0], option_value[0], CurrentDateNow,
		group_id, option_name[1], option_value[1], CurrentDateNow,
		group_id, option_name[2], option_value[2], CurrentDateNow,
		group_id, option_name[3], option_value[3], CurrentDateNow,
		group_id, option_name[4], option_value[4], CurrentDateNow); err != nil {
		return false, IresultGroupSetting{}
	}

	return true, IresultGroupSetting{transformDate(CurrentDateNow, false), Isettings_allowed{false, [7]bool{false, false, false, false, false, false, false}, [2]int64{0, 0}, false, ""}, Isettings_blockedDays{}, Isettings_specialDays{}}
}

func updateGroupSetting(group_id int64, validSetting IvalidSetting) bool {
	CurrentDateNow := currentDateNow()

	const selectQuery = "UPDATE `settings_allowed` SET option_value=?, creating=? WHERE group_id=? AND option_name=?; "

	if _, err := DB.Exec(selectQuery, validSetting.SettingAccessMember, CurrentDateNow, group_id, "accessMember"); err != nil {
		return false
	}
	if validSetting.SettingAccessMember == "1" {
		AccessMemberGroups[group_id] = true
	} else {
		AccessMemberGroups[group_id] = false
	}

	if _, err := DB.Exec(selectQuery, validSetting.SettingAllowedWeekDays, CurrentDateNow, group_id, "allowedWeekDays"); err != nil {
		return false
	}
	if _, err := DB.Exec(selectQuery, validSetting.SettingBlockedPeriod, CurrentDateNow, group_id, "blockedPeriod"); err != nil {
		return false
	}
	if _, err := DB.Exec(selectQuery, validSetting.SettingWidgetEnable, CurrentDateNow, group_id, "widgetEnable"); err != nil {
		return false
	}
	if _, err := DB.Exec(selectQuery, validSetting.SettingWidgetToken, CurrentDateNow, group_id, "widgetToken"); err != nil {
		return false
	}

	return true
}

func updateGroupSettingBlockedDays(group_id int64, blockedDays Isettings_blockedDays) bool {
	if len(blockedDays) == 0 {
		return true
	}

	deleteGroupSettingBlockedDays(group_id)

	CurrentDateNow := currentDateNow()
	insertQuery := "INSERT INTO `settings_blockedDays` (group_id, date, creating) VALUES"
	for i, date := range blockedDays {
		insertQuery += " (" + strconv.FormatInt(group_id, 10) + ", " + strconv.FormatInt(date, 10) + ", " + strconv.FormatInt(CurrentDateNow, 10) + ")"
		if i == len(blockedDays)-1 {
			insertQuery += "; "
		} else {
			insertQuery += ", "
		}
	}
	if _, err := DB.Exec(insertQuery); err != nil {
		return false
	}

	return true
}

func deleteGroupSettingBlockedDays(group_id int64) bool {
	const deleteQuery = "DELETE FROM `settings_blockedDays` WHERE group_id=?; "
	if _, err := DB.Exec(deleteQuery, group_id); err != nil {
		return false
	}

	return true
}

func resetGroupSetting(group_id int64) bool {
	if success, _ := createDefaultSetting(group_id); !success {
		return false
	}
	if success := deleteGroupSettingBlockedDays(group_id); !success {
		return false
	}
	if success := deleteSpecialDays(group_id); !success {
		return false
	}
	if success := clearPinnedDate(group_id); !success {
		return false
	}

	return true
}

type Isettings_specialDays map[int64]IspecialDay
type IspecialDay struct {
	Description string
	Color       string
}

func updateSpecialDays(group_id int64, specialDays Isettings_specialDays) bool {
	if len(specialDays) == 0 {
		return true
	}

	CurrentDateNow := currentDateNow()
	insertQuery := "INSERT INTO `settings_specialDays` (group_id, date, description, color, creating) VALUES "

	i := 0
	for date, val := range specialDays {
		if val.Description == "" && val.Color == "" {
			deleteSpecialDay(group_id, date)
		} else {
			insertQuery += "(" + strconv.FormatInt(group_id, 10) + ", " + strconv.FormatInt(date, 10) + ", '" + val.Description + "', '" + val.Color + "', " + strconv.FormatInt(CurrentDateNow, 10) + ")"

			if i == len(specialDays)-1 {
				insertQuery += "AS new ON DUPLICATE KEY UPDATE description=values(description), color=values(color); "
			} else {
				insertQuery += ", "
			}
		}

		i++
	}

	if _, err := DB.Exec(insertQuery); err != nil {
		return false
	}

	return true
}
func deleteSpecialDays(group_id int64) bool {
	const deleteQuery = "DELETE FROM `settings_specialDays` WHERE group_id=?; "
	if _, err := DB.Exec(deleteQuery, group_id); err != nil {
		return false
	}

	return true
}
func deleteSpecialDay(group_id int64, date int64) bool {
	const deleteQuery = "DELETE FROM `settings_specialDays` WHERE group_id=? AND date=?; "
	if _, err := DB.Exec(deleteQuery, group_id); err != nil {
		return false
	}

	return true
}

type Irow_specialDays struct {
	date        int64
	description string
	color       string
}

func getSpecialDays(group_id int64) (bool, Isettings_specialDays) {
	const selectQuery = "SELECT date, description, color FROM `settings_specialDays` WHERE group_id=?; "
	selectedRows, err := DB.Query(selectQuery, group_id)
	if err != nil {
		return false, Isettings_specialDays{}
	}
	defer selectedRows.Close()

	specialDays := make(Isettings_specialDays)
	for selectedRows.Next() {
		var row Irow_specialDays
		err := selectedRows.Scan(&row.date, &row.description, &row.color)
		if err != nil {
			return false, specialDays
		}

		specialDays[transformDate(row.date, false)] = IspecialDay{
			row.description,
			row.color,
		}
	}

	return true, specialDays
}
