from flask import Blueprint, request
from app.services.data_service import DataService
from app.utils.response import success, bad_request, not_found, internal_error
import io

data_bp = Blueprint('data', __name__)

@data_bp.route('/', methods=['GET'])
def get_data_list():
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 10, type=int)
    try:
        result = DataService.get_all_data(page, per_page)
        return success(result)
    except Exception as e:
        return internal_error(str(e))

@data_bp.route('/<int:data_id>', methods=['GET'])
def get_data(data_id):
    try:
        data = DataService.get_data_by_id(data_id)
        if not data:
            return not_found("Data not found")
        return success(data)
    except Exception as e:
        return internal_error(str(e))

@data_bp.route('/', methods=['POST'])
def add_data():
    data = request.get_json()
    if not data or 'features' not in data:
        return bad_request("Missing features")
    try:
        result = DataService.add_data(data['features'], data.get('label'))
        return success(result, "Data added successfully")
    except Exception as e:
        return internal_error(str(e))

@data_bp.route('/batch', methods=['POST'])
def add_batch_data():
    data_list = request.get_json()
    if not data_list or not isinstance(data_list, list):
        return bad_request("Invalid data format")
    try:
        result = DataService.add_batch_data(data_list)
        return success(result, "Batch data added successfully")
    except Exception as e:
        return internal_error(str(e))

@data_bp.route('/<int:data_id>', methods=['PUT'])
def update_data(data_id):
    data = request.get_json()
    if not data:
        return bad_request("Missing data")
    try:
        result = DataService.update_data(data_id, data.get('features'), data.get('label'))
        if not result:
            return not_found("Data not found")
        return success(result, "Data updated successfully")
    except Exception as e:
        return internal_error(str(e))

@data_bp.route('/<int:data_id>', methods=['DELETE'])
def delete_data(data_id):
    try:
        success_flag = DataService.delete_data(data_id)
        if not success_flag:
            return not_found("Data not found")
        return success(None, "Data deleted successfully")
    except Exception as e:
        return internal_error(str(e))

@data_bp.route('/statistics', methods=['GET'])
def get_statistics():
    try:
        result = DataService.get_statistics()
        return success(result)
    except Exception as e:
        return internal_error(str(e))

@data_bp.route('/import/process', methods=['POST'])
def import_process_data():
    try:
        result = DataService.import_process_data()
        return success(result, "Process data imported successfully")
    except ValueError as e:
        return bad_request(str(e))
    except Exception as e:
        return internal_error(str(e))

@data_bp.route('/import/quality', methods=['POST'])
def import_quality_data():
    try:
        result = DataService.import_quality_data()
        return success(result, "Quality data imported successfully")
    except ValueError as e:
        return bad_request(str(e))
    except Exception as e:
        return internal_error(str(e))

@data_bp.route('/import/material', methods=['POST'])
def import_material_data():
    try:
        result = DataService.import_material_data()
        return success(result, "Material batch data imported successfully")
    except ValueError as e:
        return bad_request(str(e))
    except Exception as e:
        return internal_error(str(e))

@data_bp.route('/import/equipment', methods=['POST'])
def import_equipment_data():
    try:
        result = DataService.import_equipment_data()
        return success(result, "Equipment status data imported successfully")
    except ValueError as e:
        return bad_request(str(e))
    except Exception as e:
        return internal_error(str(e))

@data_bp.route('/import/environment', methods=['POST'])
def import_environment_data():
    try:
        result = DataService.import_environment_data()
        return success(result, "Environment data imported successfully")
    except ValueError as e:
        return bad_request(str(e))
    except Exception as e:
        return internal_error(str(e))

@data_bp.route('/import/all', methods=['POST'])
def import_all_data():
    try:
        result = DataService.import_all_data()
        return success(result, "All data imported successfully")
    except ValueError as e:
        return bad_request(str(e))
    except Exception as e:
        return internal_error(str(e))

# 获取工艺参数数据
@data_bp.route('/process_data', methods=['GET'])
def get_process_data():
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    try:
        result = DataService.get_process_data(page, per_page)
        return success(result)
    except Exception as e:
        return internal_error(str(e))

# 获取物料批次数据
@data_bp.route('/material_batch', methods=['GET'])
def get_material_batch():
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    try:
        result = DataService.get_material_batch(page, per_page)
        return success(result)
    except Exception as e:
        return internal_error(str(e))

# 获取质量标签数据
@data_bp.route('/quality_label', methods=['GET'])
def get_quality_label():
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    try:
        result = DataService.get_quality_label(page, per_page)
        return success(result)
    except Exception as e:
        return internal_error(str(e))

# 获取设备状态数据
@data_bp.route('/equipment_status', methods=['GET'])
def get_equipment_status():
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    try:
        result = DataService.get_equipment_status(page, per_page)
        return success(result)
    except Exception as e:
        return internal_error(str(e))

# 获取环境参数数据
@data_bp.route('/environment_data', methods=['GET'])
def get_environment_data():
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    try:
        result = DataService.get_environment_data(page, per_page)
        return success(result)
    except Exception as e:
        return internal_error(str(e))

