package main

type IresultWritePinned struct {
	IsPinned       int64
	CurrentDateNow int64
	Viewer_id      int64
}

func updatePinnedDate(group_id int64, find_viewer_id int64, date int64, isNew int64) (bool, IresultWritePinned) {
	creating := currentDateNow()
	date_toFind := transformDate(date, true)

	_, err := DB.Exec("UPDATE `selected_dates` SET isPinned=? WHERE group_id=? AND viewer_id=? AND date=?; ", isNew, group_id, find_viewer_id, date_toFind)
	if err != nil {
		return false, IresultWritePinned{0, transformDate(creating, false), find_viewer_id}
	}

	return true, IresultWritePinned{isNew, transformDate(creating, false), find_viewer_id}
}

func clearPinnedDate(group_id int64) bool {
	if _, err := DB.Exec("UPDATE `selected_dates` SET isPinned=0 WHERE group_id=?; ", group_id); err != nil {
		return false
	}

	return true
}