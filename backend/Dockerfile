FROM python:3.10-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application
COPY ruffedlemur/ /app/ruffedlemur/

# Set environment variables
ENV PYTHONPATH=/app
ENV FLASK_APP=ruffedlemur/app.py

# Run the application
EXPOSE 5000
CMD ["gunicorn", "--bind", "0.0.0.0:5000", "ruffedlemur.wsgi:app"]
