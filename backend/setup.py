from setuptools import setup, find_packages

setup(
    name="ruffedlemur",
    version="0.1.0",
    packages=find_packages(),
    install_requires=[
        "flask",
        "flask-sqlalchemy",
        "flask-migrate",
        "flask-jwt-extended",
        "flask-cors",
        "flask-smorest",
        "arrow",
        "cryptography",
        "requests",
        "typer",
        "python-dotenv",
        "redis",
    ],
    entry_points={
        "console_scripts": [
            "ruffedlemur=ruffedlemur.cliApp:app",
        ],
    },
)