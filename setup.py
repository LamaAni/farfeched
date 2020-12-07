#!/usr/bin/env python
# -*- coding: utf-8 -*-

import os
from setuptools import setup

REPO_PATH = os.path.abspath(os.path.dirname(__file__))


def get_version():
    version_file_path = os.path.join(REPO_PATH, "package_version.txt")
    if not os.path.isfile(version_file_path):
        return "debug"
    version = None
    with open(version_file_path, "r") as raw:
        version = raw.read()

    return version


def get_install_packages():
    packages = None
    with open(os.path.join(REPO_PATH, "requirements.txt"), "r") as raw:
        packages = raw.readlines()
    packages = [p for p in packages if p is not None and p.strip()]
    return packages


setup(
    name="farfetched",
    version=get_version(),
    description="A Kubernete/Docker remote development environment.",
    long_description="Please see readme.md @ https://github.com/LamaAni/farfeched",
    classifiers=[],
    scripts=["./scripts/cli/farfetched"],
    author="Zav Shotan",
    author_email="",
    url="https://github.com/LamaAni/farfeched",
    packages=["farfetched"],
    platforms="any",
    license="docs/LICENSE",
    install_requires=get_install_packages(),
    python_requires=">=3.6",
    include_package_data=True,
)
