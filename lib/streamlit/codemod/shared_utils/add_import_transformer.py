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
from libcst import matchers as m


class AddImportTransformer(cst.CSTTransformer):
    """
    A CSTTransformer that adds a specified import statement to a module if it does not already exist.

    Attributes:
        module (str): The module from which to import.
        name (str): The name to import from the module.
        has_import (bool): A flag indicating whether the import already exists in the module.
    """

    def __init__(self, module: str, name: str):
        """
        Initialize the AddImportTransformer with the specified module and name.

        Args:
            module (str): The module from which to import.
            name (str): The name to import from the module.
        """
        self.module = module
        self.name = name
        self.has_import = False

    def visit_ImportFrom(self, node: cst.ImportFrom) -> None:
        """
        Visit each ImportFrom node to check if the specified import already exists.

        Args:
            node (cst.ImportFrom): The ImportFrom node to visit.
        """
        # Check during visit if import already exists
        if m.matches(
            node,
            m.ImportFrom(
                module=m.Attribute(
                    value=m.Attribute(
                        value=m.Name(self.module.split(".")[0]),
                        attr=m.Name(self.module.split(".")[1]),
                    ),
                    attr=m.Name(self.module.split(".")[2]),
                ),
                names=[m.ImportAlias(name=m.Name(self.name))],
            ),
        ):
            self.has_import = True

    def leave_Module(
        self, original_node: cst.Module, updated_node: cst.Module
    ) -> cst.Module:
        """
        Leave the Module node and add the specified import if it does not already exist.

        Args:
            original_node (cst.Module): The original Module node.
            updated_node (cst.Module): The updated Module node.

        Returns:
            cst.Module: The updated Module node with the new import added if it was not already present.
        """
        if not self.has_import:
            # Add the import at the beginning after any copyright comments
            new_import = cst.ImportFrom(
                module=cst.Attribute(
                    value=cst.Attribute(
                        value=cst.Name(self.module.split(".")[0]),
                        attr=cst.Name(self.module.split(".")[1]),
                    ),
                    attr=cst.Name(self.module.split(".")[2]),
                ),
                names=[cst.ImportAlias(name=cst.Name(self.name))],
            )

            # Find position after last comment
            insert_pos = 0
            for i, node in enumerate(original_node.body):
                if isinstance(node, cst.SimpleStatementLine) and all(
                    isinstance(stmt, cst.Expr)
                    and isinstance(stmt.value, cst.SimpleString)
                    for stmt in node.body
                ):
                    insert_pos = i + 1
                else:
                    break

            new_body = list(updated_node.body)
            new_body.insert(insert_pos, cst.SimpleStatementLine([new_import]))
            return updated_node.with_changes(body=new_body)

        return updated_node
