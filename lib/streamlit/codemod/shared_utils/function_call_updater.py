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


class FunctionCallUpdater(cst.CSTTransformer):
    """Updates function calls to include a specified parameter.

    This transformer traverses the CST (Concrete Syntax Tree) and updates
    calls to specified helper functions by adding a given parameter if it
    is not already present.

    Attributes:
        helper_functions (set[str]): A set of helper function names to update.
        param_name (str): The name of the parameter to add.
        param_value (str): The value of the parameter to add.
        changes_made (bool): Indicates if any changes were made during the transformation.
        current_function_has_param (bool): Indicates if the current function being visited has the specified parameter.
    """

    def __init__(self, helper_functions: set[str], param_name: str, param_value: str):
        """
        Initializes the FunctionCallUpdater with the specified helper functions,
        parameter name, and parameter value.

        Args:
            helper_functions (set[str]): A set of helper function names to update.
            param_name (str): The name of the parameter to add.
            param_value (str): The value of the parameter to add.
        """
        self.helper_functions = helper_functions
        self.param_name = param_name
        self.param_value = param_value
        self.changes_made = False
        self.current_function_has_param = False

    def visit_FunctionDef(self, node: cst.FunctionDef) -> None:
        """
        Visits a function definition node to check if the current function
        has the specified parameter.

        Args:
            node (cst.FunctionDef): The function definition node being visited.
        """
        # Check if current function has the specified parameter
        self.current_function_has_param = any(
            isinstance(param.name, cst.Name) and param.name.value == self.param_name
            for param in node.params.kwonly_params
        )

    def _should_update_call(self, node: cst.Call) -> bool:
        """
        Checks if the function call should be updated with the specified parameter.

        Args:
            node (cst.Call): The function call node to check.

        Returns:
            bool: True if the function call should be updated, False otherwise.
        """
        if not self.current_function_has_param:
            return False

        if isinstance(node.func, cst.Attribute):
            # Handle self._helper() calls
            return (
                isinstance(node.func.value, cst.Name)
                and node.func.value.value == "self"
                and node.func.attr.value in self.helper_functions
            )
        elif isinstance(node.func, cst.Name):
            # Handle direct function calls
            return node.func.value in self.helper_functions
        return False

    def leave_Call(self, original_node: cst.Call, updated_node: cst.Call) -> cst.Call:
        """
        Updates any call to a helper function to include the specified parameter.

        Args:
            original_node (cst.Call): The original function call node.
            updated_node (cst.Call): The updated function call node.

        Returns:
            cst.Call: The updated function call node with the specified parameter added.
        """
        if not self._should_update_call(updated_node):
            return updated_node

        # Check if the specified parameter is already present
        has_param = any(
            arg.keyword and arg.keyword.value == self.param_name
            for arg in updated_node.args
        )
        if has_param:
            return updated_node

        # Add the specified parameter to the call
        new_args = list(updated_node.args)
        new_kwargs = [
            cst.Arg(
                keyword=cst.Name(self.param_name),
                value=cst.Name(self.param_value),
                equal=cst.AssignEqual(),
            )
        ]
        self.changes_made = True
        return updated_node.with_changes(args=new_args + new_kwargs)
