"""All models, imported here so SQLAlchemy and Flask-Migrate see every table."""
from .base import enquiry_scans, project_scans  # noqa: F401
from .enquiry import Enquiry, EnquiryItem  # noqa: F401
from .material import Material  # noqa: F401
from .project import Project  # noqa: F401
from .scan import Scan  # noqa: F401
from .shop import Shop  # noqa: F401
from .user import User  # noqa: F401
