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

from __future__ import annotations

import os
from pathlib import Path
from typing import TYPE_CHECKING, Callable, Final

from streamlit import source_util
from streamlit.logger import get_logger
from streamlit.util import calc_md5

if TYPE_CHECKING:
    from streamlit.source_util import PageHash, PageInfo, PageName, ScriptPath

_LOGGER: Final = get_logger(__name__)


class PagesManager:
    def __init__(
        self,
        main_script_path: ScriptPath,
        *,
        # setup_watcher is a convenience flag to allow disabling the watcher for testing
        setup_watcher: bool = True,
    ):
        self._main_script_path = main_script_path
        self._main_script_hash: PageHash = calc_md5(main_script_path)
        self._current_page_script_hash: PageHash = ""
        pages_dir = self.main_script_parent / "pages"
        self._is_mpa_v1 = os.path.exists(pages_dir)
        if self._is_mpa_v1:
            if setup_watcher:
                source_util.setup_pages_watcher(pages_dir)
            self._pages = source_util.get_pages(self._main_script_path)
        else:
            self._pages = {}

    def get_pages(self) -> dict[PageHash, PageInfo]:
        return self._pages

    def set_pages(self, pages: dict[PageHash, PageInfo]):
        if self._is_mpa_v1:
            # Log the warning and reset the "strategy" to V2
            _LOGGER.warning(
                "st.navigation was called in an app with a pages/ directory. "
                "This may cause unusual app behavior. You may want to rename the "
                "pages/ directory."
            )
            self._is_mpa_v1 = False
        self._pages = pages

    def get_main_page(self) -> PageInfo:
        return {
            "script_path": self._main_script_path,
            "page_script_hash": self._main_script_hash,
            "url_pathname": "",
        }

    def get_page_script_by_hash(self, page_script_hash: PageHash) -> PageInfo | None:
        if page_script_hash in self._pages:
            return self._pages[page_script_hash]

        return None

    def get_page_script_by_name(self, page_name: PageName) -> PageInfo | None:
        for page in self._pages.values():
            if page["url_pathname"] == page_name:
                return page

        return None

    @property
    def current_page_script_hash(self) -> PageHash:
        return self._current_page_script_hash

    @property
    def mpa_version(self) -> int:
        return 1 if self._is_mpa_v1 else 2

    @property
    def main_script_path(self) -> ScriptPath:
        return self._main_script_path

    @property
    def main_script_parent(self) -> Path:
        return Path(self._main_script_path).parent

    @property
    def main_script_hash(self) -> PageHash:
        return self._main_script_hash

    def set_current_page_script_hash(self, page_script_hash: PageHash) -> None:
        self._current_page_script_hash = page_script_hash

    def register_pages_changed_callback(
        self, callback: Callable[[str], None]
    ) -> Callable[[], None]:
        if self._is_mpa_v1:
            return source_util.register_pages_changed_callback(callback)

        return lambda: None

    def find_page_info(
        self,
        page_script_hash: PageHash,
        page_name: PageName | None,
        *,
        fallback_page_hash=None,
    ) -> PageInfo | None:
        # If a fallback hash is not provided, there's not much we can do, so we default to the main script hash
        if fallback_page_hash is None:
            fallback_page_hash = self.main_script_hash
        # We want to check if the page_script_hash is set to some non-empty string
        if page_script_hash:
            return self.get_page_script_by_hash(page_script_hash)
        # We allow page_name to have an empty string because that represents the main page
        elif page_name is not None:
            return self.get_page_script_by_name(page_name)

        return self.get_page_script_by_hash(fallback_page_hash)
