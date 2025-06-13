#!/bin/bash

# Check if ImageMagick is installed
if ! command -v convert &> /dev/null; then
    echo "ImageMagick is not installed. Please install it first."
    echo "On macOS: brew install imagemagick"
    echo "On Ubuntu: sudo apt-get install imagemagick"
    exit 1
fi

# Create optimized versions of service images
for i in {1..3}; do
    # Create placeholder service image
    convert -size 800x600 xc:#4CAF50 -gravity center -pointsize 40 -annotate 0 "Service $i" "assets/images/service-$i.jpg"
    
    # Create WebP version
    convert "assets/images/service-$i.jpg" "assets/images/service-$i.webp"
    
    # Create optimized versions at different sizes
    for size in 1280 960 640 320; do
        convert "assets/images/service-$i.jpg" -resize "${size}x" "assets/images/service-$i.optimized-${size}.jpg"
        convert "assets/images/service-$i.jpg" -resize "${size}x" "assets/images/service-$i.optimized-${size}.webp"
    done
done

# Create optimized versions of testimonial images
for i in {1..2}; do
    # Create placeholder testimonial image
    convert -size 400x400 xc:#45a049 -gravity center -pointsize 30 -annotate 0 "Testimonial $i" "assets/images/testimonial-$i.jpg"
    
    # Create WebP version
    convert "assets/images/testimonial-$i.jpg" "assets/images/testimonial-$i.webp"
    
    # Create optimized versions at different sizes
    for size in 1280 960 640 320; do
        convert "assets/images/testimonial-$i.jpg" -resize "${size}x" "assets/images/testimonial-$i.optimized-${size}.jpg"
        convert "assets/images/testimonial-$i.jpg" -resize "${size}x" "assets/images/testimonial-$i.optimized-${size}.webp"
    done
done

# Create a proper placeholder image
convert -size 800x600 xc:#f0f0f0 -gravity center -pointsize 40 -annotate 0 "Image Coming Soon" "assets/images/placeholder.jpg"
convert "assets/images/placeholder.jpg" "assets/images/placeholder.webp"

echo "Image optimization complete!" 