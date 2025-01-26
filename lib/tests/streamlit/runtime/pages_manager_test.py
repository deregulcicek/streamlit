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

"""Unit tests for PagesManager"""

from __future__ import annotations

import os
import tempfile
import unittest
from unittest.mock import MagicMock, patch

import streamlit.source_util as source_util
from streamlit.runtime.pages_manager import PagesManager


class PagesManagerTest(unittest.TestCase):
    def test_register_pages_changed_callback(self):
        """Test that the pages changed callback is correctly registered and unregistered"""
        with tempfile.TemporaryDirectory() as temp_dir:
            pages_dir = os.path.join(temp_dir, "pages")
            os.makedirs(pages_dir)

            pages_manager = PagesManager(os.path.join(temp_dir, "main_script_path"))
            with patch.object(source_util, "_on_pages_changed", MagicMock()):

                def callback():
                    return None

                disconnect = pages_manager.register_pages_changed_callback(callback)

                source_util._on_pages_changed.connect.assert_called_once_with(
                    callback, weak=False
                )

                disconnect()
                source_util._on_pages_changed.disconnect.assert_called_once_with(
                    callback
                )

    @patch("streamlit.source_util.watch_dir")
    @patch.object(source_util, "invalidate_pages_cache", MagicMock())
    def test_install_pages_watcher(self, patched_watch_dir):
        """Test that the pages watcher is correctly installed and uninstalled"""
        with tempfile.TemporaryDirectory() as temp_dir:
            pages_dir = os.path.join(temp_dir, "foo/bar/pages")
            os.makedirs(pages_dir)

            main_script_path = os.path.join(temp_dir, "foo/bar/streamlit_app.py")
            _ = PagesManager(main_script_path)

            patched_watch_dir.assert_called_once()
            args, _ = patched_watch_dir.call_args_list[0]
            on_pages_changed = args[1]

            patched_watch_dir.assert_called_once_with(
                os.path.normpath(os.path.join(temp_dir, "foo/bar/pages")),
                on_pages_changed,
                glob_pattern="*.py",
                allow_nonexistent=True,
            )

            patched_watch_dir.reset_mock()

            _ = PagesManager(main_script_path)
            patched_watch_dir.assert_not_called()

            on_pages_changed("/foo/bar/pages")
            source_util.invalidate_pages_cache.assert_called_once()


class PagesManagerV2Test(unittest.TestCase):
    def setUp(self):
        self.pages_manager = PagesManager("main_script_path")

        # This signifies the change to V2
        self.pages_manager.set_pages({})

    def test_get_page_script_valid_hash(self):
        """Ensure the page script is provided with valid page hash specified"""
        self.pages_manager.set_pages({"page_hash": {"page_script_hash": "page_hash"}})

        page_script = self.pages_manager.find_page_info(
            "page_hash", "", fallback_page_hash=self.pages_manager.main_script_hash
        )
        assert page_script["page_script_hash"] == "page_hash"

    def test_get_page_script_invalid_hash(self):
        """Ensure the page script is provided with invalid page hash specified"""
        self.pages_manager.set_pages({"page_hash": {"page_script_hash": "page_hash"}})

        page_script = self.pages_manager.find_page_info(
            "bad_hash", "", fallback_page_hash=self.pages_manager.main_script_hash
        )
        assert page_script is None

    def test_get_page_script_valid_name(self):
        """Ensure the page script is provided with valid page name specified"""
        self.pages_manager.set_pages(
            {
                "page_hash": {
                    "page_script_hash": "page_hash",
                    "url_pathname": "page_name",
                }
            }
        )

        page_script = self.pages_manager.find_page_info(
            "", "page_name", fallback_page_hash=self.pages_manager.main_script_hash
        )
        assert page_script["page_script_hash"] == "page_hash"

    def test_get_page_script_invalid_name(self):
        """Ensure the page script is not provided with invalid page name specified"""
        self.pages_manager.set_pages(
            {
                "page_hash": {
                    "page_script_hash": "page_hash",
                    "url_pathname": "page_name",
                }
            }
        )

        page_script = self.pages_manager.find_page_info(
            "", "foo", fallback_page_hash=self.pages_manager.main_script_hash
        )
        assert page_script is None
