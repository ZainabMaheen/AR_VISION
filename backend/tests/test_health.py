def test_health_ok(client):
    res = client.get("/api/health")
    assert res.status_code == 200
    assert res.get_json() == {"data": {"status": "ok", "database": "ok"}}


def test_unknown_route_is_json_404(client):
    res = client.get("/api/nope")
    assert res.status_code == 404
    assert res.get_json() == {"error": "Not found."}


def test_wrong_method_is_json_405(client):
    res = client.delete("/api/health")
    assert res.status_code == 405
    assert "error" in res.get_json()


def test_cors_allows_frontend_origin(client):
    res = client.get("/api/health", headers={"Origin": "http://localhost:5173"})
    assert res.headers.get("Access-Control-Allow-Origin") == "http://localhost:5173"
    other = client.get("/api/health", headers={"Origin": "http://evil.example"})
    assert other.headers.get("Access-Control-Allow-Origin") is None
