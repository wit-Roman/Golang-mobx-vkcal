package main

type IresultCheckStatement struct {
	CurrentDateNow            int64
	SseActiveChannels         int
	SseActiveChannelUserCount []int
	SseViewersActiveCount     int64
	TokenStoreCount           int
	ActiveWidgetStoreCount    int
	AccessMemberGroups        map[int64]bool
}

func getCheckStatement() IresultCheckStatement {
	var result IresultCheckStatement

	result.CurrentDateNow = currentDateNow()

	result.SseActiveChannels = len(messageChannels)
	for _, channel := range messageChannels {
		result.SseActiveChannelUserCount = append(result.SseActiveChannelUserCount, len(channel))
	}

	result.SseViewersActiveCount = viewersActiveCount

	result.TokenStoreCount = len(tokenStore)

	result.ActiveWidgetStoreCount = len(activeWidgetStore)

	result.AccessMemberGroups = AccessMemberGroups

	return result
}
