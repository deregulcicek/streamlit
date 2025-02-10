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

import re

import libcst as cst


class AddParamTransformer(cst.CSTTransformer):
    """
    A CSTTransformer that adds a specified parameter to functions and updates their docstrings.

    Attributes:
        helper_functions (set[str]): A set of function names to which the parameter should be added.
        param_name (str): The name of the parameter to add.
        param_docstring_text (str): The text to add to the function's docstring for the parameter.
        param_pattern (str): A regex pattern to identify the parameter in the docstring.
        skip_patterns (list[str]): A list of regex patterns to identify decorators that should be skipped.
    """

    def __init__(
        self,
        helper_functions: set[str],
        param_name: str,
        param_docstring_text: str,
        param_pattern: str,
        skip_patterns: list[str],
    ):
        """
        Initialize the AddParamTransformer.

        Args:
            helper_functions (set[str]): A set of function names to which the parameter should be added.
            param_name (str): The name of the parameter to add.
            param_docstring_text (str): The text to add to the function's docstring for the parameter.
            param_pattern (str): A regex pattern to identify the parameter in the docstring.
            skip_patterns (list[str]): A list of regex patterns to identify decorators that should be skipped.
        """
        self.changes_made = False
        self.helper_functions = helper_functions
        self.param_name = param_name
        self.param_docstring_text = param_docstring_text
        self.param_pattern = re.compile(param_pattern)
        self.compiled_patterns = [re.compile(pattern) for pattern in skip_patterns]

    def _detect_docstring_indentation(self, docstring: str) -> str:
        """
        Detect the indentation level of parameters in a docstring.

        Args:
            docstring (str): The docstring to analyze.

        Returns:
            str: The detected indentation level.
        """
        # Look for Parameters section and get its indentation
        params_match = re.search(
            r"^(\s*)Parameters\s*\n\s*-+\s*\n", docstring, re.MULTILINE
        )
        if not params_match:
            return "    "  # Default indentation if no Parameters section found

        params_indent = params_match.group(1)
        # Look at the first parameter's indentation
        first_param = re.search(
            r"^(\s+)\w+\s*:", docstring[params_match.end() :], re.MULTILINE
        )
        if first_param:
            return first_param.group(1)
        return params_indent + "    "  # Add one level if no parameters found

    def _format_param_docstring(self, base_indent: str) -> str:
        """
        Format parameter docstring with proper indentation levels.

        Args:
            base_indent (str): The base indentation level.

        Returns:
            str: The formatted parameter docstring.
        """
        lines = self.param_docstring_text.split("\n")
        return (
            base_indent
            + lines[0]
            + "\n"
            + base_indent
            + "    "
            + lines[1].strip()  # Add one more level for description
        )

    def _update_docstring(self, doc_node: cst.SimpleString) -> cst.SimpleString:
        """
        Update docstring to include parameter documentation.

        Args:
            doc_node (cst.SimpleString): The docstring node to update.

        Returns:
            cst.SimpleString: The updated docstring node.
        """
        docstring = doc_node.value

        # Detect indentation level
        indent = self._detect_docstring_indentation(docstring)
        # Format parameter documentation with detected indentation
        indented_param_doc = self._format_param_docstring(indent)

        # Find Parameters section
        params_match = re.search(r"(\s*Parameters\s*\n\s*----------\s*\n)", docstring)
        if not params_match:
            return doc_node

        # Find where Parameters section ends
        params_section_start = params_match.end()
        params_end = re.search(
            r"(\n\s*Returns\s*\n\s*-------|\n\s*Examples\s*\n|\n\s*Example\s*\n)",
            docstring[params_section_start:],
        )
        params_section_end = (
            params_section_start + params_end.start()
            if params_end
            else len(docstring) - 1
        )
        params_section = docstring[params_section_start:params_section_end]

        # Look for existing parameter
        param_match = self.param_pattern.search(params_section)
        if param_match:
            # Replace existing parameter with new one
            new_params_section = (
                params_section[: param_match.start()]
                + "\n\n"
                + indented_param_doc
                + params_section[param_match.end() :]
            )
        else:
            # Add parameter at the end of the parameters section
            new_params_section = params_section.rstrip() + "\n\n" + indented_param_doc

        # Reconstruct the full docstring
        new_docstring = (
            docstring[:params_section_start]
            + new_params_section
            + docstring[params_section_end:]
        )
        return doc_node.with_changes(value=new_docstring)

    def _is_param_name(self, param: cst.Param) -> bool:
        """
        Check if parameter is named as specified.

        Args:
            param (cst.Param): The parameter to check.

        Returns:
            bool: True if the parameter name matches, False otherwise.
        """
        return isinstance(param.name, cst.Name) and param.name.value == self.param_name

    def _create_param(self, comma: bool = True) -> cst.Param:
        """
        Create a correctly formatted parameter.

        Args:
            comma (bool): Whether to include a comma after the parameter. Defaults to True.

        Returns:
            cst.Param: The created parameter.
        """
        p = cst.Param(
            name=cst.Name(self.param_name),
            annotation=cst.Annotation(
                annotation=cst.BinaryOperation(
                    left=cst.BinaryOperation(
                        left=cst.Name("int"),
                        operator=cst.BitOr(),
                        right=cst.Name("str"),
                    ),
                    operator=cst.BitOr(),
                    right=cst.Name("None"),
                )
            ),
            default=cst.Name("None"),
            equal=cst.AssignEqual(),
        )

        if comma:
            p.with_changes(comma=cst.Comma())

        return p

    def _should_skip_decorator(self, decorator: cst.Decorator) -> bool:
        """
        Check if the decorator should be skipped based on regex patterns.

        Args:
            decorator (cst.Decorator): The decorator to check.

        Returns:
            bool: True if the decorator should be skipped, False otherwise.
        """
        if isinstance(decorator.decorator, cst.Call):
            if (
                isinstance(decorator.decorator.func, cst.Name)
                and decorator.decorator.func.value == "gather_metrics"
                and decorator.decorator.args
            ):
                # Check first argument against compiled patterns
                first_arg = decorator.decorator.args[0]
                if isinstance(first_arg.value, cst.SimpleString):
                    # Remove quotes from the string value
                    value = first_arg.value.value.strip("'\"")
                    return any(
                        pattern.search(value) for pattern in self.compiled_patterns
                    )
        return False

    def _has_correct_param(self, kwonly_params) -> bool:
        """
        Check if function has correctly formatted parameter.

        Args:
            kwonly_params (list[cst.Param]): The list of keyword-only parameters to check.

        Returns:
            bool: True if the function has the correctly formatted parameter, False otherwise.
        """
        for param in kwonly_params:
            if (
                self._is_param_name(param)
                and isinstance(param.annotation, cst.Annotation)
                and isinstance(param.annotation.annotation, cst.BinaryOperation)
                and isinstance(param.default, cst.Name)
                and param.default.value == "None"
            ):
                # Check for correct type order: int | str | None
                anno = param.annotation.annotation
                if (
                    isinstance(anno.left, cst.BinaryOperation)
                    and isinstance(anno.left.left, cst.Name)
                    and anno.left.left.value == "int"
                    and isinstance(anno.left.right, cst.Name)
                    and anno.left.right.value == "str"
                    and isinstance(anno.right, cst.Name)
                    and anno.right.value == "None"
                ):
                    return True
        return False

    def _should_add_param(self, node: cst.FunctionDef) -> bool:
        """
        Determine if the parameter should be added to the function.

        Args:
            node (cst.FunctionDef): The function definition node to check.

        Returns:
            bool: True if the parameter should be added, False otherwise.
        """
        # Check for gather_metrics decorator
        for dec in node.decorators:
            if self._should_skip_decorator(dec):
                return False
            if isinstance(dec.decorator, cst.Call):
                if (
                    isinstance(dec.decorator.func, cst.Name)
                    and dec.decorator.func.value == "gather_metrics"
                ):
                    return True
            elif (
                isinstance(dec.decorator, cst.Name)
                and dec.decorator.value == "gather_metrics"
            ):
                return True

        # Check if it's a helper function
        return node.name.value in self.helper_functions

    def leave_FunctionDef(
        self, original_node: cst.FunctionDef, updated_node: cst.FunctionDef
    ) -> cst.FunctionDef:
        """
        Process the function definition node when leaving it.

        Args:
            original_node (cst.FunctionDef): The original function definition node.
            updated_node (cst.FunctionDef): The updated function definition node.

        Returns:
            cst.FunctionDef: The potentially modified function definition node.
        """
        if not self._should_add_param(original_node):
            return updated_node

        # Update docstring if it exists
        if (
            updated_node.body.body
            and isinstance(updated_node.body.body[0], cst.SimpleStatementLine)
            and len(updated_node.body.body[0].body) == 1
            and isinstance(updated_node.body.body[0].body[0], cst.Expr)
            and isinstance(updated_node.body.body[0].body[0].value, cst.SimpleString)
        ):
            docstring_node = updated_node.body.body[0].body[0].value
            updated_docstring = self._update_docstring(docstring_node)
            if updated_docstring is not docstring_node:
                self.changes_made = True
                new_body = list(updated_node.body.body)
                new_body[0] = cst.SimpleStatementLine([cst.Expr(updated_docstring)])
                updated_node = updated_node.with_changes(
                    body=updated_node.body.with_changes(body=new_body)
                )

        # Check if function already has correct parameter
        if self._has_correct_param(updated_node.params.kwonly_params):
            return updated_node

        # Check for and fix any malformed parameters
        params = list(updated_node.params.params)
        kwonly_params = list(updated_node.params.kwonly_params)
        found_param = False
        needs_update = False

        # Check and fix parameter in regular params
        for i, param in enumerate(params):
            if self._is_param_name(param):
                found_param = True
                # Move parameter to kwonly params if it's in regular params
                needs_update = True
                params.pop(i)
                kwonly_params.append(self._create_param())
                break

        # Check and fix parameter in kwonly params
        for i, param in enumerate(kwonly_params):
            if self._is_param_name(param):
                found_param = True
                # Replace malformed parameter with correct one
                needs_update = True
                kwonly_params[i] = self._create_param(
                    comma=(i < len(kwonly_params) - 1 or param.comma is not None)
                )
                break

        # Add parameter if not found
        if not found_param:
            needs_update = True
            if not kwonly_params and not updated_node.params.star_arg:
                # Add star separator if no kwonly params exist
                updated_node = updated_node.with_changes(
                    params=updated_node.params.with_changes(
                        star_arg=cst.ParamStar(),
                    )
                )
            kwonly_params.append(self._create_param())

        if needs_update:
            self.changes_made = True
            new_params = updated_node.params.with_changes(
                params=params,
                kwonly_params=kwonly_params,
            )
            return updated_node.with_changes(params=new_params)

        return updated_node
