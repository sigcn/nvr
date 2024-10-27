package main

import (
	"net/http"
	"os"
	"path/filepath"
	"syscall"
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

	Ok(Stat{
		VolumeTotal: total,
		VolumeFree:  free,
		VolumePath:  storePath,
		VolumeUsage: usage}).MarshalTo(w)
}
