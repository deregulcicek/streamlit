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


def append_to_performance_scores(
    performance_scores: Dict[str, Dict[str, float]],
    datetime: str,
    app_name: str,
    score: float,
) -> None:
    """
    Append a performance score to the performance_scores dictionary.

    Args:
        performance_scores (Dict[str, Dict[str, float]]): Dictionary to store performance scores.
        datetime (str): The datetime key for the performance score.
        app_name (str): The name of the application.
        score (float): The performance score to append.

    Returns:
        None
    """
    if datetime not in performance_scores:
        performance_scores[datetime] = {}

    # if app_name not in performance_scores[datetime]:
    #     performance_scores[datetime][app_name] = []

    performance_scores[datetime][app_name] = score


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


def read_json_files(
    performance_scores: Dict[str, Dict[str, float]], artifact: Dict, directory: str
) -> None:
    """
    Read JSON files from a directory and append their performance scores to the
    performance_scores dictionary.

    Args:
        performance_scores (Dict[str, Dict[str, float]]): Dictionary to store performance scores.
        artifact (Dict): Dictionary containing artifact metadata.
        directory (str): The directory to search for JSON files.

    Returns:
        None
    """
    for root, _, files in os.walk(directory):
        for file in files:
            if file.endswith(".json"):
                json_path = os.path.join(root, file)
                with open(json_path, "r") as json_file:
                    data = json.load(json_file)
                    app_name = json_path.split("_-_")[1]
                    device_type = json_path.split("_-_")[2]
                    append_to_performance_scores(
                        performance_scores,
                        artifact["created_at"],
                        f"{app_name}_{device_type}",
                        data["categories"]["performance"]["score"],
                    )


def get_all_prs_with_label(label: str) -> List[Dict]:
    """
    Get all pull requests with a specific label.

    Args:
        label (str): The label to filter pull requests by.

    Returns:
        List[Dict]: A list of pull requests with the specified label.
    """
    prs_url = "https://api.github.com/repos/streamlit/streamlit/pulls"
    prs = make_github_request(prs_url)

    prs_with_label = [
        pr for pr in prs if any(lbl["name"] == label for lbl in pr["labels"])
    ]
    return prs_with_label


def get_workflow_run_id(ref: str, workflow_name: str) -> Optional[int]:
    """
    Get the workflow run ID for a specific branch and workflow name.

    Args:
        ref (str): The branch reference (e.g., 'refs/heads/main').
        workflow_name (str): The name of the workflow to find.

    Returns:
        Optional[int]: The ID of the workflow run if found, otherwise None.
    """
    url = "https://api.github.com/repos/streamlit/streamlit/actions/runs"
    response = make_github_request(url, params={"event": "pull_request", "branch": ref})
    workflow_runs = response["workflow_runs"]

    # Filter the workflow runs to find the one with the specified name
    for run in workflow_runs:
        if run["name"] == workflow_name:
            return run["id"]

    return None


def get_nightly_builds(per_page: int = 5) -> Dict:
    """
    Get the nightly builds from GitHub.

    Args:
        per_page (int): The number of builds to retrieve per page.

    Returns:
        Dict: The JSON response from the GitHub API.
    """
    url = "https://api.github.com/repos/streamlit/streamlit/actions/workflows/nightly.yml/runs"
    return make_github_request(url, params={"per_page": per_page})


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
