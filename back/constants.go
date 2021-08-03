package main

import (
	"time"
)

//127.0.0.1:3306
//94.228.115.58:3306
const (
	port       = ":3000"
	mysqlOpen  = "rwit:_@tcp(127.0.0.1:3306)/vkapp?multiStatements=true"
	secretKey  = "_"
	serviceKey = "_"
	app_id     = 7121023
	CIPHER_KEY = "_"
)

const (
	digitDateLimit = 1000000000000
	lowerDateLimit = 1.6 * digitDateLimit
	upperDateLimit = 2 * digitDateLimit
	unixYear       = 31536000 * 1000
	unixWeek       = 604800 * 1000
	tokenTimeLive  = 1200
)
const (
	typeIncomingDataWrite    = 0
	typeIncomingDataPinned   = 1
	typeIncomingSettingWrite = 2
)

func currentDateNow() int64 {
	return time.Now().Unix()
}
func transformDate(date int64, incom bool) int64 {
	if incom {
		return date / 1000
	} else {
		return date * 1000
	}
}

func getRights(role string) int64 {
	var a = [5]string{"none", "member", "moder", "editor", "admin"}

	for i, v := range a {
		if v == role {
			return int64(i)
		}
	}

	return 0
}

//Количество опций
const settingOptionsCount = 5
