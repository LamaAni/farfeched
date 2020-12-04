import json
import os
from typing import Mapping

VSCODE_SERVER_FOLDER = os.environ.get("VSCODE_SERVER_FOLDER", None)
assert VSCODE_SERVER_FOLDER is not None, ValueError("VSCODE_SERVER_FOLDER env was not defined")

PRODUCT_JSON_SOURCE_PATH = f"{VSCODE_SERVER_FOLDER}/product.json"
PRODUCT_JSON_EXTEND_PATH = f"{__file__}.product.extend.json"


def update(d, u):
    for k, v in u.items():
        if isinstance(v, Mapping):
            d[k] = update(d.get(k, {}), v)
        else:
            d[k] = v
    return d


def read_as_json(src):
    with open(src, "r") as src_raw:
        return json.loads(src_raw.read())


def main():
    src = read_as_json(PRODUCT_JSON_SOURCE_PATH)
    extend = read_as_json(PRODUCT_JSON_EXTEND_PATH)
    src = update(src, extend)
    with open(PRODUCT_JSON_SOURCE_PATH, "w") as raw:
        raw.write(json.dumps(src, indent=4))


main()