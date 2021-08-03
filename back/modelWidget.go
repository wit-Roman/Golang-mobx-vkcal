package main

import (
	"encoding/json"
	"net/http"
	"net/url"
	"strconv"
	"time"
)

var activeWidgetStore = make(map[int64]string)

type IreqWidgetParam struct {
	Type         string `json:"type"`
	Access_token string `json:"access_token"`
	Code         string `json:"code"`
	C            string `json:"v"`
}

func generateGroupWidget(group_id int64, SettingWidgetEnable string, SettingWidgetToken string) bool {
	if SettingWidgetEnable == "1" && len(SettingWidgetToken) == 85 && sendGroupWidget(group_id, SettingWidgetToken) {
		activeWidgetStore[group_id] = SettingWidgetToken
		toggleGroupWidget(group_id, SettingWidgetToken, true)
		return true
	} else {
		delete(activeWidgetStore, group_id)
		toggleGroupWidget(group_id, "", false)
		return false
	}
}

func sendGroupWidget(group_id int64, SettingWidgetToken string) bool {
	success, widgetCode := createWidgetCode(group_id)
	if !success {
		return false
	}
	postBody := url.Values{
		"type":         {"table"},
		"access_token": {SettingWidgetToken},
		"code":         {widgetCode},
		"v":            {"5.92"},
	}
	resp, err := http.PostForm("https://api.vk.com/method/appWidgets.update", postBody)
	if err != nil {
		return false
	}
	
	var res map[string]int
	json.NewDecoder(resp.Body).Decode(&res)

	return (res["response"] == 1 && len(activeWidgetStore) < 64)
}

func toggleGroupWidget(group_id int64, WidgetToken string, isset bool) bool {
	CurrentDateNow := currentDateNow()
	if isset {
		const selectQuery1 = "UPDATE `settings_allowed` SET option_value='1', creating=? WHERE group_id=? AND option_name='widgetEnable'; "
		if _, err := DB.Exec(selectQuery1, CurrentDateNow, group_id); err != nil {
			return false
		}

		const selectQuery2 = "UPDATE `settings_allowed` SET option_value=?, creating=? WHERE group_id=? AND option_name='widgetToken'; "
		if _, err := DB.Exec(selectQuery2, WidgetToken, CurrentDateNow, group_id); err != nil {
			return false
		}
	} else {
		const selectQuery = "UPDATE `settings_allowed` SET option_value='0', creating=? WHERE group_id=? AND option_name='widgetEnable'; "
		if _, err := DB.Exec(selectQuery, CurrentDateNow, group_id); err != nil {
			return false
		}
	}

	return true
}

func createWidgetCode(group_id int64) (bool,string) {
	success, countSelectedDates := getCountSelectedGroupDates(group_id)
	if !success {
		return  false, ""
	}

	success, settings := selectGroupSetting(group_id)
	if !success {
		return  false, ""
	}

	title_counter := int64(0)
	for _, count := range countSelectedDates {
		title_counter += count
	}

	var weekDays = [7]string{"Понедельник", "Вторник", "Среда","Четверг","Пятница","Суббота","Воскресенье"}
	day:=int64(24*60*60)
	currentDate :=  (currentDateNow() / day)  * day - 3*60*60
	weekday := int64(time.Now().Weekday())
	if weekday == 0 {
		weekday = 6
	} else {
		weekday = weekday - 1
	}
	startDate := currentDate - weekday*day
	endDate := startDate + day*7*5
	startDateformated := time.Unix(startDate, 0).Format("02-01-2006")
	endDateformated := time.Unix(endDate,0).Format("02-01-2006")
	more_url := "https://vk.com/club"+strconv.FormatInt(group_id,10)+"?w=app"+strconv.FormatInt(app_id,10)+"_-"+strconv.FormatInt(group_id,10)

	checkIsInnactive := func(day int64, weekIndex int) bool {
		for _, blockDay := range settings.SettingBlockedDays {
			if blockDay == day*1000 {
				return true
			}
		}
		if settings.SettingAllowedWeekDays[weekIndex] {
			return true
		}
		if day < currentDate {
			return true
		}
		if period1 := settings.SettingBlockedPeriod[0]; period1 != 0 && day*1000 > period1 {
			return true
		}
		if period2 := settings.SettingBlockedPeriod[0]; period2 != 0 && day*1000 < period2 {
			return true
		}

		return false
	}
	
	iterableDay := startDate
	bodyStr := `[ `
	for j, weekDay := range weekDays {
		iterableDay = startDate + day*int64(j)
		bodyStr += `[ { "text": "`+ weekDay + `", },`
		for i := 0; i < 5; i++ {
			dateStr := "0"
			date, isset := countSelectedDates[iterableDay*1000]
			if isset {
				dateStr = strconv.FormatInt(date,10)
			}

			active := ""
			if isInnactive := checkIsInnactive(iterableDay, j); isInnactive {
				active = "*"
			}
			bodyStr += `{ "text": "`+ time.Unix(iterableDay, 0).Format("02") + `|` + dateStr + active +`", }`
			if i == 4 {
				bodyStr += ` `
			} else {
				bodyStr += `, `
			}
			iterableDay += day*7
		}

		if j == len(weekDays)-1 {
			bodyStr += ` ]`
		} else{
			bodyStr += ` ],`
		}
	}
	bodyStr += ` ]`

	result := `return { "title": "Посещения на ` + startDateformated + ` - ` + endDateformated + `", "title_counter": "` + strconv.FormatInt(title_counter, 10) + `", "more": "Открыть в приложении", "more_url": "` + more_url + `", "body":` + bodyStr + ` }; `;

	return true, result 
}

func autoWidgetUpdate() {
	for group_id, token := range activeWidgetStore {
		sendGroupWidget(group_id, token)
	}
}