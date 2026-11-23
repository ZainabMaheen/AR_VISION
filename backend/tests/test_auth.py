import json

from app.extensions import db
from app.models import Enquiry, User
from tests.conftest import PASSWORD, login, make_user
from tests.test_scans_projects import upload_scan

NEW_ACCOUNT = {"name": "Jo Bloggs", "email": "Jo@Example.com", "password": "long-enough-pw"}


def test_register_login_and_me(client):
    res = client.post("/api/auth/register", json=NEW_ACCOUNT)
    assert res.status_code == 201
    body = res.get_json()["data"]
    assert body["token"] and body["user"] == {**body["user"], "name": "Jo Bloggs", "email": "jo@example.com", "role": "customer"}
    assert "password" not in json.dumps(body) and "password_hash" not in json.dumps(body)

    res = client.post("/api/auth/login", json={"email": "JO@example.com ", "password": "long-enough-pw"})
    assert res.status_code == 200
    token = res.get_json()["data"]["token"]
    me = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me.status_code == 200 and me.get_json()["data"]["email"] == "jo@example.com"


def test_register_rules(client):
    assert client.post("/api/auth/register", json={**NEW_ACCOUNT, "password": "short"}).status_code == 400
    assert client.post("/api/auth/register", json={**NEW_ACCOUNT, "email": "nope"}).status_code == 400
    assert client.post("/api/auth/register", json={**NEW_ACCOUNT, "name": ""}).status_code == 400
    assert client.post("/api/auth/register", json=NEW_ACCOUNT).status_code == 201
    dup = client.post("/api/auth/register", json={**NEW_ACCOUNT, "email": "jo@EXAMPLE.com"})
    assert dup.status_code == 409
    # Nobody can make themselves staff by registering
    res = client.post("/api/auth/register", json={**NEW_ACCOUNT, "email": "x@example.com", "role": "business"})
    assert res.get_json()["data"]["user"]["role"] == "customer"


def test_password_is_hashed(app, client):
    client.post("/api/auth/register", json=NEW_ACCOUNT)
    user = User.query.filter_by(email="jo@example.com").one()
    assert user.password_hash != NEW_ACCOUNT["password"] and user.check_password(NEW_ACCOUNT["password"])


def test_wrong_email_and_wrong_password_look_the_same(client, customer):
    wrong_pw = client.post("/api/auth/login", json={"email": "sam@example.com", "password": "nope-nope-nope"})
    no_user = client.post("/api/auth/login", json={"email": "ghost@example.com", "password": "nope-nope-nope"})
    assert wrong_pw.status_code == no_user.status_code == 401
    assert wrong_pw.get_json() == no_user.get_json() == {"error": "Email or password is incorrect."}
    assert client.post("/api/auth/login", json={"email": "", "password": ""}).status_code == 400


def test_repeated_failed_logins_are_blocked(app, client):
    make_user("lock@example.com")
    for _ in range(app.config["LOGIN_MAX_FAILURES"]):
        assert client.post("/api/auth/login", json={"email": "lock@example.com", "password": "bad-password"}).status_code == 401
    blocked = client.post("/api/auth/login", json={"email": "lock@example.com", "password": PASSWORD})
    assert blocked.status_code == 429 and "Too many" in blocked.get_json()["error"]
    # Other accounts are not affected
    make_user("free@example.com")
    assert client.post("/api/auth/login", json={"email": "free@example.com", "password": PASSWORD}).status_code == 200


def test_tokens_are_checked(client):
    assert client.get("/api/auth/me").status_code == 401
    assert client.get("/api/auth/me").get_json() == {"error": "Please sign in to continue."}
    bad = client.get("/api/auth/me", headers={"Authorization": "Bearer not-a-real-token"})
    assert bad.status_code == 401 and "error" in bad.get_json()


def test_business_routes_reject_guests_and_customers(client, customer):
    for method, url in [
        ("post", "/api/materials"),
        ("patch", "/api/materials/1"),
        ("put", "/api/materials/1"),
        ("delete", "/api/materials/1"),
        ("post", "/api/materials/restore-samples"),
        ("put", "/api/shop"),
        ("get", "/api/enquiries"),
        ("post", "/api/uploads/materials"),
    ]:
        assert getattr(client, method)(url, json={}).status_code == 401, (method, url)
        assert getattr(client, method)(url, json={}, headers=customer).status_code == 403, (method, url)
    assert client.get("/api/materials?include_hidden=true", headers=customer).status_code == 403
    assert client.get("/api/materials?include_hidden=true").status_code == 401
    # Public routes still work for guests
    assert client.get("/api/materials").status_code == 200
    assert client.get("/api/shop").status_code == 200


