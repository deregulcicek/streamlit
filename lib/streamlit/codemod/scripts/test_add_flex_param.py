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

from streamlit.codemod.scripts.add_flex_param import transform_file


def test_transform():
    source = """
@gather_metrics("foo")
def some_function(self, x: int = 1) -> None:
    pass
    """

    expected = """
from elements.lib.flex import add_flex_to_proto
@gather_metrics("foo")
def some_function(self, x: int = 1, *, flex: int | str | None = None) -> None:
    pass
    """

    result = transform_file(source)
    assert result.strip() == expected.strip()


def test_transform_no_import_when_no_changes():
    source = """
@gather_metrics("balloons")
def some_function(self, x: int = 1) -> None:
    pass
    """

    result = transform_file(source)
    assert result.strip() == source.strip()
    assert "from elements.lib.flex import add_flex_to_proto" not in result


def test_transform_idempotent():
    source = """
from elements.lib.flex import add_flex_to_proto
@gather_metrics("foo")
def some_function(self, x: int = 1, *, flex: int | str | None = None) -> None:
    pass
    """

    result = transform_file(source)
    assert result.strip() == source.strip()


def test_transform_idempotent_flex_not_last():
    source = """
from elements.lib.flex import add_flex_to_proto
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
from elements.lib.flex import add_flex_to_proto
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
from elements.lib.flex import add_flex_to_proto
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
from elements.lib.flex import add_flex_to_proto
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
from elements.lib.flex import add_flex_to_proto
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
from elements.lib.flex import add_flex_to_proto
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
from elements.lib.flex import add_flex_to_proto
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
from elements.lib.flex import add_flex_to_proto
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
from elements.lib.flex import add_flex_to_proto
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
from elements.lib.flex import add_flex_to_proto
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
from elements.lib.flex import add_flex_to_proto
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
from elements.lib.flex import add_flex_to_proto
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


def test_transform_skip_patterns():
    sources = [
        """
@gather_metrics("column_config.text")
def some_function(x: int = 1) -> None:
    pass
    """,
        """
@gather_metrics("column_config.number")
def another_function(x: int = 1) -> None:
    pass
    """,
        """
@gather_metrics("balloons")
def balloon_function(x: int = 1) -> None:
    pass
    """,
        """
@gather_metrics("dialog")
def dialog_function(x: int = 1) -> None:
    pass
    """,
    ]

    for source in sources:
        result = transform_file(source)
        assert result.strip() == source.strip(), (
            "Functions with skip patterns should not be modified"
        )


def test_transform_non_skip_patterns():
    sources_and_expected = [
        (
            """
@gather_metrics("not_skipped")
def some_function(x: int = 1) -> None:
    pass
            """,
            """
from elements.lib.flex import add_flex_to_proto
@gather_metrics("not_skipped")
def some_function(x: int = 1, *, flex: int | str | None = None) -> None:
    pass
            """,
        ),
        (
            """
@gather_metrics("text_column")
def another_function(x: int = 1) -> None:
    pass
            """,
            """
from elements.lib.flex import add_flex_to_proto
@gather_metrics("text_column")
def another_function(x: int = 1, *, flex: int | str | None = None) -> None:
    pass
            """,
        ),
    ]

    for source, expected in sources_and_expected:
        result = transform_file(source)
        assert result.strip() == expected.strip(), (
            "Functions without skip patterns should be modified"
        )


def test_transform_keeps_existing_import():
    source = """
from elements.lib.flex import add_flex_to_proto
@gather_metrics("foo")
def some_function(self, x: int = 1) -> None:
    pass
    """

    expected = """
from elements.lib.flex import add_flex_to_proto
@gather_metrics("foo")
def some_function(self, x: int = 1, *, flex: int | str | None = None) -> None:
    pass
    """

    result = transform_file(source)
    assert result.strip() == expected.strip()
    # Verify import appears exactly once
    assert result.count("from elements.lib.flex import add_flex_to_proto") == 1


def test_transform_multiple_functions():
    source = """
@gather_metrics("foo")
def first_function(x: int = 1) -> None:
    pass

@gather_metrics("bar")
def second_function(y: str = "") -> None:
    pass
    """

    expected = """
