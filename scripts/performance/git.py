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

import subprocess
from typing import Optional


def rev_parse(branch_name: str = "origin/develop"):
    try:
        return (
            subprocess.check_output(["git", "rev-parse", branch_name]).decode().strip()
        )
    except subprocess.CalledProcessError as error:
        print(f"Error finding latest commit hash for {branch_name}: {error}")
        return None


def get_branch_point_commit_hash(branch_name: str = "origin/develop") -> Optional[str]:
    """
    Get the commit hash of the branch point between the current branch and the specified branch.
    If the has is not found, the latest commit hash of the given `branchName` is returned.

    Args:
        branch_name: The name of the branch to compare with. Default is "develop".

    Returns:
        The commit hash of the branch point, or None if an error occurs.
    """
    try:
        return (
            subprocess.check_output(["git", "merge-base", "HEAD", branch_name])
            .decode()
            .strip()
        )
    except subprocess.CalledProcessError as error:
        print(f"Error finding branch point commit hash: {error}")
        return None
