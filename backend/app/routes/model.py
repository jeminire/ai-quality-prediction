from flask import Blueprint, request
from app.services.model_service import ModelService
from app.utils.response import success, bad_request, not_found, internal_error

model_bp = Blueprint('model', __name__)

@model_bp.route('/', methods=['GET'])
def get_models():
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 10, type=int)
    
    try:
        result = ModelService.get_models(page, per_page)
        return success(result)
    except Exception as e:
        return internal_error(str(e))

@model_bp.route('/<int:model_id>', methods=['GET'])
def get_model(model_id):
    try:
        model = ModelService.get_model_by_id(model_id)
        if not model:
            return not_found("Model not found")
        return success(model)
    except Exception as e:
        return internal_error(str(e))

@model_bp.route('/', methods=['POST'])
def train_model():
    data = request.get_json()
    if not data or 'name' not in data:
        return bad_request("Missing model name")
    
    try:
        result = ModelService.train_model(data['name'], data.get('version', '1.0.0'))
        return success(result, "Model trained successfully")
    except ValueError as e:
        return bad_request(str(e))
    except Exception as e:
        return internal_error(str(e))

@model_bp.route('/<int:model_id>', methods=['PUT'])
def update_model(model_id):
    data = request.get_json()
    if not data:
        return bad_request("Missing data")
    
    try:
        result = ModelService.update_model(model_id, **data)
        if not result:
            return not_found("Model not found")
        return success(result, "Model updated successfully")
    except Exception as e:
        return internal_error(str(e))

@model_bp.route('/<int:model_id>', methods=['DELETE'])
def delete_model(model_id):
    try:
        success_flag = ModelService.delete_model(model_id)
        if not success_flag:
            return not_found("Model not found")
        return success(None, "Model deleted successfully")
    except Exception as e:
        return internal_error(str(e))

@model_bp.route('/<int:model_id>/deploy', methods=['POST'])
def deploy_model(model_id):
    try:
        result = ModelService.deploy_model(model_id)
        if not result:
            return not_found("Model not found")
        return success(result, "Model deployed successfully")
    except Exception as e:
        return internal_error(str(e))

@model_bp.route('/latest', methods=['GET'])
def get_latest_model():
    try:
        result = ModelService.get_latest_model()
        if not result:
            return not_found("No model available")
        return success(result)
    except Exception as e:
        return internal_error(str(e))