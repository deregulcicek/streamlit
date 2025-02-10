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


class ProtoInstantiationCollector(cst.CSTVisitor):
    """
    A CSTVisitor that collects instantiations of protobuf objects within functions.

    Attributes:
        proto_imports (set[str]): A set of protobuf import names to track.
        instantiations (dict[str, list[str]]): A dictionary mapping function names to lists of variable names
                                               that are assigned protobuf objects.
        current_function (Optional[str]): The name of the currently visited function, or None if not in a function.
    """

    METADATA_DEPENDENCIES = (ParentNodeProvider,)

    def __init__(self, proto_imports: set[str]):
        """
        Initialize the ProtoInstantiationCollector.

        Args:
            proto_imports (set[str]): A set of protobuf import names to track.
        """
        super().__init__()
        self.proto_imports = proto_imports
        self.instantiations: dict[str, list[str]] = {}
        self.current_function: str | None = None

    def visit_FunctionDef(self, node: cst.FunctionDef) -> None:
        """
        Called when a FunctionDef node is visited. Sets the current function name.

        Args:
            node (cst.FunctionDef): The function definition node being visited.
        """
        self.current_function = node.name.value

    def leave_FunctionDef(self, original_node: cst.FunctionDef) -> None:
        """
        Called when leaving a FunctionDef node. Resets the current function name.

        Args:
            original_node (cst.FunctionDef): The function definition node being left.
        """
        self.current_function = None

    def visit_Call(self, node: cst.Call) -> None:
        """
        Called when a Call node is visited. Checks if the call is to create a proto object
        and records the variable name if it is.

        Args:
            node (cst.Call): The call node being visited.
        """
        # Check if this is a call to create a proto object
        if isinstance(node.func, cst.Name) and node.func.value in self.proto_imports:
            parent = self.get_metadata(ParentNodeProvider, node)
            if isinstance(parent, cst.Assign):
                for target in parent.targets:
                    if isinstance(target.target, cst.Name):
                        var_name = target.target.value
                        if self.current_function not in self.instantiations:
                            if self.current_function is not None:
                                self.instantiations[self.current_function] = []
                        if self.current_function is not None:
                            self.instantiations[self.current_function].append(var_name)
