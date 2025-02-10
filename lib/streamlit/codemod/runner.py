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

import importlib
import sys
from pathlib import Path


def process_file(file_path: str, transform_func) -> None:
    """Process a single Python file."""
    with open(file_path) as f:
        source = f.read()

    try:
        modified_source = transform_func(source)

        # Only write if changes were made
        if modified_source != source:
            with open(file_path, "w") as f:
                f.write(modified_source)
            print(f"Modified: {file_path}")  # noqa: T201
        else:
            print(f"No changes needed: {file_path}")  # noqa: T201

    except Exception as e:
        print(f"Error processing {file_path}: {str(e)}")  # noqa: T201


def process_directory(directory: str, transform_func, pattern: str = "*.py") -> None:
    """Process all Python files in a directory recursively."""
    for py_file in Path(directory).rglob(pattern):
        process_file(str(py_file), transform_func)


if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python run_transform.py <codemod_module> <path>")  # noqa: T201
        print("Example: python run_transform.py add_flex_param ./my_directory")  # noqa: T201
        sys.exit(1)

    codemod_name = sys.argv[1]
    path = sys.argv[2]

    try:
        # Import the specified codemod module
        codemod = importlib.import_module(codemod_name)
        transform_func = codemod.transform_file
    except (ImportError, AttributeError) as e:
        print(f"Error loading codemod module '{codemod_name}': {str(e)}")  # noqa: T201
        print("Make sure the module exists and has a 'transform_file' function.")  # noqa: T201
        sys.exit(1)

    if Path(path).is_file():
        process_file(path, transform_func)
    else:
        process_directory(path, transform_func)