def test_scans_and_projects_are_private(client, customer, other_customer):
    assert client.get("/api/scans").status_code == 401
    assert client.get("/api/projects").status_code == 401

    scan = upload_scan(client, customer).get_json()["data"]
    project = client.post("/api/projects", json={"name": "Mine"}, headers=customer).get_json()["data"]

    assert client.get("/api/scans", headers=other_customer).get_json()["data"] == []
    assert client.get("/api/projects", headers=other_customer).get_json()["data"] == []
    for method, url in [
        ("get", f"/api/scans/{scan['id']}"),
        ("patch", f"/api/scans/{scan['id']}"),
        ("delete", f"/api/scans/{scan['id']}"),
        ("get", f"/api/projects/{project['id']}"),
        ("patch", f"/api/projects/{project['id']}"),
        ("delete", f"/api/projects/{project['id']}"),
    ]:
        assert getattr(client, method)(url, json={"name": "x"}, headers=other_customer).status_code == 404, (method, url)
    # Cannot add someone else's scan to your own project
    theirs = client.post("/api/projects", json={"name": "Theirs"}, headers=other_customer).get_json()["data"]
    res = client.post(f"/api/projects/{theirs['id']}/scans", json={"scanIds": [scan["id"]]}, headers=other_customer)
    assert res.status_code == 404


def test_customer_enquiry_links_user_and_own_scans(app, client, customer, other_customer, business):
    scan = upload_scan(client, customer).get_json()["data"]
    body = {
        "customer": {"name": "Sam Taylor", "email": "sam@example.com"},
        "items": [{"materialName": "Carrara Vein", "areaSqFt": 50}],
        "scanIds": [scan["id"]],
    }
    # Someone else cannot attach Sam's scan
    assert client.post("/api/enquiries", json=body, headers=other_customer).status_code == 400

    res = client.post("/api/enquiries", json=body, headers=customer)
    assert res.status_code == 201
    enquiry_id = res.get_json()["data"]["id"]
    sam = User.query.filter_by(email="sam@example.com").one()
    assert db.session.get(Enquiry, enquiry_id).user_id == sam.id

    # Staff see the attached scan, in the enquiry and on its own
    detail = client.get(f"/api/enquiries/{enquiry_id}", headers=business).get_json()["data"]
    assert [s["id"] for s in detail["scans"]] == [scan["id"]]
    assert client.get(f"/api/scans/{scan['id']}", headers=business).status_code == 200

    # If Sam deletes it, the shop still keeps it for the enquiry
    assert client.delete(f"/api/scans/{scan['id']}", headers=customer).status_code == 200
    assert client.get("/api/scans", headers=customer).get_json()["data"] == []
    detail = client.get(f"/api/enquiries/{enquiry_id}", headers=business).get_json()["data"]
    assert [s["id"] for s in detail["scans"]] == [scan["id"]]


def test_create_business_user_command(app, client):
    runner = app.test_cli_runner()
    res = runner.invoke(args=["create-business-user", "--name", "Owner", "--email", "Owner@Shop.test", "--password", "shop-owner-pw"])
    assert res.exit_code == 0, res.output
    assert "Business account ready" in res.output
    assert User.query.filter_by(email="owner@shop.test").one().role == "business"

    again = runner.invoke(args=["create-business-user", "--name", "Owner", "--email", "owner@shop.test", "--password", "another-pw-1"])
    assert again.exit_code != 0 and "already exists" in again.output
    reset = runner.invoke(
        args=["create-business-user", "--name", "Owner", "--email", "owner@shop.test", "--password", "another-pw-1", "--reset"]
    )
    assert reset.exit_code == 0
    headers = login(client, "owner@shop.test", "another-pw-1")
    assert client.get("/api/enquiries", headers=headers).status_code == 200

    short = runner.invoke(args=["create-business-user", "--name", "X", "--email", "x@shop.test", "--password", "short"])
    assert short.exit_code != 0


def test_cors_allows_authorization_header(client):
    res = client.options(
        "/api/auth/me",
        headers={
            "Origin": "http://localhost:5173",
            "Access-Control-Request-Method": "GET",
            "Access-Control-Request-Headers": "Authorization",
        },
    )
    assert res.headers.get("Access-Control-Allow-Origin") == "http://localhost:5173"
    assert "authorization" in (res.headers.get("Access-Control-Allow-Headers") or "").lower()
