package main

import (
	"crypto/hmac"
	"crypto/sha256"
	base64 "encoding/base64"
	"net/url"
	"sort"
	"strconv"
	"strings"
)

type ValidSession struct {
	viewer_id   int64
	group_id    int64
	first_name  string
	last_name   string
	photo_100   string
	viewer_type string
	rights      int64
	timezone    int8
	creating    int64
}

func validation(session *Session, headerAuth string, headerReferer string) (bool, ValidSession) {
	if !strings.Contains(headerAuth, "vk_app_id="+strconv.FormatInt(app_id, 10)) ||
		!strings.Contains(headerAuth, "vk_user_id=") ||
		!strings.Contains(headerAuth, "sign=") ||
		!strings.Contains(headerAuth, headerReferer) {
		return false, ValidSession{}
	}

	if len(session.First_name) < 1 && len(session.First_name) > 80 &&
		len(session.Last_name) < 1 && len(session.Last_name) > 80 &&
		len(session.Photo_100) > 256 {
		return false, ValidSession{}
	}

	ParsedUrl, err := url.Parse(headerAuth)
	if err != nil {
		return false, ValidSession{}
	}

	ParsedQuery, err := url.ParseQuery(ParsedUrl.RawQuery)
	if err != nil {
		return false, ValidSession{}
	}

	var vk_user_id int64
	vk_user_id, err = strconv.ParseInt(ParsedQuery["vk_user_id"][0], 10, 64)
	if err != nil {
		return false, ValidSession{}
	}

	if !verification(headerAuth) {
		return false, ValidSession{}
	}

	var group_id int64
	if len(ParsedQuery["vk_group_id"]) == 0 {
		group_id = 0 //TODO обрабатывать исключение
	} else {
		group_id, err = strconv.ParseInt(ParsedQuery["vk_group_id"][0], 10, 64)
		if err != nil {
			group_id = 0
		}
	}

	var viewer_type string
	if ParsedQuery["vk_viewer_group_role"] != nil {
		viewer_type = ParsedQuery["vk_viewer_group_role"][0]
	} else {
		viewer_type = "none"
	}

	return true, ValidSession{
		viewer_id:   vk_user_id,
		group_id:    group_id,
		first_name:  session.First_name,
		last_name:   session.Last_name,
		photo_100:   session.Photo_100,
		viewer_type: viewer_type,
		rights:      getRights(viewer_type),
		timezone:    session.Timezone,
		creating:    currentDateNow(),
	}
}

func verification(reqUrl string) bool {
	ParsedUrl, err := url.Parse(reqUrl)
	if err != nil {
		return false
	}

	ParsedQuery, err := url.ParseQuery(ParsedUrl.RawQuery)
	if err != nil {
		return false
	}
	//ParsedQuery.viewer_id != viewer_id return false
	ParsedQueryParams := map[string]string{}
	var keys []string

	for k, v := range ParsedQuery {
		if strings.Contains(k, "vk_") {
			ParsedQueryParams[k] = v[0]
			keys = append(keys, k)
		}
	}
	if len(keys) < 2 {
		return false
	}
	sort.Strings(keys)

	stringParams := ""
	for i, k := range keys {
		if i == 0 {
			stringParams += k + "=" + ParsedQueryParams[k]
		} else {
			stringParams += "&" + k + "=" + ParsedQueryParams[k]
		}
	}

	h := hmac.New(sha256.New, []byte(secretKey))
	h.Write([]byte(stringParams))
	base := base64.StdEncoding.EncodeToString(h.Sum(nil))

	base = strings.ReplaceAll(base, "+", "-")
	base = strings.ReplaceAll(base, "/", "_")
	base = strings.TrimRight(base, "=")

	if ParsedQuery["sign"][0] == base {
		return true
	} else {
		return false
	}
}

func isValidDate(date int64) bool {
	currentDate := transformDate(currentDateNow(), false)
	if date > lowerDateLimit &&
		date < upperDateLimit &&
		date%1000 == 0 &&
		date-currentDate > -unixWeek &&
		date-currentDate < unixYear {
		return true
	} else {
		return false
	}
}

type IvalidSetting struct {
	SettingAccessMember    string
	SettingAllowedWeekDays string
	SettingBlockedPeriod   string
	SettingWidgetEnable    string
	SettingWidgetToken     string
	SettingBlockedDays     []int64
	SettingSpecialDays     Isettings_specialDays
}

func validateSetting(setting *IReqSetting) (bool, IvalidSetting) {
	var validSetting IvalidSetting
	if setting.AccessMember {
		validSetting.SettingAccessMember = "1"
	} else {
		validSetting.SettingAccessMember = "0"
	}

	for _, v := range setting.AllowedWeekDays {
		if v {
			validSetting.SettingAllowedWeekDays += "1,"
		} else {
			validSetting.SettingAllowedWeekDays += "0,"
		}
	}

	CurrentDateNow := transformDate(currentDateNow(), false)

	if setting.BlockedPeriod[0] != 0 &&
		(setting.BlockedPeriod[0] > upperDateLimit ||
			setting.BlockedPeriod[0] < lowerDateLimit ||
			CurrentDateNow-setting.BlockedPeriod[0] > unixYear) {
		return false, validSetting
	}

	if setting.BlockedPeriod[1] != 0 &&
		(setting.BlockedPeriod[1] > upperDateLimit ||
			setting.BlockedPeriod[1] < lowerDateLimit ||
			setting.BlockedPeriod[1]-unixYear > CurrentDateNow) {
		return false, validSetting
	}

	if setting.BlockedPeriod[0] != 0 && setting.BlockedPeriod[1] != 0 &&
		(setting.BlockedPeriod[0] >= setting.BlockedPeriod[1] ||
			setting.BlockedPeriod[1]-setting.BlockedPeriod[0] > unixYear) {
		return false, validSetting
	}

	validSetting.SettingBlockedPeriod = strconv.FormatInt(setting.BlockedPeriod[0], 10) + "," + strconv.FormatInt(setting.BlockedPeriod[1], 10)

	if setting.WidgetEnable {
		validSetting.SettingWidgetEnable = "1"
	} else {
		validSetting.SettingWidgetEnable = "0"
	}

	if len(setting.WidgetToken) > 90 {
		return false, validSetting
	} else {
		validSetting.SettingWidgetToken = setting.WidgetToken
	}

	if len(setting.BlockedDays) > 64 {
		return false, validSetting
	}
	for _, v := range setting.BlockedDays {
		if v > upperDateLimit || v < lowerDateLimit {
			return false, validSetting
		} else {
			validSetting.SettingBlockedDays = append(validSetting.SettingBlockedDays, transformDate(v, false))
		}
	}

	validSetting.SettingSpecialDays = make(Isettings_specialDays)
	for k, v := range setting.SpecialDays {
		if k > upperDateLimit || k < lowerDateLimit || len(v.Color) > 32 || len(v.Description) > 80 {
			return false, validSetting
		} else {
			validSetting.SettingSpecialDays[transformDate(k, true)] = v
		}
	}

	return true, validSetting
}
