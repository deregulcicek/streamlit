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

import os
import sys
from .git import get_branch_point_commit_hash, rev_parse
from .github import (
    download_artifact,
    extract_run_id_from_url,
    get_artifact_by_name,
    get_artifact_for_run_id,
    get_build_from_github,
    get_shortest_check_run_by_name,
    get_check_run_by_name,
    unzip_file,
)
from .test_diff_analyzer import main as process_diffs


def main():
    branch_point = get_branch_point_commit_hash()

    if not branch_point:
        branch_point = rev_parse()

        if not branch_point:
            sys.exit(1)

    print(f"Branch point commit hash: {branch_point}")

    build_data = get_build_from_github(branch_point)

    if not build_data:
        print("Error fetching build from GitHub")
        sys.exit(1)

    e2e_playwright_run = get_check_run_by_name(
        build_data["check_runs"], "playwright-performance"
    )

    if not e2e_playwright_run:
        e2e_playwright_run = get_shortest_check_run_by_name(
            build_data["check_runs"], "playwright-e2e-tests"
        )

    if not e2e_playwright_run:
        print("Error finding e2e playwright check run")
        sys.exit(1)

    if e2e_playwright_run.get("status") != "completed":
        # TODO: We may want to go find a previous run that is completed instead
        # of exiting.
        print("Performance run is not completed yet")
        sys.exit(1)

    run_id = extract_run_id_from_url(e2e_playwright_run["details_url"])

    if not run_id:
        print("Error extracting run ID from URL")
        sys.exit(1)

    this_file_directory = os.path.dirname(os.path.realpath(__file__))
    performance_results_directory = os.path.abspath(
        os.path.join(this_file_directory, "../../e2e_playwright/performance-results")
    )
    artifact_directory = os.path.abspath(
        os.path.join(performance_results_directory, "downloaded-artifacts")
    )
    print(artifact_directory)

    print(f"Branch point latest run ID: {run_id}")

    baseline_performance_directory = os.path.join(artifact_directory, run_id)

    # Optimization: if the baseline performance directory already exists, skip
    # downloading the artifact. This is handy in local development flows.
    if not os.path.exists(baseline_performance_directory):
        artifact_data = get_artifact_for_run_id(run_id)

        if not artifact_data:
            print("Error fetching artifact for run ID")
            sys.exit(1)

        performance_artifact = get_artifact_by_name(
            artifact_data["artifacts"], "playwright_performance_results"
        )

        if not performance_artifact:
            print("Error finding performance artifact")
            sys.exit(1)

        downloaded_zip_path = download_artifact(
            performance_artifact["archive_download_url"], run_id, artifact_directory
        )

        baseline_performance_directory = unzip_file(
            downloaded_zip_path, artifact_directory
        )
        # Delete zip file after extracting
        os.remove(downloaded_zip_path)

        print(f"Extracted to: {baseline_performance_directory}")

    analyzed_test_diff_results = process_diffs(
        baseline_performance_directory,
        performance_results_directory,
    )
    print(analyzed_test_diff_results)

    if analyzed_test_diff_results["regression_count"] > 0:
        print(
            "There are performance regressions. Please view output above for details."
        )
        sys.exit(1)


if __name__ == "__main__":
    main()
