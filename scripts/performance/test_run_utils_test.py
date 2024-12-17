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

import pytest
from .test_run_utils import get_stable_test_name


@pytest.mark.parametrize(
    "filename, expected",
    [
        (
            "20241219180018_test_form_input_performance[chromium-4-10].json",
            "test_form_input_performance",
        ),
        (
            "20241219180018_test_form_input_performance[webkit-1-10].json",
            "test_form_input_performance",
        ),
        (
            "20241219180035_test_something_performance[chromium-9-10].json",
            "test_something_performance",
        ),
        (
            "20241219180035_test_something_performance.json",
            "test_something_performance",
        ),
    ],
)
def test_get_stable_test_name_valid(filename, expected):
    assert get_stable_test_name(filename) == expected


@pytest.mark.parametrize(
    "filename",
    [
        "test_20211010_123456.txt",
    ],
)
def test_get_stable_test_name_invalid_extension(filename):
    with pytest.raises(ValueError, match="Filename must end with '.json'"):
        get_stable_test_name(filename)


@pytest.mark.parametrize(
    "filename",
    [
        "statistics.json",
    ],
)
def test_expected_filename_format(filename):
    with pytest.raises(ValueError, match="Invalid filename format"):
        get_stable_test_name(filename)
