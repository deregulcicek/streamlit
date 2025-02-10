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


class AddFlexParamTransformer(cst.CSTTransformer):
    def _is_flex_param_name(self, param: cst.Param) -> bool:
        """Check if parameter is named flex."""
        return isinstance(param.name, cst.Name) and param.name.value == "flex"

    def _create_flex_param(self, comma: bool = True) -> cst.Param:
        """Create a correctly formatted flex parameter."""
        p = cst.Param(
            name=cst.Name("flex"),
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

    def leave_FunctionDef(
        self, original_node: cst.FunctionDef, updated_node: cst.FunctionDef
    ) -> cst.FunctionDef:
        # Check if function has @gather_metrics decorator
        has_gather_metrics = False
        for dec in original_node.decorators:
            # Check for both @gather_metrics and @gather_metrics()
            if isinstance(dec.decorator, cst.Call):
                if (
                    isinstance(dec.decorator.func, cst.Name)
                    and dec.decorator.func.value == "gather_metrics"
                ):
                    has_gather_metrics = True
                    break
            elif (
                isinstance(dec.decorator, cst.Name)
                and dec.decorator.value == "gather_metrics"
            ):
                has_gather_metrics = True
                break

        if not has_gather_metrics:
            return updated_node

        # Check for and fix any malformed flex parameters
        params = list(updated_node.params.params)
        kwonly_params = list(updated_node.params.kwonly_params)
        found_flex = False
        needs_update = False

        # Check and fix flex in regular params
        for i, param in enumerate(params):
            if self._is_flex_param_name(param):
                found_flex = True
                # Move flex to kwonly params if it's in regular params
                needs_update = True
                params.pop(i)
                kwonly_params.append(self._create_flex_param())
                break

        # Check and fix flex in kwonly params
        for i, param in enumerate(kwonly_params):
            if self._is_flex_param_name(param):
                found_flex = True
                # Replace malformed flex with correct one
                needs_update = True
                kwonly_params[i] = self._create_flex_param(
                    comma=(i < len(kwonly_params) - 1 or param.comma is not None)
                )
                break

        # Add flex if not found
        if not found_flex:
            needs_update = True
            if not kwonly_params and not updated_node.params.star_arg:
                # Add star separator if no kwonly params exist
                updated_node = updated_node.with_changes(
                    params=updated_node.params.with_changes(
                        star_arg=cst.ParamStar(),
                    )
                )
            kwonly_params.append(self._create_flex_param())

        if needs_update:
            new_params = updated_node.params.with_changes(
                params=params,
                kwonly_params=kwonly_params,
            )
            return updated_node.with_changes(params=new_params)

        return updated_node


def transform_file(source_code: str) -> str:
    source_tree = cst.parse_module(source_code)
    modified_tree = source_tree.visit(AddFlexParamTransformer())
    return modified_tree.code
