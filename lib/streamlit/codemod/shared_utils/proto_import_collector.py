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


class ProtoImportCollector(cst.CSTVisitor):
    """
    A CSTVisitor that collects import statements from the 'streamlit.proto' module.

    Attributes:
        proto_imports (set): A set of imported names from 'streamlit.proto'.
        proto_aliases (dict): A dictionary mapping original import names to their aliases.
    """

    def __init__(self):
        """
        Initializes the ProtoImportCollector with empty collections for proto imports and aliases.
        """
        self.proto_imports = set()
        self.proto_aliases = {}  # Track original -> alias mapping

    def visit_ImportFrom(self, node: cst.ImportFrom) -> None:
        """
        Visits 'from ... import ...' statements and collects imports from 'streamlit.proto'.

        Args:
            node (cst.ImportFrom): A node representing a 'from ... import ...' statement.
        """
        # Check if the import is from streamlit.proto
        if node.module:
            module_parts = []
            current = node.module

            # Handle attribute chains (e.g., streamlit.proto.Arrow_pb2)
            while isinstance(current, cst.Attribute):
                module_parts.append(current.attr.value)
                next_value = current.value
                # Only continue if next value is Attribute or Name
                if isinstance(next_value, (cst.Attribute, cst.Name)):
                    current = next_value
                else:
                    break

            # Handle the final name (e.g., streamlit)
            if isinstance(current, cst.Name):
                module_parts.append(current.value)

            # Construct the full module path
            module_path = ".".join(reversed(module_parts))

            if module_path.startswith("streamlit.proto"):
                # Collect all imported names, skip import * statements
                if not isinstance(node.names, cst.ImportStar):
                    for name in node.names:
                        if isinstance(name.name, cst.Name):
                            original_name = name.name.value
                            self.proto_imports.add(original_name)
                            # Handle aliases
                            if name.asname and isinstance(name.asname.name, cst.Name):
                                alias = name.asname.name.value
                                self.proto_aliases[original_name] = alias
                                self.proto_imports.add(
                                    alias
                                )  # Add alias to valid imports