from elements.lib.flex import add_flex_to_proto
@gather_metrics("foo")
def first_function(x: int = 1, *, flex: int | str | None = None) -> None:
    pass

@gather_metrics("bar")
def second_function(y: str = "", *, flex: int | str | None = None) -> None:
    pass
    """

    result = transform_file(source)
    assert result.strip() == expected.strip()
    # Verify import appears exactly once
    assert result.count("from elements.lib.flex import add_flex_to_proto") == 1


def test_transform_mixed_skip_patterns():
    source = """
@gather_metrics("foo")
def normal_function(x: int = 1) -> None:
    pass

@gather_metrics("balloons")
def skipped_function(y: str = "") -> None:
    pass
    """

    expected = """
from elements.lib.flex import add_flex_to_proto
@gather_metrics("foo")
def normal_function(x: int = 1, *, flex: int | str | None = None) -> None:
    pass

@gather_metrics("balloons")
def skipped_function(y: str = "") -> None:
    pass
    """

    result = transform_file(source)
    assert result.strip() == expected.strip()


def test_transform_with_proto_e2e():
    source = """
from streamlit.proto.Button_pb2 import Button as ButtonProto

@gather_metrics("button")
def button(self, label: str, key: Optional[str] = None):
    button_proto = ButtonProto()
    return button_proto
    """

    expected = """
from elements.lib.flex import add_flex_to_proto
from streamlit.proto.Button_pb2 import Button as ButtonProto

@gather_metrics("button")
def button(self, label: str, key: Optional[str] = None, *, flex: int | str | None = None):
    button_proto = ButtonProto()
    add_flex_to_proto(button_proto, flex)
    return button_proto
"""

    result = transform_file(source)
    assert result.strip() == expected.strip()


def test_transform_add_flex_call():
    source = """
from streamlit.proto.Arrow_pb2 import Arrow as ArrowProto

@gather_metrics("arrow")
def arrow(self, label: str = "", *, flex: int | str | None = None):
    arrow_proto = ArrowProto()
    return arrow_proto
    """

    expected = """
from elements.lib.flex import add_flex_to_proto
from streamlit.proto.Arrow_pb2 import Arrow as ArrowProto

@gather_metrics("arrow")
def arrow(self, label: str = "", *, flex: int | str | None = None):
    arrow_proto = ArrowProto()
    add_flex_to_proto(arrow_proto, flex)
    return arrow_proto
    """

    result = transform_file(source)
    assert result.strip() == expected.strip()


def test_transform_skip_existing_flex_call():
    source = """
from elements.lib.flex import add_flex_to_proto
from streamlit.proto.Arrow_pb2 import Arrow as ArrowProto

@gather_metrics("arrow")
def arrow(self, label: str = "", *, flex: int | str | None = None):
    arrow_proto = ArrowProto()
    add_flex_to_proto(arrow_proto, flex)
    return arrow_proto
    """

    result = transform_file(source)
    assert result.strip() == source.strip()


def test_transform_multiple_protos():
    source = """
from streamlit.proto.Arrow_pb2 import Arrow as ArrowProto
from streamlit.proto.Button_pb2 import Button as ButtonProto

@gather_metrics("multi")
def multi(self, *, flex: int | str | None = None):
    arrow = ArrowProto()
    button = ButtonProto()
    return arrow, button
    """

    expected = """
from elements.lib.flex import add_flex_to_proto
from streamlit.proto.Arrow_pb2 import Arrow as ArrowProto
from streamlit.proto.Button_pb2 import Button as ButtonProto

@gather_metrics("multi")
def multi(self, *, flex: int | str | None = None):
    arrow = ArrowProto()
    add_flex_to_proto(arrow, flex)
    button = ButtonProto()
    add_flex_to_proto(button, flex)
    return arrow, button
    """

    result = transform_file(source)
    assert result.strip() == expected.strip()


def test_transform_with_helper_function():
    source = """
from streamlit.proto.Arrow_pb2 import Arrow as ArrowProto

def _make_arrow(label: str) -> ArrowProto:
    arrow_proto = ArrowProto()
    return arrow_proto

@gather_metrics("arrow")
def arrow(self, label: str = "", *, flex: int | str | None = None):
    return self._make_arrow(label)
"""

    expected = """
