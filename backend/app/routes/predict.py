from flask import Blueprint, request
from app.services.predict_service import PredictService
from app.utils.response import success, bad_request, not_found, internal_error

predict_bp = Blueprint('predict', __name__)

@predict_bp.route('/', methods=['POST', 'GET'])
def predict():
    if request.method == 'GET':
        return success({"status": "ready", "message": "Prediction service is running"}, "Prediction service is ready")
    
    data = request.get_json()
    if not data or 'features' not in data:
        return bad_request("Missing features")
    
    print(f"[PredictAPI] Received prediction request with features: {data['features']}")
    print(f"[PredictAPI] Received prediction request with material: {data.get('material')}")
    
    try:
        result = PredictService.predict(data['features'], data.get('material'))
        print(f"[PredictAPI] Prediction result: {result}")
        return success(result, "Prediction completed")
    except ValueError as e:
        print(f"[PredictAPI] ValueError: {str(e)}")
        return bad_request(str(e))
    except Exception as e:
        print(f"[PredictAPI] Exception: {str(e)}")
        return internal_error(str(e))

@predict_bp.route('/batch', methods=['POST'])
def batch_predict():
    data = request.get_json()
    if not data or 'features_list' not in data:
        return bad_request("Missing features_list")
    
    try:
        result = PredictService.batch_predict(data['features_list'])
        return success(result, "Batch prediction completed")
    except ValueError as e:
        return bad_request(str(e))
    except Exception as e:
        return internal_error(str(e))

@predict_bp.route('/history', methods=['GET'])
def get_predictions():
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 10, type=int)
    
    try:
        result = PredictService.get_predictions(page, per_page)
        return success(result)
    except Exception as e:
        return internal_error(str(e))

@predict_bp.route('/<int:prediction_id>', methods=['GET', 'DELETE'])
def get_prediction(prediction_id):
    if request.method == 'DELETE':
        try:
            result = PredictService.delete_prediction(prediction_id)
            if not result:
                return not_found("Prediction not found")
            return success({}, "Prediction deleted successfully")
        except Exception as e:
            return internal_error(str(e))
    
    try:
        result = PredictService.get_prediction_by_id(prediction_id)
        if not result:
            return not_found("Prediction not found")
        return success(result)
    except Exception as e:
        return internal_error(str(e))

@predict_bp.route('/history', methods=['DELETE'])
def delete_all_predictions():
    try:
        PredictService.delete_all_predictions()
        return success({}, "All predictions deleted successfully")
    except Exception as e:
        return internal_error(str(e))