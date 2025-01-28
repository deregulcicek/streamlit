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

import os
from pathlib import Path

from streamlit.commands.navigation import _navigation
from streamlit.file_util import normalize_path_join
from streamlit.navigation.page import StreamlitPage
from streamlit.runtime.scriptrunner_utils.script_run_context import get_script_run_ctx
from streamlit.source_util import page_sort_key

ctx = get_script_run_ctx()
main_script_path = Path(normalize_path_join(os.getcwd(), ctx.main_script_path))
main_script_dir = main_script_path.parent

# Select the folder that should be used for the pages:
PAGES_FOLDER = main_script_dir / Path("pages")
if PAGES_FOLDER.exists():
    pages = PAGES_FOLDER.glob("*.py")
    pages = sorted(
        [
            f
            for f in PAGES_FOLDER.glob("*.py")
            if not f.name.startswith(".") and not f.name == "__init__.py"
        ],
        key=page_sort_key,
    )
    # Use this script as the main page and
    default_page = StreamlitPage(main_script_path, default=True)
    # Initialize the navigation with all the pages:
    page = _navigation([default_page] + [StreamlitPage(page) for page in pages])

    page.run()
