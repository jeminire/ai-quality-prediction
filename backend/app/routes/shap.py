from flask import Blueprint, request
from app.services.shap_service import SHAPService
from app.utils.response import success, bad_request, not_found, internal_error

shap_bp = Blueprint('shap', __name__)

@shap_bp.route('/feature_importance', methods=['GET'])
def get_feature_importance():
    try:
        result = SHAPService.get_feature_importance()
        return success(result)
    except ValueError as e:
        return bad_request(str(e))
    except Exception as e:
        return internal_error(str(e))

@shap_bp.route('/explanation/<int:prediction_id>', methods=['GET'])
def get_explanation(prediction_id):
    try:
        result = SHAPService.get_explanation(prediction_id)
        if not result:
            return not_found("Prediction not found")
        return success(result)
    except ValueError as e:
        return bad_request(str(e))
    except Exception as e:
        return internal_error(str(e))

@shap_bp.route('/summary', methods=['GET'])
def get_summary():
    try:
        result = SHAPService.get_summary()
        return success(result)
    except ValueError as e:
        return bad_request(str(e))
    except Exception as e:
        return internal_error(str(e))