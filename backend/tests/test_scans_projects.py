import io
import json
from pathlib import Path

from PIL import Image

from tests.conftest import make_image

CORNERS = [{"x": 0.1, "y": 0.5}, {"x": 0.9, "y": 0.5}, {"x": 1, "y": 1}, {"x": 0, "y": 1}]


def upload_scan(client, headers, **extra):
    data = {
        "name": "Kitchen floor",
        "materialName": "Carrara Vein",
        "corners": json.dumps(CORNERS),
        "tilesX": "6",
        "tilesY": "4",
        "light": "70",
        "room": (make_image(), "room.jpg"),
        "thumbnail": (make_image("PNG", (800, 600)), "thumb.png"),
    }
    data.update(extra)
    return client.post("/api/scans", data=data, content_type="multipart/form-data", headers=headers)


def test_scan_upload_resizes_and_serves_files(client, app, customer):
    res = upload_scan(client, customer)
    assert res.status_code == 201, res.get_json()
    scan = res.get_json()["data"]
    assert scan["tilesX"] == 6 and scan["corners"][0] == {"x": 0.1, "y": 0.5}

    # Files are on disk (not in the DB), resized to max 1600 / 600 px
    room = Path(app.config["UPLOAD_FOLDER"]) / scan["roomImageUrl"].removeprefix("/api/uploads/")
    thumb = Path(app.config["UPLOAD_FOLDER"]) / scan["thumbnailUrl"].removeprefix("/api/uploads/")
    with Image.open(room) as im:
        assert max(im.size) == 1600 and im.format == "JPEG"
    with Image.open(thumb) as im:
        assert max(im.size) == 600

    served = client.get(scan["roomImageUrl"])  # image files are public (unguessable names)
    assert served.status_code == 200 and served.mimetype == "image/jpeg"
    served.close()

    res = client.patch(f"/api/scans/{scan['id']}", json={"name": "Kitchen v2"}, headers=customer)
    assert res.get_json()["data"]["name"] == "Kitchen v2"

    assert client.delete(f"/api/scans/{scan['id']}", headers=customer).status_code == 200
    assert not room.exists() and not thumb.exists()
    assert client.get(f"/api/scans/{scan['id']}", headers=customer).status_code == 404


def test_scan_validation(client, customer):
    assert upload_scan(client, customer, corners="[1,2]").status_code == 400
    assert upload_scan(client, customer, corners=json.dumps([{"x": 2, "y": 0}] * 4)).status_code == 400
    assert upload_scan(client, customer, materialName="Unobtainium").status_code == 400
    assert upload_scan(client, customer, tilesX="40").status_code == 400
    res = upload_scan(client, customer, room=(io.BytesIO(b"not an image"), "x.jpg"))
    assert res.status_code == 400 and "valid image" in res.get_json()["error"]
    res = client.post(
        "/api/scans", data={"name": "x", "materialName": "Carrara Vein", "corners": json.dumps(CORNERS)}, headers=customer
    )
    assert res.status_code == 400 and "room" in res.get_json()["error"]


def test_projects_with_scans(client, customer):
    h = customer
    scan = upload_scan(client, h).get_json()["data"]
    res = client.post("/api/projects", json={"name": "Kitchen renovation", "notes": "Budget 5k"}, headers=h)
    assert res.status_code == 201
    project = res.get_json()["data"]

    res = client.post(f"/api/projects/{project['id']}/scans", json={"scanIds": [scan["id"]]}, headers=h)
    assert res.status_code == 200 and res.get_json()["data"]["scanIds"] == [scan["id"]]
    assert client.post(f"/api/projects/{project['id']}/scans", json={"scanIds": [999]}, headers=h).status_code == 404

    listed = client.get("/api/projects", headers=h).get_json()["data"]
    assert listed[0]["scanCount"] == 1 and listed[0]["coverUrl"]

    # Deleting the scan removes it from the project
    client.delete(f"/api/scans/{scan['id']}", headers=h)
    assert client.get(f"/api/projects/{project['id']}", headers=h).get_json()["data"]["scanIds"] == []

    scan2 = upload_scan(client, h).get_json()["data"]
    client.post(f"/api/projects/{project['id']}/scans", json={"scanId": scan2["id"]}, headers=h)
    res = client.delete(f"/api/projects/{project['id']}/scans/{scan2['id']}", headers=h)
    assert res.status_code == 200 and res.get_json()["data"]["scanIds"] == []
    assert client.get(f"/api/scans/{scan2['id']}", headers=h).status_code == 200  # still saved

    assert client.patch(f"/api/projects/{project['id']}", json={"name": "Kitchen"}, headers=h).get_json()["data"]["name"] == "Kitchen"
    assert client.patch(f"/api/projects/{project['id']}", json={"name": "  "}, headers=h).status_code == 400
    assert client.delete(f"/api/projects/{project['id']}", headers=h).status_code == 200
    assert client.get(f"/api/projects/{project['id']}", headers=h).status_code == 404


def test_material_image_upload(client, business, customer):
    image = {"image": (make_image("PNG", (300, 300)), "m.png")}
    assert client.post("/api/uploads/materials", data=image, content_type="multipart/form-data", headers=customer).status_code == 403
    res = client.post(
        "/api/uploads/materials",
        data={"image": (make_image("PNG", (300, 300)), "m.png")},
        content_type="multipart/form-data",
        headers=business,
    )
    assert res.status_code == 201
    url = res.get_json()["data"]["url"]
    assert url.startswith("/api/uploads/materials/")
    r = client.get(url)
    assert r.status_code == 200
    r.close()
    assert client.get("/api/uploads/../app/config.py").status_code == 404
