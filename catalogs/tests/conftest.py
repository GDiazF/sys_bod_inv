import pytest

from catalogs.sync import sync_catalogos_globales


@pytest.fixture
def catalogos_globales(db):
    sync_catalogos_globales()
