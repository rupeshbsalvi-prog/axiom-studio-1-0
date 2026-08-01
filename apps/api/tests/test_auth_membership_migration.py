from pathlib import Path


MIGRATIONS = Path("apps/api/migrations/postgres")


def test_workspace_membership_migration_is_read_only_and_user_scoped():
    up = (MIGRATIONS / "0001_workspace_memberships.up.sql").read_text(
        encoding="utf-8"
    ).lower()

    assert "create table if not exists public.workspace_memberships" in up
    assert "primary key (workspace_id, user_id)" in up
    assert "enable row level security" in up
    assert "for select" in up
    assert "(select auth.uid()) = user_id" in up
    assert "status = 'active'" in up
    assert "grant select on public.workspace_memberships to authenticated" in up
    assert "grant insert" not in up
    assert "grant update" not in up
    assert "grant delete" not in up


def test_workspace_membership_migration_has_forward_rollback():
    down = (MIGRATIONS / "0001_workspace_memberships.down.sql").read_text(
        encoding="utf-8"
    ).lower()

    assert "drop policy if exists" in down
    assert "drop table if exists public.workspace_memberships" in down