# 上传文件导入工艺参数数据
@data_bp.route('/upload/process', methods=['POST'])
def upload_process_data():
    if 'file' not in request.files:
        return bad_request("请选择要上传的文件")
    file = request.files['file']
    if file.filename == '':
        return bad_request("请选择要上传的文件")
    try:
        file_stream = io.StringIO(file.stream.read().decode('utf-8-sig'))
        result = DataService.upload_process_data(file_stream)
        return success(result, "工艺参数数据导入成功")
    except ValueError as e:
        return bad_request(str(e))
    except Exception as e:
        return internal_error(str(e))

# 上传文件导入物料批次数据
@data_bp.route('/upload/material', methods=['POST'])
def upload_material_data():
    if 'file' not in request.files:
        return bad_request("请选择要上传的文件")
    file = request.files['file']
    if file.filename == '':
        return bad_request("请选择要上传的文件")
    try:
        file_stream = io.StringIO(file.stream.read().decode('utf-8-sig'))
        result = DataService.upload_material_data(file_stream)
        return success(result, "物料批次数据导入成功")
    except ValueError as e:
        return bad_request(str(e))
    except Exception as e:
        return internal_error(str(e))

# 上传文件导入质量标签数据
@data_bp.route('/upload/quality', methods=['POST'])
def upload_quality_data():
    if 'file' not in request.files:
        return bad_request("请选择要上传的文件")
    file = request.files['file']
    if file.filename == '':
        return bad_request("请选择要上传的文件")
    try:
        file_stream = io.StringIO(file.stream.read().decode('utf-8-sig'))
        result = DataService.upload_quality_data(file_stream)
        return success(result, "质量标签数据导入成功")
    except ValueError as e:
        return bad_request(str(e))
    except Exception as e:
        return internal_error(str(e))

# 上传文件导入设备状态数据
@data_bp.route('/upload/equipment', methods=['POST'])
def upload_equipment_data():
    if 'file' not in request.files:
        return bad_request("请选择要上传的文件")
    file = request.files['file']
    if file.filename == '':
        return bad_request("请选择要上传的文件")
    try:
        file_stream = io.StringIO(file.stream.read().decode('utf-8-sig'))
        result = DataService.upload_equipment_data(file_stream)
        return success(result, "设备状态数据导入成功")
    except ValueError as e:
        return bad_request(str(e))
    except Exception as e:
        return internal_error(str(e))

# 上传文件导入环境参数数据
@data_bp.route('/upload/environment', methods=['POST'])
def upload_environment_data():
    if 'file' not in request.files:
        return bad_request("请选择要上传的文件")
    file = request.files['file']
    if file.filename == '':
        return bad_request("请选择要上传的文件")
    try:
        file_stream = io.StringIO(file.stream.read().decode('utf-8-sig'))
        result = DataService.upload_environment_data(file_stream)
        return success(result, "环境参数数据导入成功")
    except ValueError as e:
        return bad_request(str(e))
    except Exception as e:
        return internal_error(str(e))

# 删除工艺参数数据
@data_bp.route('/process_data/<int:id>', methods=['DELETE'])
def delete_process_data(id):
    try:
        result = DataService.delete_process_data(id)
        if not result:
            return not_found("数据不存在")
        return success(None, "工艺参数数据删除成功")
    except Exception as e:
        return internal_error(str(e))

# 删除物料批次数据
@data_bp.route('/material_batch/<int:id>', methods=['DELETE'])
def delete_material_batch(id):
    try:
        result = DataService.delete_material_batch(id)
        if not result:
            return not_found("数据不存在")
        return success(None, "物料批次数据删除成功")
    except Exception as e:
        return internal_error(str(e))

# 删除质量标签数据
@data_bp.route('/quality_label/<int:id>', methods=['DELETE'])
def delete_quality_label(id):
    try:
        result = DataService.delete_quality_label(id)
        if not result:
            return not_found("数据不存在")
        return success(None, "质量标签数据删除成功")
    except Exception as e:
        return internal_error(str(e))

# 删除设备状态数据
@data_bp.route('/equipment_status/<int:id>', methods=['DELETE'])
def delete_equipment_status(id):
    try:
        result = DataService.delete_equipment_status(id)
        if not result:
            return not_found("数据不存在")
        return success(None, "设备状态数据删除成功")
    except Exception as e:
        return internal_error(str(e))

# 删除环境参数数据
@data_bp.route('/environment_data/<int:id>', methods=['DELETE'])
def delete_environment_data(id):
    try:
        result = DataService.delete_environment_data(id)
        if not result:
            return not_found("数据不存在")
        return success(None, "环境参数数据删除成功")
    except Exception as e:
        return internal_error(str(e))

# 获取批次完整关联数据
@data_bp.route('/batch/<string:batch_id>', methods=['GET'])
def get_batch_with_relations(batch_id):
    try:
        result = DataService.get_batch_with_relations(batch_id)
        if not result:
            return not_found("批次数据不存在")
        return success(result)
    except Exception as e:
        return internal_error(str(e))

# 获取所有批次关联数据列表
@data_bp.route('/batches/relations', methods=['GET'])
def get_all_batches_with_relations():
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 10, type=int)
    try:
        result = DataService.get_all_batches_with_relations(page, per_page)
        return success(result)
    except Exception as e:
        return internal_error(str(e))