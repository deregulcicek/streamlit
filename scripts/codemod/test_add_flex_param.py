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

from add_flex_param import transform_file


def test_transform():
    source = """
@gather_metrics("foo")
def some_function(self, x: int = 1) -> None:
    pass
    """

    expected = """
@gather_metrics("foo")
def some_function(self, x: int = 1, *, flex: int | str | None = None) -> None:
    pass
    """

    result = transform_file(source)
    assert result.strip() == expected.strip()


def test_transform_idempotent():
    source = """
@gather_metrics("foo")
def some_function(self, x: int = 1, *, flex: int | str | None = None) -> None:
    pass
    """

    result = transform_file(source)
    assert result.strip() == source.strip(), (
        "Transform should not modify already correct functions"
    )


def test_transform_idempotent_flex_not_last():
    source = """
@gather_metrics("foo")
def some_function(self, x: int = 1, *, flex: int | str | None = None, y: str = "hello") -> None:
    pass
    """

    result = transform_file(source)
    assert result.strip() == source.strip(), (
        "Transform should not modify functions that already have flex parameter"
    )


def test_transform_with_star_args():
    source = """
@gather_metrics
def some_function(self, x: int = 1, *args) -> None:
    pass
    """

    expected = """
@gather_metrics
def some_function(self, x: int = 1, *args, flex: int | str | None = None) -> None:
    pass
    """

    result = transform_file(source)
    assert result.strip() == expected.strip()


def test_transform_with_kwargs():
    source = """
@gather_metrics
def some_function(self, x: int = 1, **kwargs) -> None:
    pass
    """

    expected = """
@gather_metrics
def some_function(self, x: int = 1, *, flex: int | str | None = None, **kwargs) -> None:
    pass
    """

    result = transform_file(source)
    assert result.strip() == expected.strip()


def test_transform_without_decorator():
    source = """
def some_function(self, x: int = 1) -> None:
    pass
    """

    result = transform_file(source)
    assert result.strip() == source.strip()


def test_transform_empty_params():
    source = """
@gather_metrics()
def some_function() -> None:
    pass
    """

    expected = """
@gather_metrics()
def some_function(*, flex: int | str | None = None) -> None:
    pass
    """

    result = transform_file(source)
    assert result.strip() == expected.strip()


def test_transform_positional_only():
    source = """
@gather_metrics("test")
def some_function(x: int, y: str, /) -> None:
    pass
    """

    expected = """
@gather_metrics("test")
def some_function(x: int, y: str, /, *, flex: int | str | None = None) -> None:
    pass
    """

    result = transform_file(source)
    assert result.strip() == expected.strip()


def test_transform_different_decorator_forms():
    sources_and_expected = [
        (
            """
@gather_metrics
def f(x): pass
        """,
            """
@gather_metrics
def f(x, *, flex: int | str | None = None): pass
        """,
        ),
        (
            """
@gather_metrics()
def f(x): pass
        """,
            """
@gather_metrics()
def f(x, *, flex: int | str | None = None): pass
        """,
        ),
        (
            """
@gather_metrics("test")
def f(x): pass
        """,
            """
@gather_metrics("test")
def f(x, *, flex: int | str | None = None): pass
        """,
        ),
    ]

    for source, expected in sources_and_expected:
        result = transform_file(source)
        assert result.strip() == expected.strip()


def test_transform_malformed_flex_types():
    sources_and_expected = [
        # Wrong type order
        (
            """
@gather_metrics
def f(x, *, flex: str | int | None = None): pass
        """,
            """
@gather_metrics
def f(x, *, flex: int | str | None = None): pass
        """,
        ),
        # Missing None
        (
            """
@gather_metrics
def f(x, *, flex: int | str = None): pass
        """,
            """
@gather_metrics
def f(x, *, flex: int | str | None = None): pass
        """,
        ),
        # Wrong separator
        (
            """
@gather_metrics
def f(x, *, flex: int or str or None = None): pass
        """,
            """
@gather_metrics
def f(x, *, flex: int | str | None = None): pass
        """,
        ),
        # Wrong default value
        (
            """
@gather_metrics
def f(x, *, flex: int | str | None = ""): pass
        """,
            """
@gather_metrics
def f(x, *, flex: int | str | None = None): pass
        """,
        ),
    ]

    for source, expected in sources_and_expected:
        result = transform_file(source)
        assert result.strip() == expected.strip(), (
            "Malformed flex parameter should be replaced with correct one"
        )
