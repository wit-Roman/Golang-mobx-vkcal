package main

import (
	"encoding/json"
	"net/http"
)

func getSetting(w http.ResponseWriter, r *http.Request) {
	addHeaders(&w, r)
	if r.Method == http.MethodGet {
		success, group_id, _ := validateTokenHeader(&w, r, 0)
		if !success {
			http.Error(w, "wrong header", http.StatusUnauthorized)
			return
		}

		if success, result := selectGroupSetting(group_id); success {
			jsonBytes, err := json.Marshal(result)
			if err != nil {
				http.Error(w, "crash json write", http.StatusBadRequest)
				return
			}

			w.WriteHeader(http.StatusOK)
			w.Write(jsonBytes)
		} else {
			http.Error(w, "crash sql write", http.StatusBadRequest)
		}
	}
}

type IReqSetting struct {
	AccessMember    bool
	AllowedWeekDays [7]bool
	BlockedDays     []int64
	BlockedPeriod   [2]int64
	WidgetEnable    bool
	WidgetToken     string
	SpecialDays     Isettings_specialDays
}
type IResSetting struct {
	IsSaveSetting bool
}

func saveSetting(w http.ResponseWriter, r *http.Request) {
	addHeaders(&w, r)
	if r.Method == http.MethodPost {
		success, group_id, _ := validateTokenHeader(&w, r, 2)
		if !success {
			http.Error(w, "wrong header", http.StatusUnauthorized)
			return
		}

		r.Body = http.MaxBytesReader(w, r.Body, 16384)
		decoder := json.NewDecoder(r.Body)
		decoder.DisallowUnknownFields()
		var setting IReqSetting
		err := decoder.Decode(&setting)
		if err != nil {
			http.Error(w, "not json", http.StatusBadRequest)
			return
		}

		isValid, validSetting := validateSetting(&setting)
		if !isValid {
			http.Error(w, "not valid", http.StatusBadRequest)
			return
		}

		if success := updateGroupSetting(group_id, validSetting); success {
			if success := updateGroupSettingBlockedDays(group_id, validSetting.SettingBlockedDays); success {
				if success := updateSpecialDays(group_id, validSetting.SettingSpecialDays); success {
					jsonBytes, err := json.Marshal(IResSetting{true})
					if err != nil {
						http.Error(w, "crash json write", http.StatusBadRequest)
						return
					}

					w.WriteHeader(http.StatusOK)
					w.Write(jsonBytes)

					sayHandler(group_id, 0, 0, 0, typeIncomingSettingWrite)
				} else {
					http.Error(w, "crash sql write special days", http.StatusBadRequest)
				}
			} else {
				http.Error(w, "crash sql write blocked days", http.StatusBadRequest)
			}
		} else {
			http.Error(w, "crash sql write settings allowed", http.StatusBadRequest)
		}
	}

	if r.Method == http.MethodGet {
		if isReset := r.URL.Query().Get("reset"); isReset != "1" {
			http.Error(w, "wrong param", http.StatusBadRequest)
			return
		}

		success, group_id, _ := validateTokenHeader(&w, r, 2)
		if !success {
			http.Error(w, "wrong header", http.StatusUnauthorized)
			return
		}

		if success := resetGroupSetting(group_id); success {
			jsonBytes, err := json.Marshal(IResSetting{true})
			if err != nil {
				http.Error(w, "crash json write", http.StatusBadRequest)
				return
			}

			w.WriteHeader(http.StatusOK)
			w.Write(jsonBytes)
		} else {
			http.Error(w, "crash sql write", http.StatusBadRequest)
		}
	}
}

func getCountSelectedDates(w http.ResponseWriter, r *http.Request) {
	addHeaders(&w, r)
	if r.Method == http.MethodGet {
		success, group_id, _ := validateTokenHeader(&w, r, 0)
		if !success {
			http.Error(w, "wrong header", http.StatusUnauthorized)
			return
		}

		success, result := getCountSelectedGroupDates(group_id)
		if success {
			if jsonBytes, err := json.Marshal(result); err != nil {
				http.Error(w, "crash json write", http.StatusBadRequest)
			} else {
				w.WriteHeader(http.StatusOK)
				w.Write(jsonBytes)
			}
		} else {
			http.Error(w, "crash sql write", http.StatusBadRequest)
		}
	}
}

type IResultWidgetEnable struct {
	Enabled bool
}
type IReqToken struct {
	Token string
}
func widgetEnable(w http.ResponseWriter, r *http.Request) {
	addHeaders(&w, r)
	if r.Method == http.MethodPost { //TODO POST
		success, group_id, _ := validateTokenHeader(&w, r, 2)
		if !success {
			http.Error(w, "wrong header", http.StatusUnauthorized)
			return
		}

		r.Body = http.MaxBytesReader(w, r.Body, 16384)
		decoder := json.NewDecoder(r.Body)
		decoder.DisallowUnknownFields()
		var token IReqToken
		err := decoder.Decode(&token)
		if err != nil || len(token.Token) != 85 {
			http.Error(w, "not json", http.StatusBadRequest)
			return
		}

		Enabled := generateGroupWidget(group_id, "1", token.Token)
		jsonBytes, err := json.Marshal(IResultWidgetEnable{Enabled})
		if err != nil {
			http.Error(w, "crash json write", http.StatusBadRequest)
			return
		}

		w.WriteHeader(http.StatusOK)
		w.Write(jsonBytes)
	}
}
