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
from libcst.metadata import ParentNodeProvider


class ProtoCallCollector(cst.CSTVisitor):
    METADATA_DEPENDENCIES = (ParentNodeProvider,)

    def __init__(self, function_name: str):
        self.function_name = function_name
        self.param_calls: set[str] = (
            set()
        )  # Store variables that are passed to the specified function

    def visit_Call(self, node: cst.Call) -> None:
        """
        Called when a Call node is visited. Checks if the call is to the specified function
        and if so, adds the first argument of the call to the set of param_calls.

        Args:
            node (cst.Call): The call node being visited.
        """
        if (
            isinstance(node.func, cst.Name)
            and node.func.value == self.function_name
            and len(node.args) >= 1
            and isinstance(node.args[0].value, cst.Name)
        ):
            self.param_calls.add(node.args[0].value.value)