from elements.lib.flex import add_flex_to_proto
from streamlit.proto.Arrow_pb2 import Arrow as ArrowProto

def _make_arrow(label: str, *, flex: int | str | None = None) -> ArrowProto:
    arrow_proto = ArrowProto()
    add_flex_to_proto(arrow_proto, flex)
    return arrow_proto

@gather_metrics("arrow")
def arrow(self, label: str = "", *, flex: int | str | None = None):
    return self._make_arrow(label, flex = flex)
"""

    result = transform_file(source)
    assert result.strip() == expected.strip()


def test_transform_with_helper_function_and_comments():
    source = """
from streamlit.proto.Arrow_pb2 import Arrow as ArrowProto

def _make_arrow(label: str) -> ArrowProto:
    arrow_proto = ArrowProto()
    return arrow_proto

@gather_metrics("arrow")
def arrow(self, label: str = "", *, flex: int | str | None = None):
    \"\"\"
    Display a dataframe as an interactive table.

    This command works with a wide variety of collection-like and
    dataframe-like object types.

    Parameters
    ----------
    label : str or None
        A string label to display above the table.

    Returns
    -------
    element or dict
        If ``on_select`` is ``"ignore"`` (default), this command returns an
        internal placeholder for the dataframe element that can be used
        with the ``.add_rows()`` method. Otherwise, this command returns a
        dictionary-like object that supports both key and attribute
        notation. The attributes are described by the ``DataframeState``
        dictionary schema.

    Examples
    --------

    **Example 1: Display a dataframe**

    >>> import streamlit as st
    >>> import pandas as pd
    >>> import numpy as np
    >>>
    >>> df = pd.DataFrame(np.random.randn(50, 20), columns=("col %d" % i for i in range(20)))
    >>>
    >>> st.dataframe(df)  # Same as st.write(df)

    .. output::
        https://doc-dataframe.streamlit.app/
        height: 500px

    \"\"\"
    return self._make_arrow(label)
"""

    expected = """
from elements.lib.flex import add_flex_to_proto
from streamlit.proto.Arrow_pb2 import Arrow as ArrowProto

def _make_arrow(label: str, *, flex: int | str | None = None) -> ArrowProto:
    arrow_proto = ArrowProto()
    add_flex_to_proto(arrow_proto, flex)
    return arrow_proto

@gather_metrics("arrow")
def arrow(self, label: str = "", *, flex: int | str | None = None):
    \"\"\"
    Display a dataframe as an interactive table.

    This command works with a wide variety of collection-like and
    dataframe-like object types.

    Parameters
    ----------
    label : str or None
        A string label to display above the table.

    flex : int | str | None
        A string or integer that determines the flex value of the element.

    Returns
    -------
    element or dict
        If ``on_select`` is ``"ignore"`` (default), this command returns an
        internal placeholder for the dataframe element that can be used
        with the ``.add_rows()`` method. Otherwise, this command returns a
        dictionary-like object that supports both key and attribute
        notation. The attributes are described by the ``DataframeState``
        dictionary schema.

    Examples
    --------

    **Example 1: Display a dataframe**

    >>> import streamlit as st
    >>> import pandas as pd
    >>> import numpy as np
    >>>
    >>> df = pd.DataFrame(np.random.randn(50, 20), columns=("col %d" % i for i in range(20)))
    >>>
    >>> st.dataframe(df)  # Same as st.write(df)

    .. output::
        https://doc-dataframe.streamlit.app/
        height: 500px

    \"\"\"
    return self._make_arrow(label, flex = flex)
"""

    result = transform_file(source)
    assert result.strip() == expected.strip()


def test_transform_with_helper_function_and_updates_comments():
    source = """
from streamlit.proto.Arrow_pb2 import Arrow as ArrowProto

def _make_arrow(label: str) -> ArrowProto:
    arrow_proto = ArrowProto()
    return arrow_proto

