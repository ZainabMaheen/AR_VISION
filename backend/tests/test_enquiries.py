import re

REQUEST = {
    "customer": {"name": "Sam Taylor", "email": "sam@example.com", "phone": "07700 900123", "postcode": "SW1A 1AA"},
    "notes": "Kitchen floor",
    "items": [
        {"materialName": "Carrara Vein", "areaSqFt": 120, "wastagePct": 10},
        {"materialName": "Alpine Mist"},
    ],
}


def test_guest_creates_enquiry_and_staff_change_status(client, business):
    res = client.post("/api/enquiries", json=REQUEST)  # guests may request a quote
    assert res.status_code == 201
    e = res.get_json()["data"]
    assert re.fullmatch(r"AV-[A-HJ-NP-Z2-9]{5}", e["reference"])
    assert e["status"] == "new"
    assert "staffNote" not in e  # customers do not see staff fields
    first = e["items"][0]
    assert first["orderSqFt"] == 132.0
    # Price comes from the database, even though prices are hidden from customers
    assert first["pricePerSqFtAtRequest"] == 9.5
    assert e["items"][1]["areaSqFt"] == 0 and e["items"][1]["wastagePct"] == 10

    res = client.patch(f"/api/enquiries/{e['id']}", json={"status": "quoted", "staffNote": "Quote emailed"}, headers=business)
    assert res.status_code == 200
    body = res.get_json()["data"]
    assert body["status"] == "quoted" and body["staffNote"] == "Quote emailed"

    assert client.patch(f"/api/enquiries/{e['id']}", json={"status": "lost"}, headers=business).status_code == 400
    assert client.patch(f"/api/enquiries/{e['id']}", json={}, headers=business).status_code == 400


def test_list_filter_and_search(client, business):
    a = client.post("/api/enquiries", json=REQUEST).get_json()["data"]
    client.post("/api/enquiries", json={**REQUEST, "customer": {"name": "Alex Doe", "email": "alex@example.com"}})
    client.patch(f"/api/enquiries/{a['id']}", json={"status": "confirmed"}, headers=business)

    all_ = client.get("/api/enquiries", headers=business).get_json()["data"]
    assert len(all_) == 2 and "scans" in all_[0]
    confirmed = client.get("/api/enquiries?status=confirmed", headers=business).get_json()["data"]
    assert [x["id"] for x in confirmed] == [a["id"]]
    found = client.get("/api/enquiries?q=alex", headers=business).get_json()["data"]
    assert len(found) == 1 and found[0]["customer"]["name"] == "Alex Doe"
    by_ref = client.get(f"/api/enquiries?q={a['reference']}", headers=business).get_json()["data"]
    assert [x["id"] for x in by_ref] == [a["id"]]
    assert client.get("/api/enquiries?status=lost", headers=business).status_code == 400
    assert client.get(f"/api/enquiries/{a['id']}", headers=business).get_json()["data"]["staffNote"] == ""


def test_staff_endpoints_need_business_account(client, customer):
    e = client.post("/api/enquiries", json=REQUEST).get_json()["data"]
    assert client.get("/api/enquiries").status_code == 401
    assert client.get("/api/enquiries", headers=customer).status_code == 403
    assert client.get(f"/api/enquiries/{e['id']}", headers=customer).status_code == 403
    assert client.patch(f"/api/enquiries/{e['id']}", json={"status": "quoted"}, headers=customer).status_code == 403


def test_enquiry_validation(client, business):
    bad_email = {**REQUEST, "customer": {"name": "Sam", "email": "not-an-email"}}
    assert client.post("/api/enquiries", json=bad_email).status_code == 400
    assert client.post("/api/enquiries", json={**REQUEST, "items": []}).status_code == 400
    unknown = {**REQUEST, "items": [{"materialName": "Unobtainium"}]}
    res = client.post("/api/enquiries", json=unknown)
    assert res.status_code == 400 and "not available" in res.get_json()["error"]
    # Guests cannot attach saved visualisations
    res = client.post("/api/enquiries", json={**REQUEST, "scanIds": [999]})
    assert res.status_code == 400 and "Sign in" in res.get_json()["error"]
    assert client.get("/api/enquiries/999", headers=business).status_code == 404


def test_hidden_material_cannot_be_requested(client, business):
    carrara = client.get("/api/materials").get_json()["data"][0]
    client.patch(f"/api/materials/{carrara['id']}", json={"visible": False}, headers=business)
    res = client.post("/api/enquiries", json=REQUEST)
    assert res.status_code == 400
