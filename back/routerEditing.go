package main

import (
	"encoding/json"
	"net/http"
	"strconv"
)

func pinnedDate(w http.ResponseWriter, r *http.Request) {
	addHeaders(&w, r)
	if r.Method == http.MethodGet {
		success, group_id, _ := validateTokenHeader(&w, r, 2)
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

		find_viewer_id, err := strconv.ParseInt(query.Get("fv"), 10, 64)
		if err != nil {
			http.Error(w, "wrong params", http.StatusBadRequest)
			return
		}

		isNew, err := strconv.ParseInt(query.Get("n"), 10, 8)
		if err != nil {
			http.Error(w, "wrong params", http.StatusBadRequest)
			return
		}

		success, resultWritePinned := updatePinnedDate(group_id, find_viewer_id, date, isNew)
		if success {
			jsonBytes, err := json.Marshal(resultWritePinned)
			if err != nil {
				http.Error(w, "crash json write", http.StatusBadRequest)
				return
			}
			w.WriteHeader(http.StatusOK)
			w.Write(jsonBytes)

			sayHandler(group_id, find_viewer_id, date, isNew, typeIncomingDataPinned)
		} else {
			http.Error(w, "wrong params", http.StatusBadRequest)
		}
	}
}