@gather_metrics("arrow")
def arrow(self, label: str = "", *, flex: int | str | None = None):
    \"\"\"
    Display a dataframe as an interactive table.

    This command works with a wide variety of collection-like and
    dataframe-like object types.

    Parameters
    ----------
    label : str or None
        A string label to display above the table.

    flex : int | None
        An outdated comment that should be updated

    Returns
    -------
    element or dict
        If ``on_select`` is ``"ignore"`` (default), this command returns an
        internal placeholder for the dataframe element that can be used
        with the ``.add_rows()`` method. Otherwise, this command returns a
        dictionary-like object that supports both key and attribute
        notation. The attributes are described by the ``DataframeState``
        dictionary schema.

    Examples
    --------

    **Example 1: Display a dataframe**

    >>> import streamlit as st
    >>> import pandas as pd
    >>> import numpy as np
    >>>
    >>> df = pd.DataFrame(np.random.randn(50, 20), columns=("col %d" % i for i in range(20)))
    >>>
    >>> st.dataframe(df)  # Same as st.write(df)

    .. output::
        https://doc-dataframe.streamlit.app/
        height: 500px

    \"\"\"
    return self._make_arrow(label)
"""

    expected = """
from elements.lib.flex import add_flex_to_proto
from streamlit.proto.Arrow_pb2 import Arrow as ArrowProto

def _make_arrow(label: str, *, flex: int | str | None = None) -> ArrowProto:
    arrow_proto = ArrowProto()
    add_flex_to_proto(arrow_proto, flex)
    return arrow_proto

@gather_metrics("arrow")
def arrow(self, label: str = "", *, flex: int | str | None = None):
    \"\"\"
    Display a dataframe as an interactive table.

    This command works with a wide variety of collection-like and
    dataframe-like object types.

    Parameters
    ----------
    label : str or None
        A string label to display above the table.

    flex : int | str | None
        A string or integer that determines the flex value of the element.

    Returns
    -------
    element or dict
        If ``on_select`` is ``"ignore"`` (default), this command returns an
        internal placeholder for the dataframe element that can be used
        with the ``.add_rows()`` method. Otherwise, this command returns a
        dictionary-like object that supports both key and attribute
        notation. The attributes are described by the ``DataframeState``
        dictionary schema.

    Examples
    --------

    **Example 1: Display a dataframe**

    >>> import streamlit as st
    >>> import pandas as pd
    >>> import numpy as np
    >>>
    >>> df = pd.DataFrame(np.random.randn(50, 20), columns=("col %d" % i for i in range(20)))
    >>>
    >>> st.dataframe(df)  # Same as st.write(df)

    .. output::
        https://doc-dataframe.streamlit.app/
        height: 500px

    \"\"\"
    return self._make_arrow(label, flex = flex)
"""

    result = transform_file(source)
    assert result.strip() == expected.strip()


def test_idempotent_transform_with_helper_function_and_comments():
    source = """
from elements.lib.flex import add_flex_to_proto
from streamlit.proto.Arrow_pb2 import Arrow as ArrowProto

def _make_arrow(label: str, *, flex: int | str | None = None) -> ArrowProto:
    arrow_proto = ArrowProto()
    add_flex_to_proto(arrow_proto, flex)
    return arrow_proto

@gather_metrics("arrow")
def arrow(self, label: str = "", *, flex: int | str | None = None):
    \"\"\"
    Display a dataframe as an interactive table.

    This command works with a wide variety of collection-like and
    dataframe-like object types.

    Parameters
    ----------
    label : str or None
        A string label to display above the table.

    flex : int | str | None
        A string or integer that determines the flex value of the element.

    Returns
    -------
    element or dict
        If ``on_select`` is ``"ignore"`` (default), this command returns an
        internal placeholder for the dataframe element that can be used
        with the ``.add_rows()`` method. Otherwise, this command returns a
        dictionary-like object that supports both key and attribute
        notation. The attributes are described by the ``DataframeState``
        dictionary schema.

    Examples
    --------

    **Example 1: Display a dataframe**

    >>> import streamlit as st
    >>> import pandas as pd
    >>> import numpy as np
    >>>
    >>> df = pd.DataFrame(np.random.randn(50, 20), columns=("col %d" % i for i in range(20)))
    >>>
    >>> st.dataframe(df)  # Same as st.write(df)

    .. output::
        https://doc-dataframe.streamlit.app/
        height: 500px

    \"\"\"
    return self._make_arrow(label, flex = flex)
"""

    result = transform_file(source)
    assert result.strip() == source.strip()
