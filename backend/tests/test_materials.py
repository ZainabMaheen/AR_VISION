NEW = {
    "name": "Calacatta Gold",
    "category": "marble",
    "pricePerSqFt": 14.5,
    "availability": "made_to_order",
    "finish": "Polished",
    "tone": "Warm white",
    "description": "Bold gold veining.",
    "imageUrl": "https://example.com/calacatta.jpg",
    "visible": True,
}


def test_seeded_materials_listed(client):
    res = client.get("/api/materials")
    assert res.status_code == 200
    names = [m["name"] for m in res.get_json()["data"]]
    assert names == ["Carrara Vein", "Nero Marquina", "Alpine Mist", "Sandstone Beige", "Warm Travertine", "Silver Cloud"]


def test_prices_hidden_from_customers_until_shop_allows(client, business):
    public = client.get("/api/materials").get_json()["data"]
    assert all(m["pricePerSqFt"] is None for m in public)
    staff = client.get("/api/materials?include_hidden=true", headers=business).get_json()["data"]
    assert staff[0]["pricePerSqFt"] == 9.5

    shop = client.get("/api/shop").get_json()["data"]
    res = client.put("/api/shop", json={**shop, "showPrices": True}, headers=business)
    assert res.status_code == 200
    public = client.get("/api/materials").get_json()["data"]
    assert public[0]["pricePerSqFt"] == 9.5


def test_crud_and_hidden_filter(client, business):
    created = client.post("/api/materials", json=NEW, headers=business)
    assert created.status_code == 201
    m = created.get_json()["data"]
    assert m["name"] == "Calacatta Gold" and m["pricePerSqFt"] == 14.5

    assert client.get(f"/api/materials/{m['id']}").status_code == 200

    # Hide it: gone for customers, still there for staff
    res = client.patch(f"/api/materials/{m['id']}", json={"visible": False}, headers=business)
    assert res.status_code == 200 and res.get_json()["data"]["visible"] is False
    public = [x["name"] for x in client.get("/api/materials").get_json()["data"]]
    staff = [x["name"] for x in client.get("/api/materials?include_hidden=true", headers=business).get_json()["data"]]
    assert "Calacatta Gold" not in public and "Calacatta Gold" in staff
    assert client.get(f"/api/materials/{m['id']}").status_code == 404

    # PUT replaces all fields
    res = client.put(f"/api/materials/{m['id']}", json={**NEW, "name": "Calacatta Oro", "visible": True}, headers=business)
    assert res.status_code == 200 and res.get_json()["data"]["name"] == "Calacatta Oro"

    assert client.delete(f"/api/materials/{m['id']}", headers=business).status_code == 200
    assert client.get(f"/api/materials/{m['id']}?include_hidden=true", headers=business).status_code == 404


def test_duplicate_name_is_409(client, business):
    res = client.post("/api/materials", json={**NEW, "name": "carrara vein"}, headers=business)
    assert res.status_code == 409
    first = client.get("/api/materials").get_json()["data"][0]
    res = client.patch(f"/api/materials/{first['id']}", json={"name": "Nero Marquina"}, headers=business)
    assert res.status_code == 409


def test_validation_errors_are_400(client, business):
    h = business
    assert client.post("/api/materials", json={**NEW, "category": "wood"}, headers=h).status_code == 400
    assert client.post("/api/materials", json={**NEW, "pricePerSqFt": -1}, headers=h).status_code == 400
    assert client.post("/api/materials", json={**NEW, "pricePerSqFt": True}, headers=h).status_code == 400
    assert client.post("/api/materials", json={**NEW, "imageUrl": "javascript:alert(1)"}, headers=h).status_code == 400
    assert client.post("/api/materials", json={"category": "marble"}, headers=h).status_code == 400
    res = client.post("/api/materials", data="not json", content_type="text/plain", headers=h)
    assert res.status_code == 400 and "JSON" in res.get_json()["error"]
    assert client.get("/api/materials?category=wood").status_code == 400


def test_restore_samples_only_adds_missing(client, business):
    staff = client.get("/api/materials?include_hidden=true", headers=business).get_json()["data"]
    carrara, nero = staff[0], staff[1]
    client.delete(f"/api/materials/{carrara['id']}", headers=business)
    client.patch(f"/api/materials/{nero['id']}", json={"pricePerSqFt": 99}, headers=business)

    res = client.post("/api/materials/restore-samples", headers=business)
    assert res.status_code == 200
    assert res.get_json()["data"] == {"added": 1, "total": 6}
    after = {m["name"]: m for m in client.get("/api/materials?include_hidden=true", headers=business).get_json()["data"]}
    assert "Carrara Vein" in after
    assert after["Nero Marquina"]["pricePerSqFt"] == 99  # existing rows untouched
    assert client.post("/api/materials/restore-samples", headers=business).get_json()["data"]["added"] == 0


def test_missing_material_is_404(client):
    res = client.get("/api/materials/9999")
    assert res.status_code == 404
    assert res.get_json() == {"error": "Material not found."}
