# Use Python 3.11 slim image
FROM python:3.11-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Set work directory
WORKDIR /app

# Install system dependencies including OpenCV requirements
RUN apt-get update && apt-get install -y \
    gcc \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender-dev \
    libgomp1 \
    libgtk-3-0 \
    libavcodec-dev \
    libavformat-dev \
    libswscale-dev \
    libv4l-dev \
    libxvidcore-dev \
    libx264-dev \
    libjpeg-dev \
    libpng-dev \
    libtiff-dev \
    # libatlas-base-dev \
    gfortran \
    wget \
    pkg-config \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY *.py ./
# COPY .env .
# COPY kovai-shines-472309-f936f974b4b8.json .

# Create directories for temporary files
RUN mkdir -p /tmp/uploads /tmp/videos

# Create non-root user for security
RUN useradd --create-home --shell /bin/bash app && chown -R app:app /app /tmp/uploads /tmp/videos
USER app

# Expose port
EXPOSE 8080

# Run the application with Gunicorn - increased timeout for video processing
CMD ["gunicorn", "--bind", "0.0.0.0:8080", "--workers", "1", "--timeout", "600", "--preload", "app:app"]