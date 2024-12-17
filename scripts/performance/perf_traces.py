# Copyright (c) Streamlit Inc. (2018-2022) Snowflake Inc. (2022-2024)
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

import os
import json
from typing import Dict, List, Optional, TypedDict
from .types import (
    LongAnimationFrame,
    Profile,
    CapturedTraces,
    CalculatedPhases,
)


def get_long_animation_frames(
    file_as_dict: Dict[str, CapturedTraces],
) -> Optional[List[LongAnimationFrame]]:
    return file_as_dict["capturedTraces"].get("long-animation-frame")  # type: ignore


def get_react_profiles(
    file_as_dict: Dict[str, CapturedTraces], profile_name: str
) -> Profile:
    profiles = file_as_dict["capturedTraces"].get("profiles")
    if profiles is None:
        return {"entries": [], "totalWrittenEntries": 0}
    return profiles.get(profile_name, {"entries": [], "totalWrittenEntries": 0})


def get_all_profile_names(file_as_dict: Dict[str, CapturedTraces]) -> List[str]:
    profiles = file_as_dict["capturedTraces"].get("profiles")
    if profiles is None:
        return []
    return list(profiles.keys())


def calculate_phases(
    file_as_dict: Dict[str, CapturedTraces], profile_name: str
) -> CalculatedPhases:
    """
    Calculate phases for a specific profile from the given dictionary.

    Args:
        file_as_dict: A dictionary containing JSON data.
        profile_name: The name of the profile to extract phases from.

    Returns:
        A dictionary containing phases and their durations and counts.
    """
    profiles = get_react_profiles(file_as_dict, profile_name)
    phases: CalculatedPhases = {}

    for profile in profiles["entries"]:
        phase = profile["phase"]

        if phase not in phases:
            phases[phase] = {"duration_ms": 0.0, "count": 0}

        phases[phase]["duration_ms"] += profile["actualDuration"]
        phases[phase]["count"] += 1

    return phases


def calculate_phases_for_all_profiles(
    file_as_dict: Dict[str, CapturedTraces],
) -> Dict[str, CalculatedPhases]:
    """
    Calculate phases for all profiles from the given dictionary.

    Args:
        file_as_dict: A dictionary containing JSON data.

    Returns:
        A dictionary containing phases for all profiles.
    """
    profile_names = get_all_profile_names(file_as_dict)
    return {
        profile_name: calculate_phases(file_as_dict, profile_name)
        for profile_name in profile_names
    }


def sum_long_animation_frames(file_as_dict: Dict[str, CapturedTraces]) -> float:
    """
    Sum the durations of all long animation frames from the given dictionary.

    Args:
        file_as_dict: A dictionary containing JSON data.

    Returns:
        The sum of durations of all long animation frames.
    """
    long_animation_frames = get_long_animation_frames(file_as_dict)
    if long_animation_frames is None:
        return 0.0
    return sum([frame["duration"] for frame in long_animation_frames])


def count_entries_per_phase(
    file_as_dict: Dict[str, CapturedTraces], profile_name: str
) -> Dict[str, int]:
    """
    Count the number of entries per phase for a specific profile.

    Args:
        file_as_dict: A dictionary containing JSON data.
        profile_name: The name of the profile to count entries for.

    Returns:
        A dictionary with phases as keys and counts as values.
    """
    profiles = get_react_profiles(file_as_dict, profile_name)

    phase_counts: Dict[str, int] = {}
    for profile in profiles["entries"]:
        phase = profile["phase"]
        if phase not in phase_counts:
            phase_counts[phase] = 0
        phase_counts[phase] += 1

    return phase_counts


class LoadFilesOutput(TypedDict):
    filenames: List[str]
    all_phases: List[Dict[str, CalculatedPhases]]
    all_long_animation_frames: List[float]


def load_files(
    directory_path: str,
) -> LoadFilesOutput:
    """
    Load files from the directory and extract relevant data.

    Args:
        directory_path: The path to the directory containing the files.
    """
    filenames = []
    all_phases = []
    all_long_animation_frames = []

    for filename in os.listdir(directory_path):
        file_path = os.path.join(directory_path, filename)
        if os.path.isfile(file_path) and filename.endswith("json"):
            with open(file_path, "r", encoding="utf-8") as file:
                file_content = json.load(file)

            phases = calculate_phases_for_all_profiles(file_content)
            long_animation_frames_sum = sum_long_animation_frames(file_content)

            filenames.append(filename)
            all_phases.append(phases)
            all_long_animation_frames.append(long_animation_frames_sum)

    return {
        "filenames": filenames,
        "all_phases": all_phases,
        "all_long_animation_frames": all_long_animation_frames,
    }
