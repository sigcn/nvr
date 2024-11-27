package main

import (
	"errors"
	"net/http"
	"runtime/debug"
)

type buildInfo struct {
	GoVersion   string `json:"go_version"`
	VCSRevision string `json:"vcs_revision"`
	VCSTime     string `json:"vcs_time"`
}

func readBuildInfo() (buildInfo buildInfo, err error) {
	info, ok := debug.ReadBuildInfo()
	if !ok {
		err = errors.ErrUnsupported
		return
	}
	buildInfo.GoVersion = info.GoVersion
	for _, s := range info.Settings {
		if s.Key == "vcs.revision" {
			buildInfo.VCSRevision = s.Value
			continue
		}
		if s.Key == "vcs.time" {
			buildInfo.VCSTime = s.Value
		}
	}
	return
}

type Settings struct {
	Version string `json:"version"`
	buildInfo
}

func handleQuerySettings(w http.ResponseWriter, r *http.Request) {
	info, err := readBuildInfo()
	if err != nil {
		Err(err).MarshalTo(w)
	}
	Ok(Settings{Version: version, buildInfo: info}).MarshalTo(w)
}
