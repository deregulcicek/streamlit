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

import libcst as cst
from libcst.metadata import MetadataWrapper

from streamlit.codemod.shared_utils.add_import_transformer import AddImportTransformer
from streamlit.codemod.shared_utils.add_param_transformer import AddParamTransformer
from streamlit.codemod.shared_utils.add_proto_call_transformer import (
    AddProtoCallTransformer,
)
from streamlit.codemod.shared_utils.function_call_collector import FunctionCallCollector
from streamlit.codemod.shared_utils.function_call_updater import FunctionCallUpdater
from streamlit.codemod.shared_utils.proto_call_collector import ProtoCallCollector
from streamlit.codemod.shared_utils.proto_import_collector import ProtoImportCollector
from streamlit.codemod.shared_utils.proto_instantiation_collector import (
    ProtoInstantiationCollector,
)


def find_helper_functions(
    proto_vars: dict[str, list[str]],
    function_calls: dict[str, set[str]],
    called_by: dict[str, set[str]],
) -> set[str]:
    """Find all helper functions that create protos."""
    helper_functions = set()
    decorated_functions = {
        name
        for name, dec in proto_vars.items()
        if any(name.startswith("_") for name in called_by.get(name, set()))
    }

    def traverse_calls(func_name: str, visited: set[str]) -> None:
        if func_name in visited:
            return
        visited.add(func_name)

        # Add any function that creates protos and is called by a decorated function
        if func_name in proto_vars:
            helper_functions.add(func_name)

        # Follow both outgoing and incoming calls
        for called_func in function_calls.get(func_name, set()):
            traverse_calls(called_func, visited)
        for calling_func in called_by.get(func_name, set()):
            traverse_calls(calling_func, visited)

    # Start from both decorated functions and known proto-creating functions
    for func_name in set(decorated_functions) | set(proto_vars.keys()):
        traverse_calls(func_name, set())

    return helper_functions


# Regex patterns to skip - add more patterns as needed
SKIP_PATTERNS = [
    r"^column_config\.",  # Matches anything that starts with column_config.
    r"balloons",  # Matches balloons
    r"dialog",  # Matches dialog
    r"snow",  # Matches snow
    r"write_stream",
    r"toast",
    r"spinner",
]


def transform_file(source_code: str) -> str:
    source_tree = cst.parse_module(source_code)
    wrapper = MetadataWrapper(source_tree)

    # Collect proto imports and instantiations
    proto_collector = ProtoImportCollector()
    source_tree.visit(proto_collector)

    instantiation_collector = ProtoInstantiationCollector(proto_collector.proto_imports)
    wrapper.visit(instantiation_collector)

    # Collect function calls and relationships
    call_collector = FunctionCallCollector()
    wrapper.visit(call_collector)

    # Find helper functions using bidirectional call graph
    helper_functions = find_helper_functions(
        instantiation_collector.instantiations,
        call_collector.function_calls,
        call_collector.called_by,
    )

    # Collect existing flex proto calls
    flex_call_collector = ProtoCallCollector("add_flex_to_proto")
    wrapper.visit(flex_call_collector)

    # First add flex parameter to all functions (both decorated and helpers)
    flex_transformer = AddParamTransformer(
        helper_functions,
        "flex",
        "flex : int | str | None\n    A string or integer that determines the flex value of the element.",
        r"(\s*flex :.*(?:\n\s+[^\n:]+)*)",
        SKIP_PATTERNS,
    )
    modified_tree = source_tree.visit(flex_transformer)

    # Then update function calls to pass flex parameter
    call_updater = FunctionCallUpdater(helper_functions, "flex", "flex")
    modified_tree = modified_tree.visit(call_updater)

    # Finally add flex proto calls where needed
    proto_call_transformer = AddProtoCallTransformer(
        instantiation_collector.instantiations,
        flex_call_collector.param_calls,
        "add_flex_to_proto",
        "flex",
        SKIP_PATTERNS,
    )
    modified_tree = modified_tree.visit(proto_call_transformer)

    # Add import if needed
    if (
        flex_transformer.changes_made
        or proto_call_transformer.changes_made
        or call_updater.changes_made
    ):
        import_transformer = AddImportTransformer(
            "elements.lib.flex", "add_flex_to_proto"
        )
        modified_tree.visit(import_transformer)
        if not import_transformer.has_import:
            modified_tree = modified_tree.visit(
                AddImportTransformer("elements.lib.flex", "add_flex_to_proto")
            )

    return modified_tree.code
