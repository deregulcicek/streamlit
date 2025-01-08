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

import json
import os
import zipfile
import re
import requests
from typing import Dict, List, Optional, Union

# Read the GH_TOKEN from the environment
GH_TOKEN = os.getenv("GH_TOKEN")
if not GH_TOKEN:
    raise EnvironmentError("GH_TOKEN environment variable not set")

HEADERS = {
    "Authorization": f"token {GH_TOKEN}",
    "Accept": "application/vnd.github.v3+json",
    "User-Agent": "CI-Performance-Check",
}


def make_http_request(
    url: str,
    headers: Optional[Dict[str, str]] = None,
    params: Optional[Dict[str, Union[str, int]]] = None,
) -> requests.Response:
    """
    Make an HTTP GET request.

    Args:
        url (str): The URL to make the request to.
        headers (Optional[Dict[str, str]]): Optional dictionary of headers.
        params (Optional[Dict[str, Union[str, int]]]): Optional dictionary of query parameters.

    Returns:
        requests.Response: The HTTP response object.
    """
    response = requests.get(url, headers=headers, params=params)
    response.raise_for_status()
    return response


def make_github_request(
    url: str, params: Optional[Dict[str, Union[str, int]]] = None
) -> Dict:
    """
    Make a GET request to the GitHub API.

    Args:
        url (str): The URL to make the request to.
        params (Optional[Dict[str, Union[str, int]]]): Optional dictionary of query parameters.

    Returns:
        Dict: The JSON response from the GitHub API.
    """
    response = make_http_request(url, headers=HEADERS, params=params)
    return response.json()


def download_artifact(
    download_url: str, artifact_name: str, artifact_directory: str
) -> str:
    """
    Download an artifact from a given URL and save it as a zip file in the
    ./artifacts directory.

    Args:
        download_url (str): The URL to download the artifact from.
        artifact_name (str): The name to save the downloaded artifact as.
        artifact_directory (str): The directory to save the downloaded artifact in.

    Returns:
        str: The path to the downloaded zip file.
    """
    response = make_http_request(download_url, headers=HEADERS)
    content_length = response.headers.get("Content-Length")
    print(
        f"Downloading artifact: {artifact_name}, URL: {download_url} Content-Length: {content_length}"
    )
    os.makedirs(artifact_directory, exist_ok=True)
    zip_path = os.path.join(artifact_directory, f"{artifact_name}.zip")
    with open(zip_path, "wb") as f:
        f.write(response.content)
    print(f"Downloaded to {zip_path}")
    return zip_path


def unzip_file(zip_path: str, artifact_directory: str) -> str:
    """
    Unzip a zip file to a directory in the ./artifacts directory that has the same name as the file.

    Args:
        zip_path (str): The path to the zip file.
        artifact_directory (str): The directory to save the extracted files.

    Returns:
        str: The path to the directory where the zip file was extracted.
    """
    print(f"Unzipping {zip_path}")
    file_name = os.path.splitext(os.path.basename(zip_path))[0]
    extract_to = os.path.join(artifact_directory, file_name)
    print(f"Extracting to {extract_to}")
    os.makedirs(extract_to, exist_ok=True)
    with zipfile.ZipFile(zip_path, "r") as zip_ref:
        zip_ref.extractall(extract_to)

    return extract_to


def get_build_from_github(commit_hash: str) -> Optional[Dict]:
    """
    Get the build data from GitHub for a specific commit hash.

    Args:
        commit_hash (str): The commit hash to get the build data for.

    Returns:
        Optional[Dict]: The build data from GitHub.
    """
    try:
        url = f"https://api.github.com/repos/streamlit/streamlit/commits/{commit_hash}/check-runs"
        response = make_github_request(url)
        return response
    except Exception as error:
        print(f"Error fetching build from GitHub: {error}")
        return None


def get_check_run_by_name(check_runs: List[Dict], name: str) -> Optional[Dict]:
    """
    Get a check run by name from a list of check runs.

    Args:
        check_runs (List[Dict]): The list of check runs.
        name (str): The name of the check run to find.

    Returns:
        Optional[Dict]: The check run with the specified name, or None if not found.
    """
    return next(
        (check_run for check_run in check_runs if check_run["name"] == name), None
    )


def extract_run_id_from_url(url: str) -> Optional[str]:
    """
    Extract the run ID from a GitHub actions URL.

    Args:
        url (str): The URL to extract the run ID from.

    Returns:
        Optional[str]: The extracted run ID, or None if not found.
    """
    match = re.search(r"/runs/(\d+)/", url)
    return match.group(1) if match else None


def get_artifact_for_run_id(run_id: str) -> Optional[Dict]:
    """
    Get the artifacts for a specific run ID from GitHub.

    Args:
        run_id (str): The run ID to get the artifacts for.

    Returns:
        Optional[Dict]: The artifact data from GitHub.
    """
    try:
        url = f"https://api.github.com/repos/streamlit/streamlit/actions/runs/{run_id}/artifacts"
        response = make_github_request(url)
        return response
    except Exception as error:
        print(f"Error fetching artifact from GitHub: {error}")
        return None


def get_artifact_by_name(artifacts: List[Dict], name: str) -> Optional[Dict]:
    """
    Get an artifact by name from a list of artifacts.

    Args:
        artifacts (List[Dict]): The list of artifacts.
        name (str): The name of the artifact to find.

    Returns:
        Optional[Dict]: The artifact with the specified name, or None if not found.
    """
    return next((artifact for artifact in artifacts if artifact["name"] == name), None)
