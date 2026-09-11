import cv2
import os

# -----------------------------
# SETTINGS
# -----------------------------

CAMERA_INDEX = 1

# Folder where scanned images will be saved
SAVE_FOLDER = "scanned_products"

os.makedirs(SAVE_FOLDER, exist_ok=True)

# -----------------------------
# OPEN PHONE CAMERA
# -----------------------------

camera = cv2.VideoCapture(CAMERA_INDEX)

if not camera.isOpened():
    print("ERROR: Camera could not be opened.")
    print("Try changing CAMERA_INDEX from 1 to 0.")
    exit()

print("Camera started successfully.")
print("Press S = Scan / Save product")
print("Press Q = Quit")

# -----------------------------
# MAIN LOOP
# -----------------------------

while True:

    ret, frame = camera.read()

    if not ret:
        print("ERROR: Could not read camera frame.")
        break

    # Make a copy for displaying detection
    display = frame.copy()

    # -----------------------------
    # IMAGE PROCESSING
    # -----------------------------

    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)

    blur = cv2.GaussianBlur(gray, (5, 5), 0)

    edges = cv2.Canny(blur, 50, 150)

    # -----------------------------
    # FIND OBJECT CONTOURS
    # -----------------------------

    contours, _ = cv2.findContours(
        edges,
        cv2.RETR_EXTERNAL,
        cv2.CHAIN_APPROX_SIMPLE
    )

    largest = None
    largest_area = 0

    for contour in contours:

        area = cv2.contourArea(contour)

        if area > largest_area:
            largest_area = area
            largest = contour

    product_found = False

    x = y = w = h = 0

    # -----------------------------
    # DETECT PRODUCT
    # -----------------------------

    if largest is not None and largest_area > 5000:

        x, y, w, h = cv2.boundingRect(largest)

        # Ignore extremely small/strange regions
        if w > 100 and h > 100:

            product_found = True

            # Draw detection rectangle
            cv2.rectangle(
                display,
                (x, y),
                (x + w, y + h),
                (0, 255, 0),
                3
            )

            cv2.putText(
                display,
                "PRODUCT DETECTED",
                (x, max(y - 10, 30)),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.8,
                (0, 255, 0),
                2
            )

    # -----------------------------
    # DISPLAY STATUS
    # -----------------------------

    if product_found:

        cv2.putText(
            display,
            "Press S to scan",
            (20, 40),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.8,
            (0, 255, 0),
            2
        )

    else:

        cv2.putText(
            display,
            "Show packaged product",
            (20, 40),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.8,
            (0, 0, 255),
            2
        )

    cv2.putText(
        display,
        "Q = Quit",
        (20, display.shape[0] - 20),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.6,
        (255, 255, 255),
        2
    )

    # -----------------------------
    # SHOW CAMERA
    # -----------------------------

    cv2.imshow("SIH26034 - Smart Product Scanner", display)

    # -----------------------------
    # KEYBOARD CONTROLS
    # -----------------------------

    key = cv2.waitKey(1) & 0xFF

    # S = SCAN
    if key == ord('s'):

        if product_found:

            # Crop detected product
            crop = frame[y:y+h, x:x+w]

            # Save original detected product
            filename = os.path.join(
                SAVE_FOLDER,
                "product_scan.jpg"
            )

            cv2.imwrite(filename, crop)

            # -----------------------------
            # OCR-FRIENDLY IMAGE
            # -----------------------------

            # Resize
            scale = 2

            resized = cv2.resize(
                crop,
                None,
                fx=scale,
                fy=scale,
                interpolation=cv2.INTER_CUBIC
            )

            # Convert to grayscale
            crop_gray = cv2.cvtColor(
                resized,
                cv2.COLOR_BGR2GRAY
            )

            # Improve contrast
            enhanced = cv2.equalizeHist(crop_gray)

            # Reduce noise
            cleaned = cv2.GaussianBlur(
                enhanced,
                (3, 3),
                0
            )

            # Sharpen text
            sharpened = cv2.addWeighted(
                enhanced,
                1.5,
                cleaned,
                -0.5,
                0
            )

            # Save OCR-ready image
            ocr_filename = os.path.join(
                SAVE_FOLDER,
                "product_ocr.jpg"
            )

            cv2.imwrite(
                ocr_filename,
                sharpened
            )

            print()
            print("==============================")
            print("PRODUCT SCANNED SUCCESSFULLY")
            print("==============================")
            print("Original image:")
            print(filename)
            print()
            print("OCR image:")
            print(ocr_filename)
            print("==============================")

            # Show cropped product
            cv2.imshow(
                "Detected Product",
                crop
            )

            # Show OCR version
            cv2.imshow(
                "OCR Ready Image",
                sharpened
            )

        else:

            print("No product detected.")

    # Q = QUIT
    elif key == ord('q'):
        break


# -----------------------------
# CLOSE CAMERA
# -----------------------------

camera.release()

cv2.destroyAllWindows()

print("Scanner closed.")
