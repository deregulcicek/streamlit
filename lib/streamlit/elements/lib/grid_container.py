"""A container that lays out elements in a grid."""

from __future__ import annotations

from typing import TYPE_CHECKING, Literal, Sequence, cast, overload

from streamlit.delta_generator import DeltaGenerator
from streamlit.proto.Block_pb2 import Block as BlockProto

if TYPE_CHECKING:
    from types import TracebackType

    from streamlit.cursor import Cursor


class GridContainer(DeltaGenerator):
    """A container that lays out its children in a grid."""

    @staticmethod
    def _create(
        parent: DeltaGenerator,
        spec: int | Sequence[int | float],
        *,
        gap: Literal["small", "medium", "large"] = "small",
        vertical_alignment: Literal["top", "center", "bottom"] = "top",
        border: bool = False,
    ) -> GridContainer:
        """Create a new instance of GridContainer."""
        # Create grid container
        block_proto = BlockProto()
        block_proto.allow_empty = True

        # Set up grid properties
        grid = block_proto.grid
        if isinstance(spec, int):
            weights = [1.0 / spec] * spec
        else:
            total = sum(float(w) for w in spec)
            weights = [float(w) / total for w in spec]
        grid.weights.extend(weights)
        grid.gap = gap.lower()
        grid.vertical_alignment = getattr(
            BlockProto.Column.VerticalAlignment,
            vertical_alignment.upper(),
        )
        grid.show_border = border

        # Create grid container
        grid_container = cast(
            GridContainer,
            parent._block(block_proto=block_proto, dg_type=GridContainer),
        )

        return grid_container

    def __init__(
        self,
        root_container: int | None,
        cursor: Cursor | None,
        parent: DeltaGenerator | None,
        block_type: str | None,
    ):
        """Initialize the GridContainer."""
        super().__init__(root_container, cursor, parent, block_type)

    @overload
    def __enter__(self) -> GridContainer: ...

    def __enter__(self) -> GridContainer:
        """Enter the context manager."""
        super().__enter__()
        return self

    def __exit__(
        self,
        exc_type: type[BaseException] | None,
        exc_val: BaseException | None,
        exc_tb: TracebackType | None,
    ) -> Literal[False]:
        """Exit the context manager."""
        return super().__exit__(exc_type, exc_val, exc_tb)

    # def __getattr__(self, name: str) -> Any:
    #     """Forward any unknown attribute access to a new grid cell."""
    #     print("add")
    #     return getattr(self.container(key="foo"), name)
