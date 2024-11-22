package main

import (
	"net/http"
	"os"
	"path/filepath"
	"slices"
	"syscall"
	"time"
)

func GetTotalFileSize(dir string) (uint64, error) {
	var totalSize uint64
	err := filepath.Walk(dir, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return err
		}
		if !info.IsDir() {
			totalSize += uint64(info.Size())
		}
		return nil
	})
	if err != nil {
		return 0, err
	}
	return totalSize, nil
}

func GetFSUsage(dir string) (uint64, uint64, error) {
	var stat syscall.Statfs_t
	err := syscall.Statfs(storePath, &stat)
	if err != nil {
		return 0, 0, err
	}
	return stat.Blocks * uint64(stat.Bsize), stat.Bavail * uint64(stat.Bsize), nil
}

type Stat struct {
	VolumeTotal uint64 `json:"volume_total"`
	VolumeFree  uint64 `json:"volume_free"`
	VolumePath  string `json:"volume_path"`
	VolumeUsage uint64 `json:"volume_usage"`

	RecordDays int `json:"record_days"`
	DayBytes   int `json:"day_bytes"`
}

func recordStat(storagePath string) (d int, b int, err error) {
	month, err := os.ReadDir(filepath.Join(storagePath, "videos"))
	if err != nil {
		return
	}
	var dayBytes []int
	for _, m := range month {
		days, err := os.ReadDir(filepath.Join(storagePath, "videos", m.Name()))
		if err != nil {
			return 0, 0, err
		}
		var curDay int
		var curBytes int
		for _, day := range days {
			t, err := time.Parse("02_15-04-05.ts", day.Name())
			if err != nil {
				continue
			}
			if t.Day() != curDay {
				curDay = t.Day()
				d += 1
				if curBytes > 0 {
					dayBytes = append(dayBytes, curBytes)
					curBytes = 0
				}
			}
			stat, err := os.Stat(filepath.Join(storagePath, "videos", m.Name(), day.Name()))
			if err != nil {
				continue
			}
			curBytes += int(stat.Size())
		}
	}
	if len(dayBytes) < 3 {
		return
	}
	slices.Sort(dayBytes)
	var dayBytesAll int
	for _, db := range dayBytes[2:] {
		dayBytesAll += db
	}
	b = dayBytesAll / (len(dayBytes) - 1)
	return
}

func handleStat(w http.ResponseWriter, r *http.Request) {
	total, free, err := GetFSUsage(storePath)
	if err != nil {
		Err(err).MarshalTo(w)
		return
	}

	usage, err := GetTotalFileSize(storePath)
	if err != nil {
		Err(err).MarshalTo(w)
		return
	}

	recordDays, dayBytes, err := recordStat(storePath)
	if err != nil {
		Err(err).MarshalTo(w)
		return
	}

	Ok(Stat{
		VolumeTotal: total,
		VolumeFree:  free,
		VolumePath:  storePath,
		VolumeUsage: usage,

		RecordDays: recordDays,
		DayBytes:   dayBytes,
	}).MarshalTo(w)
}
