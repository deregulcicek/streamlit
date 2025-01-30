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

from playwright.sync_api import FilePayload, Page, expect

from e2e_playwright.conftest import (
    ImageCompareFunction,
    wait_for_app_run,
)


def test_chat_input_rendering(app: Page, assert_snapshot: ImageCompareFunction):
    """Test that the st.chat_input widgets are correctly rendered via screenshot matching."""
    chat_input_widgets = app.get_by_test_id("stChatInput")
    expect(chat_input_widgets).to_have_count(2)

    assert_snapshot(chat_input_widgets.nth(0), name="st_chat_input-single-file")
    assert_snapshot(chat_input_widgets.nth(1), name="st_chat_input-multiple-files")


def test_uploads_and_deletes_single_file(
    app: Page, assert_snapshot: ImageCompareFunction
):
    """Test that it correctly uploads and deletes a single file."""
    file_name1 = "file1.txt"
    file1 = FilePayload(name=file_name1, mimeType="text/plain", buffer=b"file1content")

    file_name2 = "file2.txt"
    file2 = FilePayload(name=file_name2, mimeType="text/plain", buffer=b"file2content")

    chat_input = app.get_by_test_id("stChatInput").nth(0)
    with app.expect_file_chooser(timeout=60000) as fc_info:
        chat_input.get_by_role("button").nth(0).click()
        file_chooser = fc_info.value
        file_chooser.set_files(files=[file1])

    wait_for_app_run(app)

    uploaded_files = app.get_by_test_id("stChatUploadedFiles").nth(0)
    expect(uploaded_files.get_by_text(file_name1)).to_be_visible()

    assert_snapshot(uploaded_files, name="st_chat_input-single_file_uploaded")

    # Upload a second file. This one will replace the first.
    with app.expect_file_chooser(timeout=60000) as fc_info:
        chat_input.get_by_role("button").nth(0).click()
        file_chooser = fc_info.value
        file_chooser.set_files(files=[file2])

    wait_for_app_run(app)

    uploaded_files = app.get_by_test_id("stChatUploadedFiles").nth(0)
    expect(uploaded_files.get_by_text(file_name1)).not_to_be_visible()
    expect(uploaded_files.get_by_text(file_name2)).to_be_visible()

    # Delete the uploaded file
    uploaded_files.get_by_test_id("stChatInputDeleteBtn").nth(0).click()

    wait_for_app_run(app)

    expect(app.get_by_test_id("stChatUploadedFiles").nth(0)).not_to_have_text(
        file_name2, use_inner_text=True
    )


def test_uploads_and_deletes_multiple_files(
    app: Page, assert_snapshot: ImageCompareFunction
):
    """Test that uploading multiple files at once works correctly."""
    file_name1 = "file1.txt"
    file_content1 = b"file1content"

    file_name2 = "file2.txt"
    file_content2 = b"file2content"

    files = [
        FilePayload(name=file_name1, mimeType="text/plain", buffer=file_content1),
        FilePayload(name=file_name2, mimeType="text/plain", buffer=file_content2),
    ]

    chat_input = app.get_by_test_id("stChatInput").nth(1)
    with app.expect_file_chooser(timeout=60000) as fc_info:
        chat_input.get_by_role("button").nth(0).click()

    file_chooser = fc_info.value
    file_chooser.set_files(files=files)

    wait_for_app_run(app, wait_delay=500)

    uploaded_files = app.get_by_test_id("stChatUploadedFiles").nth(1)
    assert_snapshot(uploaded_files, name="st_chat_input-multiple_files_uploaded")

    uploaded_file_names = uploaded_files.get_by_test_id("stChatInputFileName")
    expect(uploaded_file_names).to_have_count(2)

    # Delete one uploaded file
    uploaded_files.get_by_test_id("stChatInputDeleteBtn").nth(0).click()

    wait_for_app_run(app)

    uploaded_file_names = uploaded_files.get_by_test_id("stChatInputFileName")
    expect(uploaded_file_names).to_have_count(1)

    expect(uploaded_file_names).to_have_text(files[1]["name"], use_inner_text=True)
