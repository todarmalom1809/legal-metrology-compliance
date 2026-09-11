import os
import json
import uuid
from datetime import datetime, timezone
from pathlib import Path

from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from google import genai


app = FastAPI(title="SIH26034 Compliance API")

# ============================================================
# CORS
# Allows the frontend (Vite dev server) to call this API from
# the browser. Add your deployed frontend URL to this list too.
# ============================================================

ALLOWED_ORIGINS = os.getenv(
    "ALLOWED_ORIGINS",
    "http://localhost:5173,http://127.0.0.1:5173"
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================
# IN-MEMORY SCAN HISTORY
# NOTE: this resets whenever the server restarts. Good enough
# for a demo / MVP. Swap for a real DB (SQLite/Postgres) later.
# ============================================================

SCAN_HISTORY: dict[str, dict] = {}


# ============================================================
# CONFIGURATION
# ============================================================

BASE_DIR = Path(__file__).parent
RULES_FILE = BASE_DIR / "rules.txt"
api_key = os.getenv("GEMINI_API_KEY")

if not api_key:
    raise RuntimeError("GEMINI_API_KEY is not set")

client = genai.Client(api_key=api_key)


# ============================================================
# LOAD RULES
# ============================================================

def load_rules():
    """
    Load the complete rule matrix from rules.json.txt.
    """

    if not RULES_FILE.exists():
        raise RuntimeError(
            f"{RULES_FILE.name} was not found in the backend folder."
        )

    try:
        with open(RULES_FILE, "r", encoding="utf-8") as f:
            return json.load(f)

    except json.JSONDecodeError as e:
        raise RuntimeError(
            f"{RULES_FILE.name} is not valid JSON: {str(e)}"
        )


RULES = load_rules()


# ============================================================
# RESPONSE NORMALIZATION
# Converts the raw Gemini-derived result (nested fields,
# rule_checks as a dict) into the flat shape the frontend's
# ScanResult type expects.
# ============================================================

def normalize_for_frontend(scan_id: str, raw_result: dict) -> dict:
    manufacturer = raw_result.get("manufacturer") or {}
    net_quantity = raw_result.get("net_quantity") or {}
    mrp = raw_result.get("mrp") or {}
    consumer_care = raw_result.get("consumer_care") or {}

    # overall_status: COMPLIANT/NON_COMPLIANT/MANUAL_REVIEW -> PASS/FLAG/MANUAL_REVIEW
    status_map = {
        "COMPLIANT": "PASS",
        "NON_COMPLIANT": "FLAG",
        "MANUAL_REVIEW": "MANUAL_REVIEW",
    }
    overall_status = status_map.get(
        raw_result.get("overall_status"), "MANUAL_REVIEW"
    )

    # rule_checks dict -> complianceChecks array
    rule_status_map = {
        "PASS": "PASS",
        "FLAG": "FLAG",
        "REVIEW": "MANUAL_REVIEW",
        "NOT_APPLICABLE": "PASS",
    }
    compliance_checks = []
    for rule_id, check in (raw_result.get("rule_checks") or {}).items():
        if not isinstance(check, dict):
            continue
        compliance_checks.append({
            "rule": rule_id,
            "status": rule_status_map.get(check.get("status"), "MANUAL_REVIEW"),
            "message": check.get("reason", ""),
        })

    # manual_review list -> warnings array
    warnings = [
        {"severity": "medium", "message": item}
        for item in (raw_result.get("manual_review") or [])
    ]

    address_parts = [manufacturer.get("address"), manufacturer.get("pin_code")]
    address = ", ".join(p for p in address_parts if p)
    if not address:
        address = consumer_care.get("address", "")

    mrp_display = mrp.get("raw_text") or (
        f"₹{mrp.get('value')}" if mrp.get("value") is not None else ""
    )
    quantity_display = net_quantity.get("raw_text") or (
        f"{net_quantity.get('value')} {net_quantity.get('unit', '')}".strip()
        if net_quantity.get("value") is not None else ""
    )

    return {
        "id": scan_id,
        "overallStatus": overall_status,
        "productName": raw_result.get("product_name", ""),
        "category": raw_result.get("product_category", ""),
        "mrp": mrp_display,
        "netQuantity": quantity_display,
        "manufacturerOrPacker": manufacturer.get("name", ""),
        "addressOrContact": address,
        "manufacturingOrPackingDate": raw_result.get("manufacturing_packing_date", ""),
        "complianceChecks": compliance_checks,
        "warnings": warnings,
        "scannedAt": datetime.now(timezone.utc).isoformat(),
    }


# ============================================================
# HOME
# ============================================================

@app.get("/")
def home():
    return {
        "message": "SIH26034 Backend is working!",
        "rules_loaded": True
    }


# ============================================================
# ANALYZE PRODUCT
# ============================================================

@app.post("/analyze")
async def analyze_product(file: UploadFile = File(...)):

    # --------------------------------------------------------
    # Check image
    # --------------------------------------------------------

    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(
            status_code=400,
            detail="Please upload a product image."
        )

    image_bytes = await file.read()

    if not image_bytes:
        raise HTTPException(
            status_code=400,
            detail="Uploaded image is empty."
        )

    # --------------------------------------------------------
    # Convert complete rules into text for Gemini
    # --------------------------------------------------------

    rules_text = json.dumps(
        RULES,
        indent=2,
        ensure_ascii=False
    )

    # --------------------------------------------------------
    # AI PROMPT
    # --------------------------------------------------------

    prompt = f"""
You are an AI assistant for a Legal Metrology packaged-commodity
compliance inspection system for SIH26034.

You will receive:
1. A photograph of a product/package label.
2. The complete SIH26034 rule matrix below.

YOUR MOST IMPORTANT JOB:

Use the COMPLETE rule matrix.

Do NOT check only a few selected rules.

You must consider every rule in the supplied rule matrix and determine
whether each rule is:

PASS
FLAG
REVIEW
NOT_APPLICABLE

Do not invent rules that are not present in the supplied rule matrix.

============================================================
COMPLETE SIH26034 RULE MATRIX
============================================================

{rules_text}

============================================================
IMAGE ANALYSIS INSTRUCTIONS
============================================================

Analyze the uploaded product label carefully.

Only report information that is actually visible or reasonably readable
in the image.

NEVER invent:
- product information
- manufacturer information
- dates
- MRP
- quantity
- addresses
- phone numbers
- email addresses

If something cannot be read, leave it empty or use null.

============================================================
RULE APPLICATION
============================================================

For EVERY rule in the rule matrix:

1. Identify the rule ID.
2. Determine whether it applies to this product.
3. Check the visible label against the rule.
4. Consider all exceptions mentioned in the rule matrix.
5. Give PASS, FLAG, REVIEW, or NOT_APPLICABLE.
6. Give a short explanation.

IMPORTANT:

Some requirements cannot be reliably verified from a photograph.

For example:
- physical numeral height
- exact physical dimensions
- physical sticker alteration
- actual measured weight

For these cases use REVIEW and explain that manual/physical
verification is required.

Do NOT claim that a photograph proves an exact millimetre measurement.

============================================================
PRODUCT-SPECIFIC RULES
============================================================

If the rule matrix contains product-specific requirements, identify the
product category first and apply the relevant product-specific rules.

For example, if the product is:
- biscuit
- bread
- cement
- agricultural produce
- another category contained in the rule matrix

then apply the relevant requirements from the matrix.

Do not apply a product-specific rule to an unrelated product.

============================================================
EXCEPTIONS
============================================================

Carefully consider every exception contained in the rule matrix.

If an exception makes a rule not applicable, return:

"status": "NOT_APPLICABLE"

and explain which exception applies.

If the image does not provide enough information to determine whether
an exception applies, use:

"status": "REVIEW"

instead of guessing.

============================================================
PROHIBITED QUANTITY WORDS
============================================================

Check quantity-related wording carefully.

Only flag words when they are being used in a quantity declaration.

Do NOT flag ordinary uses of words such as "about" when they are not
related to quantity.

============================================================
OUTPUT
============================================================

Return ONLY valid JSON.

Use this structure:

{{
  "product_name": "",
  "product_category": "",

  "manufacturer": {{
    "name": "",
    "address": "",
    "pin_code": ""
  }},

  "net_quantity": {{
    "value": null,
    "unit": "",
    "raw_text": ""
  }},

  "mrp": {{
    "value": null,
    "raw_text": "",
    "includes_taxes": null
  }},

  "manufacturing_packing_date": "",

  "consumer_care": {{
    "phone": "",
    "email": "",
    "address": ""
  }},

  "language": [],

  "prohibited_quantity_words": [],

  "possible_sticker": null,

  "ocr_confidence": 0,

  "rule_checks": {{}},

  "manual_review": [],

  "overall_status": ""
}}

============================================================
RULE_CHECKS REQUIREMENT
============================================================

The "rule_checks" object MUST contain EVERY RULE from the supplied
rule matrix.

Use the actual rule IDs from the matrix.

For example:

"rule_checks": {{
  "R-01": {{
    "status": "PASS",
    "reason": "..."
  }},
  "R-02": {{
    "status": "PASS",
    "reason": "..."
  }},
  "R-03": {{
    "status": "PASS",
    "reason": "..."
  }}
}}

Continue until ALL rules in the supplied matrix have been considered.

Do NOT create fake rule IDs.

============================================================
OVERALL STATUS
============================================================

Use:

COMPLIANT
if all applicable checks pass and there are no unresolved issues.

NON_COMPLIANT
if one or more applicable rules clearly fail.

MANUAL_REVIEW
if the result cannot be determined without physical/manual
verification and there is no clear compliance failure.

If there is a clear FLAG plus a manual review item, the overall result
should normally be NON_COMPLIANT because a known violation exists.

============================================================
FINAL CHECK BEFORE RESPONDING
============================================================

Before returning JSON, verify:

1. Product information was extracted only from the image.
2. ALL rules in the supplied rule matrix were considered.
3. Exceptions were considered.
4. Product-specific rules were considered where applicable.
5. Rules requiring physical verification were marked REVIEW.
6. No unsupported claims were made.
7. The response is valid JSON.
8. Return ONLY JSON.
"""


    # --------------------------------------------------------
    # SEND IMAGE + RULES TO GEMINI
    # --------------------------------------------------------

    try:

        response = client.models.generate_content(
            model="gemini-3.6-flash",
            contents=[
                {
                    "inline_data": {
                        "mime_type": file.content_type,
                        "data": image_bytes,
                    }
                },
                prompt,
            ],
        )

        result_text = response.text.strip()

        # ----------------------------------------------------
        # Remove markdown code fences if Gemini adds them
        # ----------------------------------------------------

        if result_text.startswith("```"):
            result_text = result_text.replace("```json", "")
            result_text = result_text.replace("```", "")
            result_text = result_text.strip()

        # ----------------------------------------------------
        # Convert AI response to JSON
        # ----------------------------------------------------

        result = json.loads(result_text)

        # ----------------------------------------------------
        # Make sure rule_checks exists
        # ----------------------------------------------------

        if "rule_checks" not in result:
            result["rule_checks"] = {}

        # ----------------------------------------------------
        # Check for missing rules
        # ----------------------------------------------------

        expected_rule_ids = []

        if isinstance(RULES, dict):

            # Try common structure:
            # rules -> list of rule objects
            if isinstance(RULES.get("rules"), list):

                for rule in RULES["rules"]:
                    if isinstance(rule, dict):

                        rule_id = (
                            rule.get("id")
                            or rule.get("rule_id")
                            or rule.get("rule")
                        )

                        if rule_id:
                            expected_rule_ids.append(str(rule_id))

            # Alternative structure:
            # rules -> dictionary
            elif isinstance(RULES.get("rules"), dict):

                expected_rule_ids = [
                    str(rule_id)
                    for rule_id in RULES["rules"].keys()
                ]

        # If we can determine expected IDs, add missing ones
        # as REVIEW instead of silently losing them.

        for rule_id in expected_rule_ids:

            if rule_id not in result["rule_checks"]:

                result["rule_checks"][rule_id] = {
                    "status": "REVIEW",
                    "reason": "Rule was not conclusively evaluated by AI; manual review required."
                }

                if "manual_review" not in result:
                    result["manual_review"] = []

                result["manual_review"].append(
                    f"{rule_id}: AI did not return a conclusive result."
                )

        # ----------------------------------------------------
        # Make sure manual_review exists
        # ----------------------------------------------------

        if "manual_review" not in result:
            result["manual_review"] = []

        # ----------------------------------------------------
        # Calculate overall status safely
        # ----------------------------------------------------

        statuses = []

        for check in result["rule_checks"].values():

            if isinstance(check, dict):

                status = check.get("status")

                if status:
                    statuses.append(status)

        if "FLAG" in statuses:
            result["overall_status"] = "NON_COMPLIANT"

        elif "REVIEW" in statuses:
            result["overall_status"] = "MANUAL_REVIEW"

        else:
            result["overall_status"] = "COMPLIANT"

        # ----------------------------------------------------
        # Normalize + store for history, then return
        # ----------------------------------------------------

        scan_id = str(uuid.uuid4())
        normalized = normalize_for_frontend(scan_id, result)
        SCAN_HISTORY[scan_id] = normalized

        return {
            "success": True,
            "filename": file.filename,
            "result": normalized,
            "raw_result": result
        }


    # --------------------------------------------------------
    # Invalid JSON from Gemini
    # --------------------------------------------------------

    except json.JSONDecodeError:

        return {
            "success": False,
            "filename": file.filename,
            "error": "AI returned an invalid JSON response.",
            "raw_ai_response": response.text if "response" in locals() else ""
        }


    # --------------------------------------------------------
    # Other errors
    # --------------------------------------------------------

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=f"AI analysis failed: {str(e)}"
        )


# ============================================================
# SCAN HISTORY
# ============================================================

@app.get("/history")
def get_history():
    """Returns all past scans, most recent first."""
    scans = sorted(
        SCAN_HISTORY.values(),
        key=lambda s: s.get("scannedAt", ""),
        reverse=True,
    )
    return {"scans": scans}


@app.get("/scan/{scan_id}")
def get_scan(scan_id: str):
    """Returns a single past scan by ID."""
    scan = SCAN_HISTORY.get(scan_id)
    if not scan:
        raise HTTPException(status_code=404, detail="Scan not found.")
    return {"result": scan}
