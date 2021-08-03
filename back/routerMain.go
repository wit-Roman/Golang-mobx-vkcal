package main

import (
	"encoding/json"
	"net/http"
	"strconv"
)

type Entity struct {
	Id    int
	Title string
}

type Session struct {
	IframeUrl string
	//Id         int
	First_name string
	Last_name  string
	//Sex            int8
	//Bdate          string
	//City           Entity
	//Country        Entity
	Photo_100 string
	//Photo_200      string
	//Photo_max_orig string
	Timezone int8
}

func vkSession(w http.ResponseWriter, r *http.Request) {
	addHeaders(&w, r)
	//TODO Authorization: "Bearer "
	//https://gist.github.com/sambengtson/bc9f76331065f09e953f
	if r.Method == http.MethodPost {
		headerAuthFull := r.Header.Get("Authorization")
		success, headerAuth := clearToken(headerAuthFull)
		if !success {
			http.Error(w, "wrong header", http.StatusUnauthorized)
			return
		}
		headerReferer := r.Header.Get("Referer")

		r.Body = http.MaxBytesReader(w, r.Body, 16384)
		decoder := json.NewDecoder(r.Body)
		decoder.DisallowUnknownFields()
		var session Session
		err := decoder.Decode(&session)
		if err != nil {
			http.Error(w, "not json", http.StatusBadRequest)
			return
		}

		isValid, validSession := validation(&session, headerAuth, headerReferer)
		if !isValid {
			http.Error(w, "not valid", http.StatusBadRequest)
			return
		}

		if success, result := createSession(&validSession); success {
			token := createToken(validSession.group_id, validSession.viewer_id, validSession.rights)
			if ok := writeTokenStore(token, validSession.group_id, validSession.viewer_id, validSession.rights); !ok {
				http.Error(w, "session limit", http.StatusTooManyRequests)
				return
			}
			addTokenHeader(&w, token)

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

func changeDate(w http.ResponseWriter, r *http.Request) {
	addHeaders(&w, r)
	if r.Method == http.MethodGet {
		success, group_id, viewer_id := validateTokenHeader(&w, r, -1)
		if !success {
			http.Error(w, "wrong header", http.StatusUnauthorized)
			return
		}

		query := r.URL.Query()
		date, err := strconv.ParseInt(query.Get("d"), 10, 64)
		if err != nil || !isValidDate(date) {
			http.Error(w, "wrong params", http.StatusBadRequest)
			return
		}

		isNew := false
		isNewForHandler := int64(0)
		if query.Get("n") == "1" {
			isNew = true
			isNewForHandler = 1
		}

		success, resultWriteDate := writeDate(group_id, viewer_id, date, isNew)
		if success {
			jsonBytes, err := json.Marshal(resultWriteDate)
			if err != nil {
				http.Error(w, "crash json write", http.StatusBadRequest)
				return
			}
			w.WriteHeader(http.StatusOK)
			w.Write(jsonBytes)

			sayHandler(group_id, viewer_id, date, isNewForHandler, typeIncomingDataWrite)
		} else {
			http.Error(w, "wrong params", http.StatusBadRequest)
		}
	}
}

func usersData(w http.ResponseWriter, r *http.Request) {
	addHeaders(&w, r)
	if r.Method == http.MethodGet {
		success, group_id, _ := validateTokenHeader(&w, r, 0)
		if !success {
			http.Error(w, "wrong header", http.StatusUnauthorized)
			return
		}

		success, result := getDataUsers(group_id)
		if success {
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

func userData(w http.ResponseWriter, r *http.Request) {
	addHeaders(&w, r)
	if r.Method == http.MethodGet {
		success, group_id, _ := validateTokenHeader(&w, r, 0)
		if !success {
			http.Error(w, "wrong header", http.StatusUnauthorized)
			return
		}

		query := r.URL.Query()
		viewer_id, err := strconv.ParseInt(query.Get("fv"), 10, 64)
		if err != nil {
			http.Error(w, "wrong params", http.StatusBadRequest)
			return
		}

		success, result := getDataUser(group_id, viewer_id)
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

func groupsUser(w http.ResponseWriter, r *http.Request) {
	addHeaders(&w, r)
	if r.Method == http.MethodGet {
		query := r.URL.Query()
		viewer_id, err := strconv.ParseInt(query.Get("v"), 10, 64)
		if err != nil {
			http.Error(w, "wrong params", http.StatusBadRequest)
			return
		}

		if success, result := getGroupsUser(viewer_id); success {
			if jsonBytes, err := json.Marshal(result); err != nil {
				http.Error(w, "crash json write", http.StatusBadRequest)
			} else {
				w.WriteHeader(http.StatusOK)
				w.Write(jsonBytes)
			}
		} else {
			http.Error(w, "crash sql search", http.StatusBadRequest)
		}
	}
}

func getDates(w http.ResponseWriter, r *http.Request) {
	addHeaders(&w, r)
	if r.Method == http.MethodGet {
		success, group_id, viewer_id := validateTokenHeader(&w, r, 0)
		if !success {
			http.Error(w, "wrong header", http.StatusUnauthorized)
			return
		}

		success, result := getDataUsersSelectedDates(group_id, viewer_id)
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
