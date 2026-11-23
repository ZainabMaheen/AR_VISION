from flask import Blueprint

from ..extensions import db
from ..models import Shop
from ..utils import validators as v
from ..utils.auth import business_required
from ..utils.responses import ok

bp = Blueprint("shop", __name__)


@bp.get("/shop")
def get_shop():
    # Public: customers need the shop name and whether prices are shown
    return ok(Shop.get().to_dict())


@bp.put("/shop")
@business_required
def update_shop():
    data = v.json_body()
    shop = Shop.get()
    shop.shop_name = v.text(data, "shopName", required=True, max_len=60)
    shop.logo_url = v.url(data, "logoUrl")
    shop.email = v.email(data, "email")
    shop.phone = v.text(data, "phone", max_len=30)
    shop.address = v.text(data, "address", max_len=300)
    shop.show_prices = v.boolean(data, "showPrices", default=False)
    db.session.commit()
    return ok(shop.to_dict())
