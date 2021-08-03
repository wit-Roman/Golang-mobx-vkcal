package main

type IresultWriteDate struct {
	IsWriting      bool
	CurrentDateNow int64
	Viewer_id      int64
}

func writeDate(group_id int64, viewer_id int64, date int64, isNew bool) (bool, IresultWriteDate) {
	date_toWrite := transformDate(date, true)
	creating := currentDateNow()
	var err error
	if isNew {
		_, err = DB.Exec("INSERT INTO `selected_dates` (`group_id`, `viewer_id`, `date`, `creating`, `isPinned`) VALUES (?, ?, ?, ?, 0); ", group_id, viewer_id, date_toWrite, creating)
	} else {
		_, err = DB.Exec("DELETE FROM `selected_dates` WHERE group_id=? AND viewer_id=? AND date=?; ", group_id, viewer_id, date_toWrite)
	}

	return (err == nil), IresultWriteDate{isNew, transformDate(creating, false), viewer_id}
}

type IselectDateRow struct {
	date      int64
	viewer_id int64
	isPinned  int64
}
type IdataUsersSelectedDates map[int64][]int64
type IdataUserSelectedDates []int64
type IdataUsersPinnedDates map[int64][]int64
type IresultGetDataUsersSelectedDates struct {
	DataUsersSelectedDates IdataUsersSelectedDates
	DataUserSelectedDates  IdataUserSelectedDates
	DataUsersPinnedDates   IdataUsersPinnedDates
}

func getDataUsersSelectedDates(group_id int64, viewer_id int64) (bool, IresultGetDataUsersSelectedDates) {
	const selectQuery = "SELECT viewer_id, date, isPinned FROM `selected_dates` WHERE group_id=?"
	selectedRows, err := DB.Query(selectQuery, group_id)
	if err != nil {
		return false, IresultGetDataUsersSelectedDates{}
	}
	defer selectedRows.Close()

	dataUsersSelectedDates := make(IdataUsersSelectedDates)
	dataUserSelectedDates := make(IdataUserSelectedDates, 0)
	dataUsersPinnedDates := make(IdataUsersPinnedDates)
	for selectedRows.Next() {
		var row IselectDateRow
		err = selectedRows.Scan(&row.viewer_id, &row.date, &row.isPinned)
		if err != nil {
			return false, IresultGetDataUsersSelectedDates{}
		}

		date := transformDate(row.date, false)
		if row.viewer_id == viewer_id {
			dataUserSelectedDates = append(dataUserSelectedDates, date)
		}
		dataUsersSelectedDates[date] = append(dataUsersSelectedDates[date], row.viewer_id)

		if row.isPinned == 1 {
			dataUsersPinnedDates[date] = append(dataUsersPinnedDates[date], row.viewer_id)
		}
	}

	return true, IresultGetDataUsersSelectedDates{dataUsersSelectedDates, dataUserSelectedDates, dataUsersPinnedDates}
}

type IresultGetCountSelectedDates map[int64]int64
type IcountDateRow struct {
	date int64
}

func getCountSelectedGroupDates(group_id int64) (bool, IresultGetCountSelectedDates) {
	countSelectedDates := make(IresultGetCountSelectedDates)

	const selectQuery = "SELECT date FROM `selected_dates` WHERE group_id=?"
	selectedRows, err := DB.Query(selectQuery, group_id)
	if err != nil {
		return false, countSelectedDates
	}
	defer selectedRows.Close()

	for selectedRows.Next() {
		var row IcountDateRow
		err = selectedRows.Scan(&row.date)
		if err != nil {
			return false, countSelectedDates
		}

		date := transformDate(row.date, false)

		countSelectedDates[date] += 1
	}

	return true, countSelectedDates
}
