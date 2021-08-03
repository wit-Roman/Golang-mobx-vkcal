package main

import (
	"encoding/json"
	"net/http"
	"strings"
)

var messageChannels = make(map[int64]map[chan []byte]bool)

//var groupsActiveCount int64 = 0
var viewersActiveCount int64 = 0

func sayHandler(group_id int64, viewer_id int64, date int64, isNew int64, typeIncomingData int64) {
	groupChannel, ok := messageChannels[group_id]
	if !ok {
		return
	}

	jsonStructure, err := json.Marshal([4]int64{date, viewer_id, isNew, typeIncomingData})
	if err != nil {
		return
	}

	go func() {
		for messageChannel := range groupChannel { //range of nil ?
			messageChannel <- []byte(jsonStructure)
		}
	}()

	//w.Write([]byte("ok."))
}

func listenHandler(w http.ResponseWriter, r *http.Request) {
	addHeaders(&w, r)
	success, group_id, _ := validateTokenHeader(&w, r, 0) //TODO token из query
	if !success {
		http.Error(w, "wrong header", http.StatusUnauthorized)
		return
	}
	addHeadersSSE(&w)

	//ограничить число подключений
	if getGroupsActiveCount() > 64 ||
		getViewersActiveCount(group_id) > 64 ||
		viewersActiveCount > 256 {
		http.Error(w, "connection limit", http.StatusLengthRequired)
		return
	}

	groupChannel, groupIsset := messageChannels[group_id]
	if !groupIsset {
		groupChannel = make(map[chan []byte]bool)
	}
	_messageChannel := make(chan []byte)
	groupChannel[_messageChannel] = true
	if !groupIsset {
		messageChannels[group_id] = groupChannel
	}
	viewersActiveCount += 1

	for {
		select {
		case _msg := <-_messageChannel:
			w.Write(formatSSE("message", string(_msg)))
			w.(http.Flusher).Flush()
		case <-r.Context().Done():
			delete(groupChannel, _messageChannel)
			viewersActiveCount -= 1
			if len(groupChannel) == 0 {
				delete(messageChannels, group_id)
			}
			return
		}
	}
}

func formatSSE(event string, data string) []byte {
	eventPayload := "event: " + event + "\n"
	dataLines := strings.Split(data, "\n")
	for _, line := range dataLines {
		eventPayload = eventPayload + "data: " + line + "\n"
	}
	return []byte(eventPayload + "\n")
}

func getViewersActiveCount(group_id int64) int {
	if group, ok := messageChannels[group_id]; !ok {
		return 0
	} else {
		return len(group)
	}
}

func getGroupsActiveCount() int {
	if messageChannels == nil {
		return 0
	} else {
		return len(messageChannels)
	}
}
