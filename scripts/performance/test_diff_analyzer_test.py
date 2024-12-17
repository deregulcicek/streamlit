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

from .test_diff_analyzer import (
    get_analyzed_test_diff_results,
    calculate_statistical_diff,
)


def test_analyze_test_diff_results():
    statistical_diff = calculate_statistical_diff(
        {
            "test_1": {
                "long_animation_frames_duration_ms": [297, 289, 290, 287, 276],
                "Main__mount__duration_ms": [1.8, 2.0, 1.9, 2.1, 1.9],
                "Sidebar__mount__duration_ms": [1.8, 2.0, 1.9, 2.1, 1.9],
            },
            "test_2": {
                "metric__count": [6, 7, 8, 9, 10],
            },
            "test_3": {
                "Main__update__duration_ms": [1, 2, 3, 4, 5],
                "Main__update__count": [1, 2, 3, 4, 5],
            },
            "test_5": {
                "metric__count": [0, 0, 0, 0, 0],
            },
        },
        {
            "test_1": {
                "long_animation_frames_duration_ms": [274, 299, 297, 265, 268],
                "Main__mount__duration_ms": [1.8, 1.9, 1.8, 1.8, 1.9],
            },
            "test_2": {
                "metric__count": [5, 5, 6, 5, 4],
            },
            "test_3": {
                "Main__update__duration_ms": [6, 7, 8, 9, 10],
                "Main__update__count": [1, 2, 2, 3, 4],
            },
            "test_5": {
                "metric__count": [1, 1, 1, 1, 1],
            },
        },
    )

    analyzed_test_diff_results = get_analyzed_test_diff_results(statistical_diff)
    assert analyzed_test_diff_results == {
        "regression_count": 2,
        "improvement_count": 1,
        "no_change_count": 3,
    }
