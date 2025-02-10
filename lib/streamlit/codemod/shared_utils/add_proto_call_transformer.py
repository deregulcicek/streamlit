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

import re

import libcst as cst


class AddProtoCallTransformer(cst.CSTTransformer):
    """
    A CSTTransformer that adds a call to function_name for specified proto variables
    within functions.

    Attributes:
        proto_vars (dict[str, list[str]]): A dictionary mapping function names to lists of proto variable names.
        existing_calls (set[str]): A set of proto variable names that already have the function call.
        changes_made (bool): A flag indicating whether any changes were made during the transformation.
        current_function (Optional[str]): The name of the function currently being visited.
        function_name (str): The name of the function to call for adding the specified function.
        arg_name (str): The name of the argument to pass to the function.
        skip_patterns (list[str]): A list of regex patterns to identify functions that should be skipped.
    """

    def __init__(
        self,
        proto_vars: dict[str, list[str]],
        existing_calls: set[str],
        function_name: str,
        arg_name: str,
        skip_patterns: list[str],
    ):
        """
        Initializes the AddProtoCallTransformer with the given proto variables, existing calls, and function name.

        Args:
            proto_vars (dict[str, list[str]]): A dictionary mapping function names to lists of proto variable names.
            existing_calls (set[str]): A set of proto variable names that already have the function call.
            function_name (str): The name of the function to call for adding the specified function.
            arg_name (str): The name of the argument to pass to the function.
            skip_patterns (list[str]): A list of regex patterns to identify functions that should be skipped.
        """
        self.proto_vars = proto_vars
        self.existing_calls = existing_calls
        self.function_name = function_name
        self.arg_name = arg_name
        self.changes_made = False
        self.current_function: str | None = None
        self.compiled_patterns = [re.compile(pattern) for pattern in skip_patterns]
        self.current_decorator_name: str | None = None
        self.should_skip_current_function = False

    def _should_skip_decorator(self, decorator: cst.Decorator) -> bool:
        """Check if the decorator should be skipped based on regex patterns."""
        if isinstance(decorator.decorator, cst.Call):
            if (
                isinstance(decorator.decorator.func, cst.Name)
                and decorator.decorator.func.value == "gather_metrics"
                and decorator.decorator.args
            ):
                first_arg = decorator.decorator.args[0]
                if isinstance(first_arg.value, cst.SimpleString):
                    value = first_arg.value.value.strip("'\"")
                    return any(
                        pattern.search(value) for pattern in self.compiled_patterns
                    )
        return False

    def visit_Decorator(self, node: cst.Decorator) -> bool:
        if isinstance(node.decorator, cst.Call):
            if isinstance(node.decorator.func, cst.Name):
                self.current_decorator_name = node.decorator.func.value
        return True

    def leave_Decorator(
        self,
        original_node: cst.Decorator,
        updated_node: cst.Decorator,
    ) -> cst.Decorator:
        """Reset the current decorator name and return the updated node."""
        self.current_decorator_name = None
        return updated_node

    def visit_FunctionDef(self, node: cst.FunctionDef) -> None:
        """
        Called when a FunctionDef node is visited. Sets the current function name.

        Args:
            node (cst.FunctionDef): The function definition node being visited.
        """
        self.current_function = node.name.value
        self.should_skip_current_function = any(
            self._should_skip_decorator(dec) for dec in node.decorators
        )

    def leave_FunctionDef(
        self, original_node: cst.FunctionDef, updated_node: cst.FunctionDef
    ) -> cst.FunctionDef:
        """
        Called when leaving a FunctionDef node. Resets the current function name to None.

        Args:
            original_node (cst.FunctionDef): The original function definition node.
            updated_node (cst.FunctionDef): The updated function definition node.

        Returns:
            cst.FunctionDef: The updated function definition node.
        """
        self.current_function = None
        self.should_skip_current_function = False
        return updated_node

    def leave_SimpleStatementLine(
        self,
        original_node: cst.SimpleStatementLine,
        updated_node: cst.SimpleStatementLine,
    ) -> cst.BaseStatement | cst.FlattenSentinel[cst.BaseStatement]:
        """
        Called when leaving a SimpleStatementLine node. Adds a call to function_name if necessary.

        Args:
            original_node (cst.SimpleStatementLine): The original simple statement line node.
            updated_node (cst.SimpleStatementLine): The updated simple statement line node.

        Returns:
            cst.BaseStatement | cst.FlattenSentinel[cst.BaseStatement]: The updated node, possibly with an added function call.
        """
        # Skip if current function should be skipped based on decorator
        if self.should_skip_current_function:
            return updated_node

        if not self.current_function or self.current_function not in self.proto_vars:
            return updated_node

        # Check if this line contains a proto instantiation
        for stmt in updated_node.body:
            if isinstance(stmt, cst.Assign):
                for target in stmt.targets:
                    if (
                        isinstance(target.target, cst.Name)
                        and target.target.value
                        in self.proto_vars[self.current_function]
                        and target.target.value not in self.existing_calls
                    ):
                        # Create the function call node
                        function_call = cst.SimpleStatementLine(
                            [
                                cst.Expr(
                                    value=cst.Call(
                                        func=cst.Name(self.function_name),
                                        args=[
                                            cst.Arg(
                                                value=cst.Name(target.target.value)
                                            ),
                                            cst.Arg(value=cst.Name(self.arg_name)),
                                        ],
                                    )
                                )
                            ]
                        )
                        self.changes_made = True
                        # Return flattened sequence of statements
                        return cst.FlattenSentinel([updated_node, function_call])

        return updated_node
