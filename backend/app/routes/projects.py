from flask import Blueprint, g

from ..extensions import db
from ..models import Project, Scan
from ..models.base import utcnow
from ..utils import validators as v
from ..utils.auth import login_required
from ..utils.responses import ok

bp = Blueprint("projects", __name__)

# Every route needs a signed-in user; a project belongs to the user who created it.


def _get_or_404(project_id: int) -> Project:
    project = db.session.get(Project, project_id)
    if project is None or project.user_id != g.auth_user.id:
        raise v.ValidationError("Project not found.", 404)
    return project


@bp.get("/projects")
@login_required
def list_projects():
    projects = Project.query.filter_by(user_id=g.auth_user.id).order_by(Project.updated_at.desc(), Project.id.desc()).all()
    return ok([p.to_dict() for p in projects])


@bp.get("/projects/<int:project_id>")
@login_required
def get_project(project_id: int):
    return ok(_get_or_404(project_id).to_dict(include_scans=True))


@bp.post("/projects")
@login_required
def create_project():
    data = v.json_body()
    project = Project(
        name=v.text(data, "name", required=True, max_len=60),
        notes=v.text(data, "notes", max_len=2000),
        user_id=g.auth_user.id,
    )
    db.session.add(project)
    db.session.commit()
    return ok(project.to_dict(include_scans=True), 201)


@bp.patch("/projects/<int:project_id>")
@login_required
def update_project(project_id: int):
    project = _get_or_404(project_id)
    data = v.json_body()
    if "name" in data:
        project.name = v.text(data, "name", required=True, max_len=60)
    if "notes" in data:
        project.notes = v.text(data, "notes", max_len=2000)
    db.session.commit()
    return ok(project.to_dict(include_scans=True))


@bp.delete("/projects/<int:project_id>")
@login_required
def delete_project(project_id: int):
    project = _get_or_404(project_id)
    db.session.delete(project)  # saved visualisations are kept
    db.session.commit()
    return ok({"id": project_id, "deleted": True})


@bp.post("/projects/<int:project_id>/scans")
@login_required
def add_scans(project_id: int):
    """Body: {"scanIds": [1, 2]} (or {"scanId": 1})."""
    project = _get_or_404(project_id)
    data = v.json_body()
    ids = v.id_list(data, "scanIds") if "scanIds" in data else v.id_list({"scanIds": [data.get("scanId")]}, "scanIds")
    if not ids:
        raise v.ValidationError("'scanIds' must list at least one saved visualisation.")
    scans = Scan.query.filter(Scan.id.in_(ids), Scan.user_id == g.auth_user.id).all()
    missing = sorted(set(ids) - {s.id for s in scans})
    if missing:
        raise v.ValidationError(f"Saved visualisation(s) not found: {', '.join(map(str, missing))}.", 404)
    for scan in scans:
        if scan not in project.scans:
            project.scans.append(scan)
    project.updated_at = utcnow()
    db.session.commit()
    return ok(project.to_dict(include_scans=True))


@bp.delete("/projects/<int:project_id>/scans/<int:scan_id>")
@login_required
def remove_scan(project_id: int, scan_id: int):
    project = _get_or_404(project_id)
    scan = next((s for s in project.scans if s.id == scan_id), None)
    if scan is None:
        raise v.ValidationError("That visualisation is not in this project.", 404)
    project.scans.remove(scan)
    project.updated_at = utcnow()
    db.session.commit()
    return ok(project.to_dict(include_scans=True))
