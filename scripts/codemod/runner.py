# Copyright (c) Streamlit Inc. (2018-2022) Snowflake Inc. (2022-2025)
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

import sys
from pathlib import Path
from add_flex_param import transform_file


def process_file(file_path: str) -> None:
    """Process a single Python file."""
    with open(file_path, "r") as f:
        source = f.read()

    try:
        modified_source = transform_file(source)

        # Only write if changes were made
        if modified_source != source:
            with open(file_path, "w") as f:
                f.write(modified_source)
            print(f"Modified: {file_path}")
        else:
            print(f"No changes needed: {file_path}")

    except Exception as e:
        print(f"Error processing {file_path}: {str(e)}")


def process_directory(directory: str, pattern: str = "*.py") -> None:
    """Process all Python files in a directory recursively."""
    for py_file in Path(directory).rglob(pattern):
        process_file(str(py_file))


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python run_transform.py <path>")
        sys.exit(1)

    path = sys.argv[1]
    if Path(path).is_file():
        process_file(path)
    else:
        process_directory(path)
