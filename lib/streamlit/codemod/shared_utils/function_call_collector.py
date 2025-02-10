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

import libcst as cst
from libcst.metadata import ParentNodeProvider


class FunctionCallCollector(cst.CSTVisitor):
    """
    Collects information about function calls within a module.

    Attributes:
        function_calls (dict[str, set[str]]): Maps each function to the set of functions it calls.
        called_by (dict[str, set[str]]): Maps each function to the set of functions that call it.
        current_function (Optional[str]): The name of the function currently being visited.
    """

    METADATA_DEPENDENCIES = (ParentNodeProvider,)

    def __init__(self):
        """
        Initializes the FunctionCallCollector with empty dictionaries for function_calls and called_by,
        and sets the current_function to None.
        """
        self.function_calls: dict[
            str, set[str]
        ] = {}  # caller -> set of called functions
        self.called_by: dict[str, set[str]] = {}  # callee -> set of callers
        self.current_function: str | None = None

    def visit_FunctionDef(self, node: cst.FunctionDef) -> None:
        """
        Called when a FunctionDef node is visited. Sets the current function name and initializes
        the called_by entry for the function if it does not already exist.

        Args:
            node (cst.FunctionDef): The function definition node being visited.
        """
        self.current_function = node.name.value
        # Initialize called_by entry
        if self.current_function not in self.called_by:
            self.called_by[self.current_function] = set()

    def leave_FunctionDef(self, original_node: cst.FunctionDef) -> None:
        """
        Called when leaving a FunctionDef node. Resets the current function name to None.

        Args:
            original_node (cst.FunctionDef): The function definition node being left.
        """
        self.current_function = None

    def visit_Call(self, node: cst.Call) -> None:
        """
        Called when a Call node is visited. Tracks the function calls made within the current function.

        Args:
            node (cst.Call): The call node being visited.
        """
        if self.current_function and isinstance(node.func, (cst.Name, cst.Attribute)):
            # Handle both direct calls and method calls
            func_name = None
            if isinstance(node.func, cst.Name):
                func_name = node.func.value
            elif isinstance(node.func, cst.Attribute):
                # Handle self._method() calls
                if (
                    isinstance(node.func.value, cst.Name)
                    and node.func.value.value == "self"
                ):
                    # TODO: Why is this prefixed with "_"?
                    func_name = f"_{node.func.attr.value}"

            if func_name:
                # Track who calls whom
                if self.current_function not in self.function_calls:
                    self.function_calls[self.current_function] = set()
                self.function_calls[self.current_function].add(func_name)

                # Track who is called by whom
                if func_name not in self.called_by:
                    self.called_by[func_name] = set()
                self.called_by[func_name].add(self.current_function)
