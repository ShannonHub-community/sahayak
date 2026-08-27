"""
tests/fake_supabase.py — minimal in-memory double for the pieces of the
supabase-py client interface service.py actually uses.

Was missing entirely — three of the four flood_engine test files import
`from tests.fake_supabase import FakeSupabase` and would fail to even
collect without it. This is not a reimplementation of PostgREST — just
enough chainable .table().select()/.insert()/.update()/.eq()/.order()/
.limit()/.execute() behaviour to exercise service.py's logic against an
in-memory store, with zero network/database dependency.
"""
import uuid


class _TableStore:
    def __init__(self):
        self.rows: list[dict] = []


class _Response:
    def __init__(self, data):
        self.data = data


class _Query:
    def __init__(self, store: _TableStore):
        self.store = store
        self._filters: list[tuple[str, object]] = []
        self._order_col = None
        self._order_desc = False
        self._limit = None
        self._mode = None  # 'select' | 'insert' | 'update'
        self._insert_rows = None
        self._update_values = None

    def select(self, *_args, **_kwargs):
        self._mode = "select"
        return self

    def insert(self, rows):
        self._mode = "insert"
        self._insert_rows = rows if isinstance(rows, list) else [rows]
        return self

    def update(self, values):
        self._mode = "update"
        self._update_values = values
        return self

    def eq(self, col, val):
        self._filters.append((col, val))
        return self

    def order(self, col, desc=False):
        self._order_col = col
        self._order_desc = desc
        return self

    def limit(self, n):
        self._limit = n
        return self

    def execute(self):
        if self._mode == "insert":
            out = []
            for row in self._insert_rows:
                row = dict(row)
                row.setdefault("id", str(uuid.uuid4()))
                self.store.rows.append(row)
                out.append(row)
            return _Response(out)

        if self._mode == "update":
            matched = self._apply_filters(self.store.rows)
            for row in matched:
                row.update(self._update_values)
            return _Response(matched)

        # select (default mode if .select() was never explicitly called)
        rows = self._apply_filters(self.store.rows)
        if self._order_col:
            rows = sorted(
                rows,
                key=lambda r: (r.get(self._order_col) is None, r.get(self._order_col)),
                reverse=self._order_desc,
            )
        if self._limit is not None:
            rows = rows[: self._limit]
        return _Response(rows)

    def _apply_filters(self, rows):
        result = rows
        for col, val in self._filters:
            result = [r for r in result if r.get(col) == val]
        return result


class FakeSupabase:
    """Drop-in stand-in for the real supabase-py Client, for tests only."""

    def __init__(self):
        self._tables: dict[str, _TableStore] = {}

    def table(self, name: str) -> _Query:
        return _Query(self._tables.setdefault(name, _TableStore()))

    def seed(self, table_name: str, rows: list[dict]) -> None:
        store = self._tables.setdefault(table_name, _TableStore())
        for row in rows:
            row = dict(row)
            row.setdefault("id", str(uuid.uuid4()))
            store.rows.append(row)
