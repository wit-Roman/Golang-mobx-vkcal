package main

//var ctx context.Context

type IresultCreateSession struct {
	IresultGetDataUsersSelectedDates
	DataUsers IresultDataUsers
	IresultGroupSetting
}

func createSession(session *ValidSession) (bool, IresultCreateSession) {
	stmt, err := DB.Prepare("INSERT INTO `sessions` (viewer_id, group_id, first_name, last_name, photo_100, viewer_type, rights, timezone, creating) VALUES(?,?,?,?,?,?,?,?,?) ON DUPLICATE KEY UPDATE first_name=?, last_name=?, photo_100=?, viewer_type=?, rights=?, timezone=?, creating=?;")
	if err != nil {
		return false, IresultCreateSession{}
	}

	_, err = stmt.Exec(
		session.viewer_id,
		session.group_id,
		session.first_name,
		session.last_name,
		session.photo_100,
		session.viewer_type,
		session.rights,
		session.timezone,
		session.creating,

		session.first_name,
		session.last_name,
		session.photo_100,
		session.viewer_type,
		session.rights,
		session.timezone,
		session.creating,
	)
	if err != nil {
		return false, IresultCreateSession{}
	}

	success, dataUsers := getDataUsers(session.group_id)
	if !success {
		return false, IresultCreateSession{}
	}

	var groupSetting IresultGroupSetting
	isNeed := checkDefaultSettingIsNeeded(session.group_id)
	if isNeed {
		success, groupSetting = createDefaultSetting(session.group_id) //TODO Create group
		if !success {
			return false, IresultCreateSession{}
		}
	} else {
		success, groupSetting = selectGroupSetting(session.group_id) //TODO Create group
		if !success {
			return false, IresultCreateSession{}
		}
	}

	success, dataUsersDates := getDataUsersSelectedDates(session.group_id, session.viewer_id)
	if !success {
		return false, IresultCreateSession{}
	}

	return true, IresultCreateSession{dataUsersDates, dataUsers, groupSetting}
}

type IdataUser struct {
	First_name string
	Last_name  string
	Photo_100  string
}
type IrowSelectedUser struct {
	viewer_id  int64
	first_name string
	last_name  string
	photo_100  string
}
type IresultDataUsers map[int64]IdataUser

func getDataUsers(group_id int64) (bool, IresultDataUsers) {
	const selectQuery = "SELECT viewer_id, first_name, last_name, photo_100 FROM `sessions` WHERE group_id=?; "
	selectedRows, err := DB.Query(selectQuery, group_id)
	if err != nil {
		return false, IresultDataUsers{}
	}
	defer selectedRows.Close()

	dataUsers := make(IresultDataUsers)
	for selectedRows.Next() {
		var row IrowSelectedUser
		err = selectedRows.Scan(&row.viewer_id, &row.first_name, &row.last_name, &row.photo_100)
		if err != nil {
			return false, IresultDataUsers{}
		}

		dataUsers[row.viewer_id] = IdataUser{
			row.first_name,
			row.last_name,
			row.photo_100,
		}
	}

	return true, dataUsers
}

func getDataUser(group_id int64, viewer_id int64) (bool, IdataUser) {
	var first_name string
	var last_name string
	var photo_100 string

	const selectQuery = "SELECT DISTINCT first_name, last_name, photo_100 FROM `sessions` WHERE group_id=? AND viewer_id=?; "
	selectedRow := DB.QueryRow(selectQuery, group_id, viewer_id)
	err := selectedRow.Scan(&first_name, &last_name, &photo_100)
	if err != nil {
		return false, IdataUser{}
	}

	return true, IdataUser{first_name, last_name, photo_100}
}

type IgroupsUser struct {
	Group_ids []int64
}

func getGroupsUser(viewer_id int64) (bool, IgroupsUser) {
	groupsUser := IgroupsUser{}
	groupsUser.Group_ids = make([]int64, 0)
	const selectQuery = "SELECT group_id FROM `sessions` WHERE viewer_id=?; "
	selectedRows, err := DB.Query(selectQuery, viewer_id)
	if err != nil {
		return false, groupsUser
	}

	for selectedRows.Next() {
		var group_id int64
		if err := selectedRows.Scan(&group_id); err != nil {
			return false, groupsUser
		}
		groupsUser.Group_ids = append(groupsUser.Group_ids, group_id)
	}

	return true, groupsUser
}
